# © Copyright 2026 PES University.
#
# Authors:
#   Mohit Pal - mp65742@gmail.com
#   Swetha P - swethap@pes.edu
#
# Contributors:
#   PurpleSynapz
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# SPDX-License-Identifier: Apache-2.0

import subprocess

def extract_http_transactions(file_path):
    """
    Extracts HTTP request transaction metadata from a PCAP file.
    Does NOT extract the full payload to prevent memory issues.
    Instead, it retains the TCP stream index for on-demand fetch.
    """
    transactions = []
    
    cmd = [
        "tshark", "-r", file_path,
        "-Y", "http.request",
        "-T", "fields",
        "-E", "separator=|",
        "-e", "tcp.stream",
        "-e", "ip.src",
        "-e", "tcp.srcport",
        "-e", "ip.dst",
        "-e", "tcp.dstport",
        "-e", "http.request.method",
        "-e", "http.host",
        "-e", "http.request.uri"
    ]
    
    try:
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL,
            text=True
        )

        seen_streams = set()

        for line in process.stdout:
            parts = line.strip().split("|")
            parts = (parts + [""] * 8)[:8] # pad to 8 elements
            
            stream_idx = parts[0]
            src_ip = parts[1]
            src_port = parts[2]
            dst_ip = parts[3]
            dst_port = parts[4]
            method = parts[5]
            host = parts[6]
            uri = parts[7]
            
            if not stream_idx or not method:
                continue
                
            if stream_idx in seen_streams:
                continue
                
            seen_streams.add(stream_idx)
            
            if host and uri:
                full_url = f"http://{host}{uri}"
            elif uri:
                full_url = uri
            else:
                full_url = "Unknown"

            transactions.append({
                "stream_index": stream_idx,
                "client_ip": src_ip,
                "client_port": src_port,
                "server_ip": dst_ip,
                "server_port": dst_port,
                "server_host": host or dst_ip,
                "method": method,
                "url": full_url
            })

        process.wait()
    except Exception as e:
        print(f"HTTP transaction extraction failed: {e}")

    return transactions[:50]

if __name__ == "__main__":
    import sys
    print(extract_http_transactions(sys.argv[1] if len(sys.argv) > 1 else "tmp/test_large_file.pcap"))
