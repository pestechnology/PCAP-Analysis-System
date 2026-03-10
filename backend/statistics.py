from collections import Counter, defaultdict
import ipaddress
import geoip2.database
import os
import re
from manuf import manuf
import subprocess
import statistics
import math

oui_parser = manuf.MacParser()

# =====================================================
# GEO
# =====================================================

GEO_DB_PATH = os.path.join(os.path.dirname(__file__), "geoip", "GeoLite2-City.mmdb")

geo_reader = None
if os.path.exists(GEO_DB_PATH):
    geo_reader = geoip2.database.Reader(GEO_DB_PATH)


oui_parser = manuf.MacParser()

def resolve_vendor(mac_full):
    vendor = oui_parser.get_manuf(mac_full)

    # If no vendor found → fallback to OUI
    if not vendor:
        return mac_full.upper().replace(":", "")[:6]

    # If vendor name looks invalid (too short / no space / weird format)
    if len(vendor) < 6 or re.match(r"^[A-Za-z0-9]+$", vendor):
        return mac_full.upper().replace(":", "")[:6]

    return vendor

# =====================================================
# IP CLASSIFICATION
# =====================================================

def classify_ip(ip):
    try:
        # Take first IP if comma-separated
        ip = ip.split(",")[0].strip()
        ip_obj = ipaddress.ip_address(ip)
    except:
        return "Public"

    if ip_obj.is_private:
        return "Private"
    if ip_obj.is_multicast:
        return "Multicast"
    if ip_obj.is_loopback:
        return "Loopback"
    if ip_obj.is_reserved or ip_obj.is_unspecified:
        return "Reserved"

    return "Public"


def run_tcp_analysis(file_path):

    import subprocess
    import tempfile
    import os

    total_retransmissions = 0
    fast_retransmissions = 0
    out_of_order = 0
    partial_retransmissions = 0
    total_tcp_packets = 0
    timeout_retransmissions = 0

    try:
        cmd = [
            "tshark",
            "-r", file_path,
            "-Y", "tcp",
            "-T", "fields",
            "-e", "tcp.analysis.retransmission",
            "-e", "tcp.analysis.fast_retransmission",
            "-e", "tcp.analysis.out_of_order",
            "-e", "tcp.analysis.partial_ack"
        ]

        result = subprocess.run(cmd, capture_output=True, text=True)

        if result.returncode == 0:
            lines = result.stdout.splitlines()

            for line in lines:
                total_tcp_packets += 1
                fields = line.split("\t")

                if len(fields) >= 1 and fields[0]:
                    total_retransmissions += 1

                if len(fields) >= 2 and fields[1]:
                    fast_retransmissions += 1

                if len(fields) >= 3 and fields[2]:
                    out_of_order += 1

                if len(fields) >= 4 and fields[3]:
                    partial_retransmissions += 1

            timeout_retransmissions = total_retransmissions - fast_retransmissions

    except Exception as e:
        print("Tshark TCP analysis failed:", e)

    retransmission_rate = (
        round((total_retransmissions / total_tcp_packets) * 100, 2)
        if total_tcp_packets > 0 else 0
    )

    if retransmission_rate < 1:
        severity = "normal"
        note = "Network stable."
    elif retransmission_rate < 5:
        severity = "medium"
        note = "Moderate retransmissions detected."
    else:
        severity = "high"
        note = "High retransmissions detected."

    return {
        "total_tcp_packets": total_tcp_packets,
        "timeout_retransmissions": timeout_retransmissions,
        "fast_retransmissions": fast_retransmissions,
        "partial_retransmissions": partial_retransmissions,
        "out_of_order": out_of_order,
        "retransmission_rate": retransmission_rate,
        "severity": severity,
        "note": note
    }

# -------------------------
# ENTROPY CALCULATION
# -------------------------
def shannon_entropy(values):
    if not values:
        return 0
    counts = Counter(values)
    total = len(values)
    entropy = 0
    for count in counts.values():
        p = count / total
        entropy -= p * math.log2(p)
    return entropy

