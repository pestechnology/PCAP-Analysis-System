import os
import multiprocessing
import uuid
import subprocess
from concurrent.futures import ProcessPoolExecutor, as_completed
from backend.statistics import run_tcp_analysis, extract_tls_metadata, extract_stats_streaming, analyze_tcp_behavior_advanced
from collections import Counter
from backend.ids.suricata_engine import analyze_abnormal_activity_suricata
from backend.threat_intel.domain_engine import evaluate_domains
from backend.ids.http_threat_detector import extract_http_malicious_alerts

analysis_progress = {}

def analyze_parallel(file_path, chunk_packets=None):

    job_id = str(uuid.uuid4())

    cpu_cores = multiprocessing.cpu_count()
    workers = max(1, cpu_cores - 1)

    file_size_mb = os.path.getsize(file_path) / (1024 * 1024)

    if chunk_packets is None:
        if file_size_mb < 50:
            chunk_packets = 100000
        elif file_size_mb < 500:
            chunk_packets = 250000
        else:
            chunk_packets = 500000

    split_prefix = f"/tmp/{job_id}_chunk"

    split_cmd = [
        "editcap",
        "-c", str(chunk_packets),
        file_path,
        split_prefix + ".pcap"
    ]

    subprocess.run(split_cmd, check=True)

    chunks = sorted([
        f"/tmp/{f}" for f in os.listdir("/tmp")
        if f.startswith(f"{job_id}_chunk")
    ])

    total_chunks = len(chunks)

    analysis_progress[job_id] = {
        "total_chunks": total_chunks,
        "completed_chunks": 0,
        "status": "running"
    }

    merged_result = None

    with ProcessPoolExecutor(max_workers=workers) as executor:

        futures = [executor.submit(extract_stats_streaming, chunk) for chunk in chunks]

        for future in as_completed(futures):
            result = future.result()

            if merged_result is None:
                merged_result = result
            else:
                merged_result = merge_results(merged_result, result)

            analysis_progress[job_id]["completed_chunks"] += 1

    merged_result["tcp"] = run_tcp_analysis(file_path)
    merged_result["tcp_behavior"] = analyze_tcp_behavior_advanced(file_path)
    suricata_result = analyze_abnormal_activity_suricata(file_path)

    flagged_entities = suricata_result.get("flagged_entities", [])

    suricata_alerts = []

    for entity in flagged_entities:
        alerts = entity.get("alerts", [])
        if isinstance(alerts, list):
            suricata_alerts.extend(alerts)

    merged_result["abnormal_activity"] = {
        "flagged_entities": flagged_entities
    }

    merged_result["http_threats"] = extract_http_malicious_alerts(suricata_alerts)

    tls_metadata = extract_tls_metadata(file_path)
    merged_result["tls_metadata"] = tls_metadata

    # -------------------------------
    # DOMAIN THREAT INTELLIGENCE
    # -------------------------------

    dns_records = [{"query": d} for d in merged_result.get("domains", [])]

    domain_alerts = evaluate_domains(
        dns_records or [],
        tls_metadata or []
    )

    merged_result["domain_threat_alerts"] = domain_alerts

    analysis_progress[job_id]["status"] = "done"

    metadata = get_capture_metadata(file_path)
    merged_result.setdefault("http_threats", [])

    return job_id, {
        "capture_metadata": metadata,
        **merged_result
    }

def get_optimal_workers():
    cpu = multiprocessing.cpu_count()
    return max(1, cpu - 1)

