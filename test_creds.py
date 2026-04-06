import subprocess
import re
from collections import defaultdict

def test_z_credentials(file_path):
    cmd = ["tshark", "-r", file_path, "-q", "-z", "credentials"]
    try:
        out = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
        lines = out.stdout.splitlines()
        
        creds = []
        packet_nums = []
        parsing = False
        
        for line in lines:
            if line.startswith("------"):
                parsing = True
                continue
            if parsing and line.startswith("======"):
                break
            if parsing and line.strip():
                # Format: Packet     Protocol         Username         Info
                # Example: 11         HTTP             admin            pass123
                parts = re.split(r'\s{2,}', line.strip(), maxsplit=3)
                if len(parts) >= 3:
                    packet_num = parts[0]
                    protocol = parts[1]
                    username = parts[2]
                    info = parts[3] if len(parts) > 3 else ""
                    
                    if packet_num.isdigit():
                        creds.append({
                            "packet": packet_num,
                            "protocol": protocol,
                            "username": username,
                            "password_snippet": info
                        })
                        packet_nums.append(packet_num)
        
        if not packet_nums:
            return []
            
        # Pass 1.b: Get IPs for these packets
        filter_str = " || ".join([f"frame.number=={num}" for num in packet_nums])
        if len(packet_nums) > 100:
            # Fallback if too many
            filter_str = "ftp or http or pop or imap or smtp or telnet"
            
        ip_cmd = [
            "tshark", "-r", file_path,
            "-Y", filter_str,
            "-T", "fields",
            "-E", "separator=|",
            "-e", "frame.number",
            "-e", "ip.src",
            "-e", "ip.dst"
        ]
        
        ip_out = subprocess.run(ip_cmd, capture_output=True, text=True, timeout=60)
        ip_map = {}
        for line in ip_out.stdout.splitlines():
            parts = line.strip().split("|")
            if len(parts) >= 3:
                frame, src, dst = parts[0], parts[1], parts[2]
                if frame:
                    ip_map[frame] = {"src": src, "dst": dst}
                    
        # Merge
        results = []
        for c in creds:
            frame = c["packet"]
            ips = ip_map.get(frame, {"src": "Unknown", "dst": "Unknown"})
            
            pwd = c.get("password_snippet", "")
            if len(pwd) > 2 and pwd != "Unknown":
                masked_pwd = pwd[:2] + "****"
            else:
                masked_pwd = pwd if pwd else "****"
                
            results.append({
                "protocol": c["protocol"],
                "client": ips["src"],
                "server": ips["dst"],
                "username": c["username"],
                "password_snippet": masked_pwd
            })
            
        return results
    except Exception as e:
        print("Error in z_credentials:", e)
        return []

def test_fields_credentials(file_path):
    cmd = [
        "tshark", "-r", file_path,
        "-Y", "ntlmssp.auth.username || pgsql.password || ldap.name || kerberos.name_string || tds.login.user_name || snmp.community || sip.auth.username || smtp.auth.username",
        "-T", "fields",
        "-E", "separator=|",
        "-e", "ip.src",
        "-e", "ip.dst",
        "-e", "ntlmssp.auth.username",
        "-e", "ntlmssp.auth.domain",
        "-e", "pgsql.user",
        "-e", "pgsql.password",
        "-e", "ldap.name",
        "-e", "kerberos.name_string",
        "-e", "tds.login.user_name",
        "-e", "snmp.community",
        "-e", "sip.auth.username",
        "-e", "smtp.auth.username",
        "-e", "smtp.auth.password"
    ]
    try:
        out = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
        results = []
        
        for line in out.stdout.splitlines():
            parts = line.strip().split("|")
            # Pad to the correct number of fields
            parts = (parts + [""] * 17)[:17]
            
            src, dst = parts[0], parts[1]
            ntlm_user, ntlm_domain = parts[2], parts[3]
            pg_user, pg_pass = parts[4], parts[5]
            ldap_name = parts[6]
            krb_name = parts[7]
            tds_user = parts[8]
            snmp_comm = parts[9]
            sip_user = parts[10]
            smtp_user, smtp_pass = parts[11], parts[12]
            
            # Helper to add
            def add_cred(proto, user, pwd):
                if user or pwd:
                    masked_pwd = pwd[:2] + "****" if pwd and len(pwd) > 2 else (pwd if pwd else "****")
                    results.append({
                        "protocol": proto,
                        "client": src,
                        "server": dst,
                        "username": user or "Unknown",
                        "password_snippet": masked_pwd
                    })
            
            if ntlm_user:
                add_cred("SMB/HTTP (NTLM)", ntlm_user, f"Domain: {ntlm_domain}" if ntlm_domain else "NTLM Hash")
            if pg_user or pg_pass:
                add_cred("PostgreSQL", pg_user, pg_pass)
            if ldap_name:
                add_cred("LDAP", ldap_name, "SASL/Simple Auth")
            if krb_name:
                add_cred("Kerberos", krb_name, "AS-REQ Ticket")
            if tds_user:
                add_cred("MSSQL (TDS)", tds_user, "TDS Login")
            if snmp_comm:
                # SNMP often repeats a million times per capture, so deduplication handles it
                add_cred("SNMP", "public/community", snmp_comm)
            if sip_user:
                add_cred("SIP", sip_user, "Digest Auth")
            if smtp_user or smtp_pass:
                add_cred("SMTP", smtp_user, smtp_pass)
                
        # Deduplicate
        unique_results = []
        seen = set()
        for r in results:
            key = (r["protocol"], r["client"], r["server"], r["username"])
            if key not in seen:
                seen.add(key)
                unique_results.append(r)
                
        return unique_results
    except Exception as e:
        print("Error in field credentials:", e)
        return []

if __name__ == "__main__":
    import sys
    pcap = sys.argv[1] if len(sys.argv) > 1 else "tmp/test_large_file.pcap"
    print("Pass 1: z_credentials")
    print(test_z_credentials(pcap))
    print("\nPass 2: fields_credentials")
    print(test_fields_credentials(pcap))
