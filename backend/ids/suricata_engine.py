import subprocess
import json
import os
import uuid
from collections import defaultdict

def analyze_abnormal_activity_suricata(file_path):

    run_id = str(uuid.uuid4())
    output_dir = f"/tmp/suri_{run_id}"
    os.makedirs(output_dir, exist_ok=True)

    eve_path = f"{output_dir}/eve.json"

    try:
        cmd = [
            "suricata",
            "-r", file_path,
            "-l", output_dir,
            "-k", "none"
        ]

        subprocess.run(cmd, check=True)

        alerts = parse_eve_json(eve_path)

        return {
            "flagged_entities": normalize_alerts(alerts)
        }

    except Exception as e:
        print("Suricata error:", e)
        return {"flagged_entities": []}


def parse_eve_json(eve_path):

    if not os.path.exists(eve_path):
        return []

    alerts = []

    with open(eve_path, "r") as f:
        for line in f:
            try:
                data = json.loads(line)

                if data.get("event_type") == "alert":

                    alerts.append({
                        "timestamp": data.get("timestamp"),
                        "src_ip": data.get("src_ip"),
                        "src_port": data.get("src_port"),
                        "dest_ip": data.get("dest_ip"),
                        "dest_port": data.get("dest_port"),
                        "proto": data.get("proto"),
                        "flow_id": data.get("flow_id"),

                        "signature": data["alert"].get("signature"),
                        "category": data["alert"].get("category"),
                        "severity": data["alert"].get("severity"),
                        "sid": data["alert"].get("signature_id"),
                        "rev": data["alert"].get("rev"),
                        "action": data["alert"].get("action"),
                    })

            except Exception:
                continue

    return alerts
def normalize_alerts(alerts):

    ip_map = defaultdict(lambda: {
        "alerts": [],
        "alert_count": 0,
        "highest_severity": 3
    })

    for alert in alerts:
        ip = alert.get("src_ip")
        if not ip:
            continue

        ip_map[ip]["alerts"].append(alert)
        ip_map[ip]["alert_count"] += 1

        ip_map[ip]["highest_severity"] = min(
            ip_map[ip]["highest_severity"],
            alert["severity"]
        )

    result = []

    for ip, data in ip_map.items():
        result.append({
            "ip": ip,
            "alert_count": data["alert_count"],
            "highest_severity": data["highest_severity"],
            "alerts": data["alerts"]
        })

    return sorted(
        result,
        key=lambda x: (x["highest_severity"], -x["alert_count"])
    )