# -------------------------
# BEHAVIOR ANALYSIS INTEGRATED WITH SURICATA
# -------------------------
def analyze_tcp_behavior_advanced(file_path):

    src_flows = defaultdict(lambda: {
        "syn": 0,
        "ack": 0,
        "rst": 0,
        "timestamps": [],
        "dst_ports": set(),
        "packet_sizes": [],
        "destinations": defaultdict(int),
        "handshakes": {},
        "handshake_completed": 0,
        "ja3": Counter()  # NEW
    })

    dst_targets = defaultdict(lambda: {
        "sources": set(),
        "syn": 0,
        "packets": 0
    })

    global_ja3_usage = Counter()  # NEW

    cmd = [
        "tshark",
        "-r", file_path,
        "-Y", "tcp",
        "-T", "fields",
        "-E", "separator=|",
        "-e", "frame.time_epoch",
        "-e", "ip.src",
        "-e", "ip.dst",
        "-e", "tcp.dstport",
        "-e", "tcp.flags.syn",
        "-e", "tcp.flags.ack",
        "-e", "tcp.flags.reset",
        "-e", "frame.len",
        "-e", "ssl.handshake.ja3"
    ]

    process = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.DEVNULL,
        text=True
    )

    for line in process.stdout:
        try:
            ts, src, dst, port, syn, ack, rst, length, ja3 = line.strip().split("|")

            if not src or not dst or not port:
                continue

            ts = float(ts)
            length = int(length)

            flow = src_flows[src]
            flow["timestamps"].append(ts)
            flow["packet_sizes"].append(length)
            flow["destinations"][dst] += 1
            flow["dst_ports"].add(port)

            if ja3:
                flow["ja3"][ja3] += 1
                global_ja3_usage[ja3] += 1

            conn_key = (dst, port)

            if syn == "1" and ack == "0":
                flow["syn"] += 1
                flow["handshakes"][conn_key] = "SYN_SENT"

            elif syn == "1" and ack == "1":
                if conn_key in flow["handshakes"]:
                    flow["handshakes"][conn_key] = "SYN_ACK"

            elif ack == "1":
                flow["ack"] += 1
                if conn_key in flow["handshakes"] and flow["handshakes"][conn_key] == "SYN_ACK":
                    flow["handshakes"][conn_key] = "ESTABLISHED"
                    flow["handshake_completed"] += 1

            if rst == "1":
                flow["rst"] += 1

            target = dst_targets[dst]
            target["sources"].add(src)
            target["packets"] += 1
            if syn == "1":
                target["syn"] += 1

        except:
            continue

    process.wait()

    results = {
        "risk_scores": {},
        "flagged_entities": []
    }

    # =====================================================
    # SOURCE IP ANALYSIS
    # =====================================================
    for ip, data in src_flows.items():

        score = 0
        reasons = []

        total_syn = data["syn"]
        completed = data["handshake_completed"]
        failed = total_syn - completed if total_syn > completed else 0
        failure_rate = (failed / total_syn) if total_syn > 0 else 0

        if total_syn > 100 and failure_rate > 0.6:
            score += 40
            reasons.append("SYN Flood Pattern")

        if len(data["dst_ports"]) > 50:
            score += 30
            reasons.append("Port Scanning")

        if data["rst"] > 30:
            score += 15
            reasons.append("Excessive RST")

        # -------------------------
        # Advanced C2 Detection
        # -------------------------
        if len(data["timestamps"]) > 20:

            timestamps = sorted(data["timestamps"])
            intervals = [
                timestamps[i+1] - timestamps[i]
                for i in range(len(timestamps) - 1)
            ]

            if len(intervals) > 10:

                mean_interval = statistics.mean(intervals)
                std_interval = statistics.pstdev(intervals)

                stable_intervals = 0
                if std_interval > 0:
                    for interval in intervals:
                        z = abs((interval - mean_interval) / std_interval)
                        if z < 1.0:
                            stable_intervals += 1

                total_packets = sum(data["destinations"].values())
                max_dest_ratio = (
                    max(data["destinations"].values()) / total_packets
                    if total_packets > 0 else 0
                )

                entropy = shannon_entropy(data["packet_sizes"])

                clusters = {}
                for ts in timestamps:
                    bucket = int(ts // 60)
                    clusters.setdefault(bucket, 0)
                    clusters[bucket] += 1

                cluster_consistency = len([
                    c for c in clusters.values() if c > 3
                ])

                if (
                    stable_intervals > len(intervals) * 0.7 and
                    max_dest_ratio > 0.7 and
                    entropy < 3.5 and
                    cluster_consistency > 2
                ):
                    score += 50
                    reasons.append("Advanced C2 Beaconing Pattern")

        # -------------------------
        # JA3 Fingerprint Detection
        # -------------------------
        if data["ja3"]:

            most_common_ja3, count = data["ja3"].most_common(1)[0]

            # Repeated same JA3
            if count > 20:
                score += 20
                reasons.append("Repeated TLS Fingerprint")

            # Rare JA3 globally
            if global_ja3_usage[most_common_ja3] == count:
                score += 20
                reasons.append("Rare TLS Fingerprint")

        if len(data["timestamps"]) > 500:
            score += 20
            reasons.append("High Traffic Burst")

        if score >= 40:
            results["flagged_entities"].append({
                "ip": ip,
                "score": score,
                "reasons": reasons,
                "unique_ports": len(data["dst_ports"]),
                "handshake_failure_rate": round(failure_rate, 2)
            })

        results["risk_scores"][ip] = score

    # =====================================================
    # DDoS Target Detection
    # =====================================================
    for target_ip, data in dst_targets.items():

        if data["packets"] > 1000 and len(data["sources"]) > 50:
            results["flagged_entities"].append({
                "ip": target_ip,
                "score": 90,
                "reasons": ["Potential DDoS Target"],
                "attacking_sources": len(data["sources"])
            })

    # ==========================================
    # SORT FLAGGED ENTITIES BY SEVERITY
    # Critical → High → Suspicious
    # ==========================================

    results["flagged_entities"] = sorted(
        results["flagged_entities"],
        key=lambda x: x["score"],
        reverse=True
    )

    return results

# =====================================================
# TLS METADATA EXTRACTION
# =====================================================

def extract_tls_metadata(file_path):

    tls_data = {
        "versions": defaultdict(int),
        "cipher_suites": defaultdict(int),
        "sni_domains": defaultdict(int),
        "ja3_fingerprints": defaultdict(int),
        "cert_issuers": defaultdict(int),
        "cert_subjects": defaultdict(int)
    }

    cmd = [
        "tshark",
        "-r", file_path,
        "-Y", "tls.handshake",
        "-T", "fields",
        "-E", "separator=|",
        "-e", "tls.handshake.version",
        "-e", "tls.handshake.ciphersuite",
        "-e", "tls.handshake.extensions_server_name",
        "-e", "tls.handshake.ja3",
        "-e", "x509ce.issuer",
        "-e", "x509ce.subject"
    ]

    process = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.DEVNULL,
        text=True
    )

    for line in process.stdout:
        try:
            version, cipher, sni, ja3, issuer, subject = line.strip().split("|")

            if version:
                tls_data["versions"][version] += 1

            if cipher:
                tls_data["cipher_suites"][cipher] += 1

            if sni:
                tls_data["sni_domains"][sni] += 1

            if ja3:
                tls_data["ja3_fingerprints"][ja3] += 1

            if issuer:
                tls_data["cert_issuers"][issuer] += 1

            if subject:
                tls_data["cert_subjects"][subject] += 1

        except:
            continue

    process.wait()

    return {
        "versions": dict(tls_data["versions"]),
        "cipher_suites": dict(tls_data["cipher_suites"]),
        "sni_domains": dict(tls_data["sni_domains"]),
        "ja3_fingerprints": dict(tls_data["ja3_fingerprints"]),
        "cert_issuers": dict(tls_data["cert_issuers"]),
        "cert_subjects": dict(tls_data["cert_subjects"]),
    }