def merge_results(a, b):

    # ================================
    # Numeric Fields
    # ================================
    for key in [
        "total_packets",
        "valid_packets",
        "malformed_packets",
        "fragmented_packets",
        "jumbo_frames"
    ]:
        a[key] += b.get(key, 0)

    # ================================
    # Dictionary Counters
    # ================================
    counter_fields = [
        "protocol_distribution",
        "ip_distribution",
        "packet_size_histogram"
    ]

    for field in counter_fields:
        for k, v in b.get(field, {}).items():
            a[field][k] = a[field].get(k, 0) + v

    # ================================
    # Country Traffic
    # ================================
    a_country = Counter(dict(a.get("country_traffic", [])))
    b_country = Counter(dict(b.get("country_traffic", [])))

    merged_country = a_country + b_country

    a["country_traffic"] = merged_country.most_common(50)

    # ================================
    # Top Senders
    # ================================
    a_senders = Counter(dict(a.get("top_senders", [])))
    b_senders = Counter(dict(b.get("top_senders", [])))

    merged_senders = a_senders + b_senders
    a["top_senders"] = merged_senders.most_common(50)

    # ================================
    # Top Receivers
    # ================================
    a_receivers = Counter(dict(a.get("top_receivers", [])))
    b_receivers = Counter(dict(b.get("top_receivers", [])))

    merged_receivers = a_receivers + b_receivers
    a["top_receivers"] = merged_receivers.most_common(50)

    # ================================
    # MAC Vendors
    # ================================
    a_mac = Counter(dict(a.get("mac_vendors", [])))
    b_mac = Counter(dict(b.get("mac_vendors", [])))

    merged_mac = a_mac + b_mac
    a["mac_vendors"] = merged_mac.most_common(50)

    # ================================
    # GEO DATA (merge unique IPs)
    # ================================
    a_geo = a.get("geo_data", {})
    b_geo = b.get("geo_data", {})

    a_geo.update(b_geo)
    a["geo_data"] = a_geo

    # ================================
    # Domains & URLs (merge unique)
    # ================================
    a["domains"] = list(set(a.get("domains", []) + b.get("domains", [])))[:20]
    a["urls"] = list(set(a.get("urls", []) + b.get("urls", [])))[:20]

    # ================================
    # Protocol Timeline (merge time buckets)
    # ================================
    for ts, proto_counts in b.get("protocol_timeline", {}).items():
        if ts not in a["protocol_timeline"]:
            a["protocol_timeline"][ts] = proto_counts
        else:
            for proto, count in proto_counts.items():
                a["protocol_timeline"][ts][proto] = (
                    a["protocol_timeline"][ts].get(proto, 0) + count
                )

    return a

def get_capture_metadata(file_path):
    try:
        cmd = ["capinfos", file_path]
        result = subprocess.run(cmd, capture_output=True, text=True)

        lines = result.stdout.splitlines()

        metadata = {
            "pcap_format": "Unknown",
            "file_size_kb": 0,
            "capture_duration": 0,
            "snapshot_length": None,
            "start_time": None,
            "end_time": None
        }

        for line in lines:
            line = line.strip()

            # File format
            if line.startswith("File type:"):
                value = line.split(":", 1)[1].strip()
                metadata["pcap_format"] = value.split()[-1]

            # File size
            elif line.startswith("File size:"):
                value = line.split(":", 1)[1].strip()
                size_number = float(value.split()[0])
                unit = value.split()[1]

                if unit.lower() == "mb":
                    metadata["file_size_kb"] = round(size_number * 1024, 2)
                elif unit.lower() == "kb":
                    metadata["file_size_kb"] = round(size_number, 2)
                else:
                    metadata["file_size_kb"] = round(size_number, 2)

            # Duration
            elif line.startswith("Capture duration:"):
                value = line.split(":", 1)[1].strip()
                metadata["capture_duration"] = float(value.split()[0])

            elif "snapshot length" in line.lower() or "packet size limit" in line.lower():

                value = line.split(":", 1)[1].strip()

                if "(not set)" in value.lower():
                    metadata["snapshot_length"] = None
                else:
                    try:
                        metadata["snapshot_length"] = int(value.split()[0])
                    except:
                        metadata["snapshot_length"] = None

            # Start time
            elif line.startswith("Earliest packet time:"):
                metadata["start_time"] = line.split(":", 1)[1].strip()

            # End time
            elif line.startswith("Latest packet time:"):
                metadata["end_time"] = line.split(":", 1)[1].strip()

        return metadata

    except Exception as e:
        print("Metadata extraction failed:", e)
        return {
            "pcap_format": "Unknown",
            "file_size_kb": 0,
            "capture_duration": 0,
            "snapshot_length": None,
            "start_time": None,
            "end_time": None
        }





