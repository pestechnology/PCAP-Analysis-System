import subprocess
import os
import re

def extract_credentials(file_path):
    """
    Extracts credentials using a highly optimized dual-layer approach.
    Pass 1: tshark -z credentials (handles stateful FTP, POP, IMAP, SMTP, HTTP, Telnet)
    Pass 2: tshark -T fields (handles complex hashes like NTLM, Kerberos, Postgres, LDAP, MSSQL, SIP, SNMP)
    """
    results = []

    # ==========================================
    # PASS 1: Stateful Extraction (-z credentials)
    # ==========================================
    cmd_z = ["tshark", "-r", file_path, "-q", "-z", "credentials"]
    try:
        out_z = subprocess.run(cmd_z, capture_output=True, text=True, timeout=180)
        lines = out_z.stdout.splitlines()
        
        creds_z = []
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
                parts = re.split(r'\s{2,}', line.strip(), maxsplit=3)
                if len(parts) >= 3:
                    packet_num = parts[0]
                    protocol = parts[1]
                    username = parts[2]
                    info = parts[3] if len(parts) > 3 else ""
                    
                    if packet_num.isdigit():
                        creds_z.append({
                            "packet": packet_num,
                            "protocol": protocol,
                            "username": username,
                            "password_snippet": info
                        })
                        packet_nums.append(packet_num)
        
        if packet_nums:
            filter_str = " || ".join([f"frame.number=={num}" for num in packet_nums])
            # Safety fallback if too many credentials exist to avoid argument list too long
            if len(packet_nums) > 100:
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
                        
            for c in creds_z:
                frame = c["packet"]
                ips = ip_map.get(frame, {"src": "Unknown", "dst": "Unknown"})
                
                pwd_snippet = c.get("password_snippet", "")
                pwd_str = str(pwd_snippet) if pwd_snippet else ""
                masked_pwd = pwd_str[:2] + "****" if len(pwd_str) > 2 else (pwd_str if pwd_str else "****")
                
                results.append({
                    "protocol": c["protocol"].upper(),
                    "client": ips["src"],
                    "server": ips["dst"],
                    "username": c["username"],
                    "password_snippet": masked_pwd
                })
    except Exception as e:
        print("Pass 1 extraction failed:", e)

    # ==========================================
    # PASS 2: Complex Hash Fields Extraction
    # ==========================================
    cmd_f = [
        "tshark", "-r", file_path,
        "-Y", "ntlmssp.auth.username || pgsql.password || ldap.name || kerberos.name_string || tds.login.user_name || snmp.community || sip.auth.username",
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
        "-e", "sip.auth.username"
    ]
    try:
        out_f = subprocess.run(cmd_f, capture_output=True, text=True, timeout=120)
        
        for line in out_f.stdout.splitlines():
            parts = line.strip().split("|")
            if len(parts) < 11:
                parts.extend([""] * (11 - len(parts)))
            
            src, dst = parts[0], parts[1]
            ntlm_user, ntlm_domain = parts[2], parts[3]
            pg_user, pg_pass = parts[4], parts[5]
            ldap_name = parts[6]
            krb_name = parts[7]
            tds_user = parts[8]
            snmp_comm = parts[9]
            sip_user = parts[10]
            
            def add_cred(proto: str, user: str, pwd_raw: str):
                if user or pwd_raw:
                    pwd_s = str(pwd_raw) if pwd_raw else ""
                    masked_pwd = pwd_s[:2] + "****" if len(pwd_s) > 2 else (pwd_s if pwd_s else "****")
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
                add_cred("SNMP", "public", f"Community: {snmp_comm}")
            if sip_user:
                add_cred("SIP", sip_user, "Digest Auth")
                
    except Exception as e:
        print("Pass 2 extraction failed:", e)

    # ==========================================
    # DEDUPLICATION
    # ==========================================
    unique_creds = []
    seen = set()
    for c in results:
        key = (c["protocol"], c["client"], c["server"], c["username"])
        if key not in seen:
            seen.add(key)
            unique_creds.append(c)
            
    return unique_creds
