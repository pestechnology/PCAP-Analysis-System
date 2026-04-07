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
from backend.core.layer2_analysis import run_layer2_analysis
from backend.core.udp_analysis import analyze_udp_behavior
from backend.core.credential_extractor import extract_credentials
from backend.core.file_extractor import extract_files_metadata
from backend.core.http_extractor import extract_http_transactions
import orjson

analysis_progress = {}

def get_result_path(job_id):
    return f"/tmp/{job_id}_result.json"

def save_result_to_disk(job_id, data):

    with open(get_result_path(job_id), "wb") as f:
        f.write(orjson.dumps(data))

def load_result_from_disk(job_id):
    path = get_result_path(job_id)
    if not os.path.exists(path):
        return None
    with open(path, "rb") as f:
        return orjson.loads(f.read())

def analyze_parallel(file_path, chunk_packets=None, _job_id_override=None):

    job_id = _job_id_override if _job_id_override else str(uuid.uuid4())

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

    if job_id not in analysis_progress:
        analysis_progress[job_id] = {
            "total_chunks": total_chunks,
            "completed_chunks": 0,
            "status": "running",
            "current_stage": "Chunking capture file…",
            "percent": 0
        }
    else:
        analysis_progress[job_id].update({
            "total_chunks": total_chunks,
            "completed_chunks": 0,
            "current_stage": "Chunking capture file…",
            # Don't reset percent to 0 if it was already higher (e.g. from upload)
            "percent": max(analysis_progress[job_id].get("percent", 0), 5)
        })

    merged_result = None

    with ProcessPoolExecutor(max_workers=workers) as executor:

        futures = [executor.submit(extract_stats_streaming, chunk) for chunk in chunks]

        for future in as_completed(futures):
            result = future.result()

            if merged_result is None:
                merged_result = result
            else:
                merged_result = merge_results(merged_result, result)

            completed = analysis_progress[job_id]["completed_chunks"] + 1
            analysis_progress[job_id]["completed_chunks"] = completed
            analysis_progress[job_id]["current_stage"] = f"Parsing packets — chunk {completed}/{total_chunks}"
            analysis_progress[job_id]["percent"] = int((completed / total_chunks) * 60)

    analysis_progress[job_id]["current_stage"] = "Running TCP analysis…"
    analysis_progress[job_id]["percent"] = 62
    merged_result["tcp"] = run_tcp_analysis(file_path)

    analysis_progress[job_id]["current_stage"] = "Detecting behavioral anomalies…"
    analysis_progress[job_id]["percent"] = 68
    merged_result["tcp_behavior"] = analyze_tcp_behavior_advanced(file_path)

    analysis_progress[job_id]["current_stage"] = "Running IDS / Suricata detection…"
    analysis_progress[job_id]["percent"] = 74
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

    analysis_progress[job_id]["current_stage"] = "Extracting TLS/SSL metadata…"
    analysis_progress[job_id]["percent"] = 80
    tls_metadata = extract_tls_metadata(file_path)
    merged_result["tls_metadata"] = tls_metadata

    # -------------------------------
    # FILES & CREDENTIALS EXTRACTION
    # -------------------------------
    analysis_progress[job_id]["current_stage"] = "Extracting files and credentials…"
    analysis_progress[job_id]["percent"] = 82
    merged_result["extracted_credentials"] = extract_credentials(file_path)
    merged_result["extracted_files"] = extract_files_metadata(file_path)
    merged_result["http_transactions"] = extract_http_transactions(file_path)

    # -------------------------------
    # DOMAIN THREAT INTELLIGENCE
    # -------------------------------
    analysis_progress[job_id]["current_stage"] = "Evaluating domain threat intelligence…"
    analysis_progress[job_id]["percent"] = 84

    dns_records = [{"query": d} for d in merged_result.get("domains", [])]

    domain_alerts = evaluate_domains(
        dns_records or [],
        tls_metadata or []
    )

    merged_result["domain_threat_alerts"] = domain_alerts

    # -------------------------------
    # LAYER 2 & SCTP ANALYSIS
    # -------------------------------
    analysis_progress[job_id]["current_stage"] = "Analyzing Layer 2 / SCTP…"
    analysis_progress[job_id]["percent"] = 88
    try:
        l2_results = run_layer2_analysis(file_path)
        merged_result.update(l2_results)
    except Exception as e:
        print("[L2 ERROR]", e)
        merged_result.update({
            "link_layer": {"primary": "Unknown", "all": []},
            "arp_analysis": {"total_arp_packets": 0, "arp_requests": 0, "arp_replies": 0},
            "vlan_analysis": {"total_tagged_frames": 0, "unique_vlan_count": 0},
            "stp_analysis": {"total_bpdus": 0},
            "sctp_analysis": {"total_sctp_packets": 0}
        })

    # -------------------------------
    # UDP ANALYSIS
    # -------------------------------
    analysis_progress[job_id]["current_stage"] = "Performing UDP behavioral analysis…"
    analysis_progress[job_id]["percent"] = 93
    try:
        udp_results = analyze_udp_behavior(file_path)
        merged_result["udp_analysis"] = udp_results
    except Exception as e:
        print("[UDP ERROR]", e)
        merged_result["udp_analysis"] = {
            "udp_summary": {},
            "flagged_entities": [],
            "suspicious_entities": [],
            "top_udp_sources": [],
            "port_distribution": [],
            "udp_timeline": {},
            "suricata_summary": {},
            "priority_targets": [],
            "status": "clean"
        }

    analysis_progress[job_id]["current_stage"] = "Finalizing capture metadata…"
    analysis_progress[job_id]["percent"] = 97
    
    metadata = get_capture_metadata(file_path)
    merged_result.setdefault("http_threats", [])

    final_result = {
        "capture_metadata": metadata,
        "_pcap_filename": os.path.basename(file_path),
        **merged_result
    }

    # Store snapshot for export — single source of truth (Disk-based for GB scale)
    save_result_to_disk(job_id, final_result)
    
    analysis_progress[job_id]["current_stage"] = "Analysis complete"
    analysis_progress[job_id]["percent"] = 100
    analysis_progress[job_id]["status"] = "done"

    return job_id, final_result

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
    # Adaptive Resolution: Cap timeline at ~5,000 points for GB-scale transfers
    # ================================
    a_timeline = a.get("protocol_timeline", {})
    b_timeline = b.get("protocol_timeline", {})

    for ts, proto_counts in b_timeline.items():
        if ts not in a_timeline:
            a_timeline[ts] = proto_counts
        else:
            for proto, count in proto_counts.items():
                a_timeline[ts][proto] = a_timeline[ts].get(proto, 0) + count

    # If timeline is too large (>5000 points), compact it by doubling the bucket size
    if len(a_timeline) > 5000:
        new_timeline = {}
        # Convert keys to sorted ints, group them
        sorted_ts = sorted(a_timeline.keys())
        for i in range(0, len(sorted_ts), 2):
            ts1 = sorted_ts[i]
            bucket = a_timeline[ts1]
            if i + 1 < len(sorted_ts):
                ts2 = sorted_ts[i+1]
                for p, c in a_timeline[ts2].items():
                    bucket[p] = bucket.get(p, 0) + c
            new_timeline[ts1] = bucket
        a["protocol_timeline"] = new_timeline
    else:
        a["protocol_timeline"] = a_timeline

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
            "end_time": None,
            "link_layer_type": "Unknown"
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

            # Data link type (Link-layer type)
            elif line.startswith("Data link type:"):
                metadata["link_layer_type"] = line.split(":", 1)[1].strip()

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