# =====================================================
# MAIN ANALYSIS
# =====================================================

def extract_stats_core(file_path):

    src_ips = Counter()
    dst_ips = Counter()
    ip_types = Counter()
    country_traffic = Counter()
    mac_vendors = Counter()
    domains = set()
    urls = set()

    packet_sizes = []
    timestamps = []

    valid_packets = 0
    malformed_packets = 0
    fragmented_packets = 0
    jumbo_frames = 0

    public_ip_geo = {}
    protocol_counts = Counter()
    protocol_timeline = {}
    protocol_packet_index = {}

    cmd = [
        "tshark",
        "-r", file_path,
        "-T", "fields",
        "-E", "separator=|",
        "-E", "occurrence=f",
        "-e", "frame.number",
        "-e", "frame.len",
        "-e", "eth.src",
        "-e", "eth.dst",
        "-e", "frame.time_epoch",
        "-e", "ip.src",
        "-e", "ip.dst",
        "-e", "ip.flags.mf",
        "-e", "ip.frag_offset",
        "-e", "tcp.srcport",
        "-e", "tcp.dstport",
        "-e", "udp.srcport",
        "-e", "udp.dstport",
        "-e", "dns.qry.name",
        "-e", "http.host",
        "-e", "http.request.uri"
    ]

    process = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.DEVNULL,
        text=True,
        bufsize=1
    )

    for line in process.stdout:

        try:
            fields = line.strip().split("|")

            frame_no = int(fields[0])
            size = int(fields[1]) if fields[1] else 0
            timestamp = float(fields[2]) if fields[2] else None
            src = fields[3]
            dst = fields[4]
            mf_flag = fields[5]
            frag_offset = fields[6]
            tcp_sport = fields[7]
            tcp_dport = fields[8]
            udp_sport = fields[9]
            udp_dport = fields[10]
            dns_query = fields[11]
            http_host = fields[12]
            http_uri = fields[13]

            if size <= 0:
                malformed_packets += 1
                continue

            valid_packets += 1
            packet_sizes.append(size)

            if timestamp:
                timestamps.append(timestamp)

            if size > 1500:
                jumbo_frames += 1

            if src:
                src_ips[src] += 1
                try:
                    ip_class = classify_ip(src)
                    ip_types[ip_class] += 1
                except:
                    pass

            if dst:
                dst_ips[dst] += 1

            if mf_flag == "1" or frag_offset:
                fragmented_packets += 1

            # Protocol Detection
            if tcp_sport or tcp_dport:
                protocol_counts["TCP"] += 1
            if udp_sport or udp_dport:
                protocol_counts["UDP"] += 1
            if dns_query:
                protocol_counts["DNS"] += 1
                domains.add(dns_query)

            if http_host and http_uri:
                protocol_counts["HTTP"] += 1
                urls.add(f"http://{http_host}{http_uri}")

        except:
            malformed_packets += 1

    process.wait()

    total_packets = valid_packets + malformed_packets

    min_size = min(packet_sizes) if packet_sizes else 0
    max_size = max(packet_sizes) if packet_sizes else 0
    avg_size = round(sum(packet_sizes) / len(packet_sizes), 2) if packet_sizes else 0

    duration = max(timestamps) - min(timestamps) if timestamps else 0
    pps = round(total_packets / duration, 2) if duration > 0 else 0

    bins = {
        "0-200": 0,
        "201-400": 0,
        "401-800": 0,
        "801-1200": 0,
        "1201-1500": 0,
        "1500+": 0
    }

    for size in packet_sizes:
        if size <= 200:
            bins["0-200"] += 1
        elif size <= 400:
            bins["201-400"] += 1
        elif size <= 800:
            bins["401-800"] += 1
        elif size <= 1200:
            bins["801-1200"] += 1
        elif size <= 1500:
            bins["1201-1500"] += 1
        else:
            bins["1500+"] += 1

    return {
        "total_packets": total_packets,
        "valid_packets": valid_packets,
        "malformed_packets": malformed_packets,
        "fragmented_packets": fragmented_packets,
        "jumbo_frames": jumbo_frames,
        "geo_data": public_ip_geo,
        "country_traffic": country_traffic.most_common(50),
        "mac_vendors": mac_vendors.most_common(50),
        "domains": list(domains)[:20],
        "urls": list(urls)[:20],
        "packet_size": {
            "min": min_size,
            "max": max_size,
            "avg": avg_size
        },
        "protocol_distribution": dict(protocol_counts),
        "protocol_timeline": {},
        "protocol_packets": {},
        "packets": [],
        "packet_size_histogram": bins,
        "packets_per_second": pps,
        "top_senders": src_ips.most_common(50),
        "top_receivers": dst_ips.most_common(50),
        "ip_distribution": dict(ip_types),
        "tcp": {}  # will be filled by run_tcp_analysis()
    }


