import subprocess
import os
import re

def extract_credentials(file_path):
    results = []

    cmd_z = ["tshark", "-r", file_path, "-q", "-z", "credentials"]
    try:
        out_z = subprocess.run(cmd_z, capture_output=True, text=True, timeout=180)
        lines = out_z.stdout.splitlines()
        
        creds_z = []
        parsing = False
        
        for line in lines:
            if line.startswith("------"):
                parsing = True
                continue
            if parsing and line.startswith("======"):
                break
            if parsing and line.strip():
                parts = re.split(r'\s+', line.strip(), maxsplit=3)
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
                            "info": info
                        })
        
        if creds_z:
            packet_nums = [c["packet"] for c in creds_z]
            filter_str = " || ".join([f"frame.number=={num}" for num in packet_nums])
            if len(packet_nums) > 100:
                filter_str = "ftp or http or pop or imap or smtp or telnet"
                
            ip_cmd = [
                "tshark", "-r", file_path,
                "-Y", filter_str,
                "-T", "fields",
                "-E", "separator=|",
                "-e", "frame.number", "-e", "ip.src", "-e", "ip.dst", "-e", "tcp.stream", "-e", "udp.stream"
            ]
            ip_out = subprocess.run(ip_cmd, capture_output=True, text=True, timeout=60)
            
            p_map = {}
            for line in ip_out.stdout.splitlines():
                parts = line.strip().split("|")
                if len(parts) >= 5:
                    frame, src, dst, ts, us = parts[0], parts[1], parts[2], parts[3], parts[4]
                    if frame: p_map[frame] = {"src": src, "dst": dst, "stream": ts or us or "0"}
                        
            for c in creds_z:
                frame = c["packet"]
                meta = p_map.get(frame, {"src": "Unknown", "dst": "Unknown", "stream": "0"})
                
                raw_usr = c["username"]
                raw_info = str(c.get("info", ""))
                
                clean_pwd = re.sub(r'^(Password|Pass):\s*', '', raw_info, flags=re.I)
                clean_pwd = re.sub(r'Username in packet:\s*\d+', '', clean_pwd, flags=re.I).strip()
                
                clean_usr = re.sub(r'Username in packet:\s*\d+', '', raw_usr, flags=re.I).strip()
                clean_usr = re.sub(r'^Username:\s*', '', clean_usr, flags=re.I)

                results.append({
                    "protocol": c["protocol"].upper(),
                    "client": meta["src"],
                    "server": meta["dst"],
                    "stream": meta["stream"],
                    "username": clean_usr if clean_usr else "Unknown",
                    "password_snippet": clean_pwd if clean_pwd else "N/A"
                })
    except:
        pass

    cmd_f = [
        "tshark", "-r", file_path,
        "-Y", "ntlmssp.auth.username || pgsql.password || ldap.name || kerberos.name_string || tds.login.user_name || snmp.community || sip.auth.username || ftp.user || ftp.pass || http.authorization || imap.user || imap.pass || smtp.auth.username || smtp.auth.password || ftp.request.command || ftp.request.arg",
        "-T", "fields",
        "-E", "separator=|",
        "-e", "ip.src", "-e", "ip.dst", "-e", "tcp.stream", "-e", "udp.stream",
        "-e", "ntlmssp.auth.username", "-e", "ntlmssp.auth.domain",
        "-e", "pgsql.user", "-e", "pgsql.password",
        "-e", "ldap.name", "-e", "kerberos.name_string",
        "-e", "tds.login.user_name", "-e", "snmp.community",
        "-e", "sip.auth.username", "-e", "ftp.user", "-e", "ftp.pass",
        "-e", "http.authorization", "-e", "imap.user", "-e", "imap.pass",
        "-e", "smtp.auth.username", "-e", "smtp.auth.password",
        "-e", "ftp.request.command", "-e", "ftp.request.arg"
    ]
    try:
        out_f = subprocess.run(cmd_f, capture_output=True, text=True, timeout=120)
        for line in out_f.stdout.splitlines():
            parts = line.strip().split("|")
            while len(parts) < 23: parts.append("")
            src, dst, stream = parts[0], parts[1], (parts[2] or parts[3] or "0")
            
            def add_f(proto, user, pwd):
                if user or pwd:
                    results.append({
                        "protocol": proto, "client": src, "server": dst, "stream": stream,
                        "username": user or "Unknown", "password_snippet": str(pwd) if pwd else "N/A"
                    })
            if parts[4]: add_f("SMB", parts[4], f"Domain: {parts[5]}" if parts[5] else "Hash")
            if parts[6] or parts[7]: add_f("PostgreSQL", parts[6], parts[7])
            if parts[8]: add_f("LDAP", parts[8], "Auth Req")
            if parts[9]: add_f("Kerberos", parts[9], "Ticket")
            if parts[10]: add_f("MSSQL", parts[10], "Login")
            if parts[11]: add_f("SNMP", "public", parts[11])
            if parts[12]: add_f("SIP", parts[12], "Digest")
            if parts[13] or parts[14]: add_f("FTP", parts[13], parts[14])
            if parts[15]: add_f("HTTP", "Authorized", parts[15])
            if parts[16] or parts[17]: add_f("IMAP", parts[16], parts[17])
            if parts[18] or parts[19]: add_f("SMTP", parts[18], parts[19])
            
            f_cmd, f_arg = parts[20].upper(), parts[21]
            if f_cmd == "USER": add_f("FTP", f_arg, "N/A")
            elif f_cmd == "PASS": add_f("FTP", "Unknown", f_arg)
    except:
        pass

    merged = {}
    for c in results:
        key = (c["protocol"], c["stream"])
        if key not in merged:
            merged[key] = c
        else:
            m = merged[key]
            if c["username"] != "Unknown" and m["username"] == "Unknown":
                m["username"] = c["username"]
            if c["password_snippet"] != "N/A" and m["password_snippet"] == "N/A":
                m["password_snippet"] = c["password_snippet"]
            
            if m["client"] == "Unknown" and c["client"] != "Unknown":
                m["client"], m["server"] = c["client"], c["server"]
    
    return [v for v in merged.values()]
