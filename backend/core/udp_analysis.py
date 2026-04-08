# © Copyright 2026 Mohit Pal
# Licensed under the MIT;
# you may not use this file except in compliance with the License.
# SPDX-License-Identifier: MIT

import subprocess
from collections import defaultdict, Counter
import statistics
import os
import json

SURICATA_EVE_PATH = "/var/log/suricata/eve.json"


def run_tshark_udp(file_path):
    cmd = [
        "tshark", "-r", file_path,
        "-Y", "udp",
        "-T", "fields",
        "-E", "separator=|",
        "-e", "frame.time_epoch",
        "-e", "ip.src",
        "-e", "ip.dst",
        "-e", "udp.dstport",
        "-e", "frame.len"
    ]

    process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True)

    for line in process.stdout:
        try:
            yield line.strip().split("|")
        except:
            continue

    process.wait()


def load_suricata_udp_alerts():
    alerts = defaultdict(list)

    if not os.path.exists(SURICATA_EVE_PATH):
        return alerts

    with open(SURICATA_EVE_PATH, "r") as f:
        for line in f:
            try:
                data = json.loads(line)

                if data.get("event_type") != "alert":
                    continue

                proto = data.get("proto", "")
                if proto.lower() != "udp":
                    continue

                src = data.get("src_ip")
                alert = data.get("alert", {})

                alerts[src].append({
                    "signature": alert.get("signature"),
                    "severity": alert.get("severity"),
                    "category": alert.get("category")
                })

            except:
                continue

    return alerts


def analyze_udp_behavior(file_path):

    flows = defaultdict(lambda: {
        "timestamps": [],
        "dst_ports": [],
        "packet_sizes": [],
        "destinations": Counter()
    })

    port_distribution = Counter()

    # ==========================
    # 1. Extract Data
    # ==========================
    for ts, src, dst, port, size in run_tshark_udp(file_path):

        if not src or not dst or not port:
            continue

        # Handle encapsulated packets where tshark returns multiple comma-separated values
        src = src.split(',')[0].strip()
        dst = dst.split(',')[0].strip()
        port = port.split(',')[0].strip()

        try:
            ts = float(ts.split(',')[0])
            size = int(size.split(',')[0])
        except:
            continue

        flow = flows[src]

        flow["timestamps"].append(ts)
        flow["dst_ports"].append(port)
        flow["packet_sizes"].append(size)
        flow["destinations"][dst] += 1

        port_distribution[port] += 1

    # ==========================
    # 2. Suricata Alerts
    # ==========================
    suricata_alerts = load_suricata_udp_alerts()

    # ==========================
    # 3. Analysis Engine
    # ==========================
    results = {
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

    for ip, data in flows.items():

        score = 0
        reasons = []

        packet_count = len(data["timestamps"])

        # High Rate
        if packet_count > 20:
            duration = max(data["timestamps"]) - min(data["timestamps"])
            if duration > 0:
                pps = packet_count / duration
                if pps > 100:
                    score += 30
                    reasons.append(f"High UDP rate ({pps:.2f} pps)")

        # Port Scan
        unique_ports = len(set(data["dst_ports"]))
        if unique_ports > 25:
            score += 25
            reasons.append("UDP Port Scanning")

        # Amplification
        if data["packet_sizes"]:
            avg_size = statistics.mean(data["packet_sizes"])
            max_dest_ratio = max(data["destinations"].values()) / packet_count

            if avg_size > 500 and max_dest_ratio < 0.4:
                score += 35
                reasons.append("Amplification / Reflection Pattern")

        # Suspicious Ports
        suspicious_ports = {"53", "123", "1900", "11211"}
        used = set(data["dst_ports"]) & suspicious_ports

        if used:
            score += 20
            reasons.append(f"Abuse of ports {list(used)}")

        # Suricata Correlation
        if ip in suricata_alerts:
            score += 30
            reasons.append("Suricata Alert Correlation")

        # ==========================
        # Classification
        # ==========================
        if score >= 40:
            results["flagged_entities"].append({
                "ip": ip,
                "score": score,
                "reasons": reasons,
                "packet_count": packet_count,
                "unique_ports": unique_ports
            })

        elif score >= 20:
            results["suspicious_entities"].append({
                "ip": ip,
                "score": score,
                "reasons": reasons,
                "packet_count": packet_count,
                "unique_ports": unique_ports
            })

    # ==========================
    # Additional Insights
    # ==========================

    # Top UDP Sources
    results["top_udp_sources"] = sorted(
        [(ip, len(data["timestamps"])) for ip, data in flows.items()],
        key=lambda x: x[1],
        reverse=True
    )[:10]

    # Port Distribution
    results["port_distribution"] = port_distribution.most_common(10)

    # Summary
    results["udp_summary"] = {
        "total_sources": len(flows),
        "total_flagged": len(results["flagged_entities"]),
        "total_suspicious": len(results["suspicious_entities"])
    }

    # Suricata Summary
    high = medium = low = 0
    for ip, alerts in suricata_alerts.items():
        for alert in alerts:
            sev = alert.get("severity", 3)
            if sev == 1:
                high += 1
            elif sev == 2:
                medium += 1
            else:
                low += 1
    results["suricata_summary"] = {
        "High": high,
        "Medium": medium,
        "Low": low
    }

    # Priority Targets
    all_threats = results["flagged_entities"] + results["suspicious_entities"]
    sorted_threats = sorted(all_threats, key=lambda x: x["score"], reverse=True)[:5]
    
    priority_targets = []
    for t in sorted_threats:
        score = t["score"]
        if score >= 40:
            risk = "High"
        elif score >= 20:
            risk = "Medium"
        else:
            risk = "Low"
            
        priority_targets.append({
            "ip": t["ip"],
            "risk_badge": risk,
            "score": score,
            "explanation": ", ".join(t["reasons"])
        })
        
    results["priority_targets"] = priority_targets

    # Status
    if results["flagged_entities"]:
        results["status"] = "malicious"
    elif results["suspicious_entities"]:
        results["status"] = "suspicious"
    else:
        results["status"] = "clean"

    return results