def extract_stats(file_path):
    results = extract_stats_core(file_path)
    results["tcp"] = run_tcp_analysis(file_path)
    return results

def extract_stats_streaming(file_path):

    src_ips = Counter()
    dst_ips = Counter()
    ip_types = Counter()
    protocol_counts = Counter()
    protocol_timeline = {}
    protocol_packet_index = {}
    mac_vendors = Counter()
    country_traffic = Counter()
    public_ip_geo = {}

    packet_sizes = []
    timestamps = []

    domains = set()
    urls = set()

    total_packets= 0

    cmd = [
        "tshark",
        "-r", file_path,
        "-T", "fields",
        "-E", "separator=|",
        "-E", "occurrence=f",

        "-e", "frame.number",
        "-e", "frame.time_epoch",
        "-e", "frame.len",

        # Ethernet
        "-e", "eth.src",
        "-e", "eth.dst",

        # IP Layer
        "-e", "ip.version",
        "-e", "ip.ttl",
        "-e", "ip.hdr_len",
        "-e", "ip.len",
        "-e", "ip.src",
        "-e", "ip.dst",

        # TCP
        "-e", "tcp.srcport",
        "-e", "tcp.dstport",
        "-e", "tcp.seq",
        "-e", "tcp.ack",
        "-e", "tcp.window_size",

        # UDP
        "-e", "udp.srcport",
        "-e", "udp.dstport",

        # ICMP
        "-e", "icmp.type",
        "-e", "icmp.code",
        "-e", "icmp.seq",
        "-e", "icmp.ident",

        # DNS + HTTP
        "-e", "dns.qry.name",
        "-e", "http.host",
        "-e", "http.request.uri"
    ]

    process = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.DEVNULL,
        text=True,
        bufsize=1
    )

    for line in process.stdout:
        try:
            fields = line.strip().split("|")

            if len(fields) < 17:
                continue

            (
                frame_no,
                ts,
                size,

                eth_src,
                eth_dst,

                ip_version,
                ip_ttl,
                ip_hdr_len,
                ip_len,
                src,
                dst,

                tcp_s,
                tcp_d,
                tcp_seq,
                tcp_ack,
                tcp_window,

                udp_s,
                udp_d,

                icmp_type,
                icmp_code,
                icmp_seq,
                icmp_id,

                dns_query,
                http_host,
                http_uri
            ) = fields

            if not size:
                continue

            size = int(size)
            ts = float(ts) if ts else None

            total_packets += 1

            packet_sizes.append(size)
            if ts:
                timestamps.append(ts)

            # SINGLE IP FIX
            src = src.split(",")[0].strip() if src else None
            dst = dst.split(",")[0].strip() if dst else None

            if src:
                src_ips[src] += 1
                ip_types[classify_ip(src)] += 1

            if dst:
                dst_ips[dst] += 1

            # Protocol Detection
            # -------------------------
            # PROTOCOL IDENTIFICATION
            # -------------------------

            detected_protocols = []
            detected_protocols = list(set(detected_protocols))

            # Layer 3
            if src and dst:
                detected_protocols.append("IPv4")

            # Layer 4
            if tcp_s or tcp_d:
                detected_protocols.append("TCP")

            if udp_s or udp_d:
                detected_protocols.append("UDP")

            if icmp_type:
                detected_protocols.append("ICMP")

            # Layer 7 (Service-based detection)
            if tcp_d == "443":
                detected_protocols.append("HTTPS")

            if tcp_d == "80":
                detected_protocols.append("HTTP")

            if tcp_d == "22":
                detected_protocols.append("SSH")

            if tcp_d == "21":
                detected_protocols.append("FTP")

            if tcp_d == "25":
                detected_protocols.append("SMTP")

            if tcp_d == "3389":
                detected_protocols.append("RDP")

            if tcp_d == "445":
                detected_protocols.append("SMB")

            if udp_d == "443":
                detected_protocols.append("QUIC")

            if udp_d == "1883":
                detected_protocols.append("MQTT")

            if udp_d == "5060":
                detected_protocols.append("SIP")

            if dns_query:
                detected_protocols.append("DNS")

            # Update counters
            for proto in detected_protocols:
                protocol_counts[proto] += 1

                if ts:
                    bucket = int(ts)
                    protocol_timeline.setdefault(bucket, Counter())
                    protocol_timeline[bucket][proto] += 1

                protocol_packet_index.setdefault(proto, [])

                if len(protocol_packet_index[proto]) < 3000:
                    protocol_packet_index[proto].append({
                        "id": int(frame_no),
                        "timestamp": ts,
                        "src": src,
                        "dst": dst,
                        "length": size,
                        "protocol": proto,

                        # Layer 2
                        "ether_src": eth_src or None,
                        "ether_dst": eth_dst or None,

                        # Layer 3
                        "ip_version": ip_version or None,
                        "ttl": ip_ttl or None,
                        "header_length": ip_hdr_len or None,
                        "payload_length": ip_len or None,

                        # Layer 4
                        "src_port": tcp_s or udp_s or None,
                        "dst_port": tcp_d or udp_d or None,
                        "sequence_number": tcp_seq or None,
                        "ack_number": tcp_ack or None,
                        "window_size": tcp_window or None,

                        # ICMP
                        "icmp_type": icmp_type or None,
                        "icmp_code": icmp_code or None,
                        "icmp_sequence": icmp_seq or None,
                        "icmp_identifier": icmp_id or None
                    })

            # DNS FIX
            if dns_query:
                domains.add(dns_query.strip())

            # HTTP FIX
            if http_host and http_uri:
                urls.add(f"http://{http_host}{http_uri}")

            # MAC Vendor
            if eth_src:
                mac_vendors[resolve_vendor(eth_src)] += 1

            # GEO FIX
            for ip in [src, dst]:
                if ip and geo_reader and classify_ip(ip) == "Public":

                    if ip not in public_ip_geo:
                        try:
                            response = geo_reader.city(ip)
                            public_ip_geo[ip] = {
                                "country": response.country.name or "Unknown",
                                "country_code": response.country.iso_code
                            }
                        except:
                            continue

                    # This must run for EVERY packet
                    country_name = public_ip_geo[ip]["country"]
                    country_traffic[country_name] += 1

        except:
            continue

    process.wait()

    total_packets = total_packets

    duration = max(timestamps) - min(timestamps) if timestamps else 0
    pps = round(total_packets / duration, 2) if duration > 0 else 0

    bins = {
        "0-200": 0,
        "201-400": 0,
        "401-800": 0,
        "801-1200": 0,
        "1201-1500": 0,
        "1500+": 0
    }

    for s in packet_sizes:
        if s <= 200:
            bins["0-200"] += 1
        elif s <= 400:
            bins["201-400"] += 1
        elif s <= 800:
            bins["401-800"] += 1
        elif s <= 1200:
            bins["801-1200"] += 1
        elif s <= 1500:
            bins["1201-1500"] += 1
        else:
            bins["1500+"] += 1

    return {
        "tcp_behavior": analyze_tcp_behavior_advanced(file_path),
        "total_packets": total_packets,
        "valid_packets": total_packets,
        "malformed_packets": 0,
        "fragmented_packets": 0,
        "jumbo_frames": sum(1 for s in packet_sizes if s > 1500),
        "geo_data": public_ip_geo,
        "country_traffic": country_traffic.most_common(50),
        "mac_vendors": mac_vendors.most_common(50),
        "domains": list(domains)[:20],
        "urls": list(urls)[:20],
        "packet_size": {
            "min": min(packet_sizes) if packet_sizes else 0,
            "max": max(packet_sizes) if packet_sizes else 0,
            "avg": round(sum(packet_sizes)/len(packet_sizes),2) if packet_sizes else 0
        },
        "protocol_distribution": dict(protocol_counts),
        "protocol_timeline": {
            str(k): dict(v) for k, v in protocol_timeline.items()
        },
        "protocol_packets": protocol_packet_index,
        "packet_size_histogram": bins,
        "packets_per_second": pps,
        "top_senders": src_ips.most_common(50),
        "top_receivers": dst_ips.most_common(50),
        "ip_distribution": dict(ip_types),
        "tcp": run_tcp_analysis(file_path),

    }



