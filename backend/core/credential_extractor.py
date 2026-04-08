# © Copyright 2026 Mohit Pal
# Licensed under the MIT;
# you may not use this file except in compliance with the License.
# SPDX-License-Identifier: MIT

import subprocess
import re

def extract_credentials(file_path):
    """
    Extracts credentials from a PCAP file using two complementary strategies:
    1. tshark -z credentials  -> High-level credential summary
    2. tshark -T fields       -> Per-packet field extraction for FTP/HTTP/IMAP/SMTP etc.

    Results from both strategies are merged using a session-signature key that combines
    sorted-IP pair + protocol + tcp.stream to ensure username & password packets in
    different packets are always paired correctly.
    """

    # ===========================================================================
    # SESSION STATE - keyed by (protocol, stream_id)
    # Each entry accumulates username and password_snippet from all packets
    # ===========================================================================
    sessions = {}  # key -> {"client", "server", "username", "password_snippet"}

    def _sig(proto, stream, src, dst):
        """Produce a stable session key regardless of packet direction."""
        proto = str(proto).upper().strip()
        stream = str(stream).strip()
        pair = tuple(sorted([str(src).strip(), str(dst).strip()]))
        # Primary key uses stream ID; secondary key uses IPs for cross-pass linking
        return (proto, stream, pair[0], pair[1])

    def _update(proto, src, dst, stream, username=None, password=None):
        """Upsert into the session state with data-greedy priority."""
        key = _sig(proto, stream, src, dst)
        if key not in sessions:
            sessions[key] = {
                "protocol": str(proto).upper().strip(),
                "client": src or "Unknown",
                "server": dst or "Unknown",
                "stream": stream or "0",
                "username": "Unknown",
                "password_snippet": "N/A"
            }

        sess = sessions[key]

        # Resolve IPs if current session has Unknown
        if sess["client"] == "Unknown" and src and src != "Unknown":
            sess["client"] = src
        if sess["server"] == "Unknown" and dst and dst != "Unknown":
            sess["server"] = dst

        # Update username if the new value is better (not Unknown/empty)
        if username:
            u = str(username).strip()
            if u and u.upper() not in ("UNKNOWN", "N/A", "USER", ""):
                sess["username"] = u

        # Update password if the new value is better (not N/A/empty)
        if password:
            p = str(password).strip()
            if p and p.upper() not in ("N/A", "UNKNOWN", ""):
                sess["password_snippet"] = p

    # ===========================================================================
    # STRATEGY 1 - tshark -z credentials
    # ===========================================================================
    try:
        cmd_z = ["tshark", "-r", file_path, "-q", "-z", "credentials"]
        out_z = subprocess.run(cmd_z, capture_output=True, text=True, timeout=300)

        parsing = False
        for line in out_z.stdout.splitlines():
            if line.startswith("------"):
                parsing = True
                continue
            if parsing and line.startswith("======"):
                break
            if not (parsing and line.strip()):
                continue

            # Format: PacketNum  Protocol  Username  Info
            parts = re.split(r'\s{2,}', line.strip(), maxsplit=3)
            if len(parts) < 2:
                parts = re.split(r'\s+', line.strip(), maxsplit=3)
            if len(parts) < 2 or not parts[0].isdigit():
                continue

            pkt_num = parts[0].strip()
            protocol = parts[1].strip().upper() if len(parts) > 1 else ""
            raw_user = parts[2].strip() if len(parts) > 2 else ""
            raw_info = parts[3].strip() if len(parts) > 3 else ""

            username = raw_user
            password = raw_info

            # FTP special handling: sometimes the "username" column holds the command
            if protocol == "FTP":
                cmd_upper = raw_user.upper()
                if "USER" in cmd_upper:
                    # e.g. raw_user="USER", raw_info="pedophile@..."
                    username = raw_info
                    password = None
                elif "PASS" in cmd_upper:
                    # e.g. raw_user="PASS", raw_info="thepassword"
                    password = raw_info
                    username = None
                else:
                    # Try cleaning standard "Password: X" prefix from info
                    pm = re.search(r'(?:Password|Pass)[: ]+(.+)', raw_info, re.I)
                    if pm:
                        password = pm.group(1).strip()

            # Get IP/stream for this packet number
            ip_cmd = [
                "tshark", "-r", file_path,
                "-Y", f"frame.number=={pkt_num}",
                "-2",
                "-T", "fields",
                "-E", "separator=|",
                "-e", "ip.src", "-e", "ip.dst", "-e", "tcp.stream", "-e", "udp.stream"
            ]
            try:
                ip_out = subprocess.run(ip_cmd, capture_output=True, text=True, timeout=30)
                for ip_line in ip_out.stdout.splitlines():
                    ip_parts = [p.strip() for p in ip_line.strip().split("|")]
                    if len(ip_parts) >= 4:
                        src, dst = ip_parts[0], ip_parts[1]
                        stream = ip_parts[2] or ip_parts[3] or pkt_num
                        _update(protocol, src, dst, stream, username, password)
                        break
            except Exception:
                # If IP lookup fails, store with packet number as stream
                _update(protocol, "Unknown", "Unknown", pkt_num, username, password)
    except Exception:
        pass

    # ===========================================================================
    # STRATEGY 2 - tshark field-by-field extraction (covers ALL FTP packets)
    # ===========================================================================
    try:
        cmd_f = [
            "tshark", "-r", file_path,
            "-2",
            "-Y", "ftp || http.authorization || ntlmssp || pgsql || ldap || kerberos || tds || snmp || sip || imap || smtp",
            "-T", "fields",
            "-E", "separator=|",
            # Network
            "-e", "ip.src",               # 0
            "-e", "ip.dst",               # 1
            "-e", "tcp.stream",           # 2
            "-e", "udp.stream",           # 3
            # SMB/NTLM
            "-e", "ntlmssp.auth.username",# 4
            "-e", "ntlmssp.auth.domain",  # 5
            # Postgres
            "-e", "pgsql.user",           # 6
            "-e", "pgsql.password",       # 7
            # LDAP / Kerberos
            "-e", "ldap.name",            # 8
            "-e", "kerberos.name_string", # 9
            # MSSQL
            "-e", "tds.login.user_name",  # 10
            # SNMP
            "-e", "snmp.community",       # 11
            # SIP
            "-e", "sip.auth.username",    # 12
            # FTP high-level username/password fields
            "-e", "ftp.user",             # 13
            "-e", "ftp.pass",             # 14
            # HTTP
            "-e", "http.authorization",   # 15
            # IMAP
            "-e", "imap.user",            # 16
            "-e", "imap.pass",            # 17
            # SMTP
            "-e", "smtp.auth.username",   # 18
            "-e", "smtp.auth.password",   # 19
            # FTP raw command/arg
            "-e", "ftp.request.command",  # 20
            "-e", "ftp.request.arg",      # 21
            # FTP auth extension fields
            "-e", "ftp.auth_user",        # 22
            "-e", "ftp.auth_pass",        # 23
            # Additional FTP variant fields
            "-e", "ftp.password",         # 24
            "-e", "ftp.arg",              # 25
        ]

        out_f = subprocess.run(cmd_f, capture_output=True, text=True, timeout=600)

        for line in out_f.stdout.splitlines():
            p = [x.strip() for x in line.strip().split("|")]
            while len(p) < 26:
                p.append("")

            src, dst = p[0], p[1]
            stream = p[2] or p[3] or "0"

            # --- SMB/NTLM ---
            if p[4]:
                _update("SMB", src, dst, stream, p[4], f"Domain: {p[5]}" if p[5] else "Hash")

            # --- PostgreSQL ---
            if p[6] or p[7]:
                _update("PostgreSQL", src, dst, stream, p[6], p[7])

            # --- LDAP ---
            if p[8]:
                _update("LDAP", src, dst, stream, p[8], "Auth Req")

            # --- Kerberos ---
            if p[9]:
                _update("Kerberos", src, dst, stream, p[9], "Ticket")

            # --- MSSQL ---
            if p[10]:
                _update("MSSQL", src, dst, stream, p[10], "Login")

            # --- SNMP ---
            if p[11]:
                _update("SNMP", src, dst, stream, "public", p[11])

            # --- SIP ---
            if p[12]:
                _update("SIP", src, dst, stream, p[12], "Digest")

            # --- FTP: aggregate every possible field combination ---
            f_cmd  = p[20].upper()  # e.g. "USER" or "PASS"
            f_arg  = p[21]          # ftp.request.arg
            f_alt  = p[25]          # ftp.arg

            if "USER" in f_cmd:
                # This packet carries the username
                usr = f_arg or f_alt or p[13] or p[22]
                if usr:
                    _update("FTP", src, dst, stream, username=usr)

            elif "PASS" in f_cmd:
                # This packet carries the password - check all possible fields
                pwd = f_arg or f_alt or p[14] or p[24] or p[23]
                if pwd:
                    _update("FTP", src, dst, stream, password=pwd)

            else:
                # No explicit command - check direct username/password fields
                ftp_u = p[13] or p[22]
                ftp_p = p[14] or p[24] or p[23]
                if ftp_u or ftp_p:
                    _update("FTP", src, dst, stream, ftp_u, ftp_p)

            # --- HTTP ---
            if p[15]:
                _update("HTTP", src, dst, stream, "Authorized", p[15])

            # --- IMAP ---
            if p[16] or p[17]:
                _update("IMAP", src, dst, stream, p[16], p[17])

            # --- SMTP ---
            if p[18] or p[19]:
                _update("SMTP", src, dst, stream, p[18], p[19])

    except Exception:
        pass

    # ===========================================================================
    # FINAL DEDUPLICATION
    # Group records with the same (protocol, stream) pair and merge the best data
    # ===========================================================================
    # Second-pass merge: link sessions that share (proto, stream) but differ in IPs
    # (can happen when one lookup resolved IPs and another did not)
    final_map = {}
    for key, sess in sessions.items():
        proto = key[0]
        stream = key[1]
        simple_key = (proto, stream)
        if simple_key not in final_map:
            final_map[simple_key] = dict(sess)
        else:
            m = final_map[simple_key]
            # Upgrade IPs
            if m["client"] == "Unknown" and sess["client"] != "Unknown":
                m["client"] = sess["client"]
            if m["server"] == "Unknown" and sess["server"] != "Unknown":
                m["server"] = sess["server"]
            # Upgrade username
            if m["username"] in ("Unknown", "") and sess["username"] not in ("Unknown", ""):
                m["username"] = sess["username"]
            # Upgrade password
            if m["password_snippet"] in ("N/A", "") and sess["password_snippet"] not in ("N/A", ""):
                m["password_snippet"] = sess["password_snippet"]

    return list(final_map.values())
