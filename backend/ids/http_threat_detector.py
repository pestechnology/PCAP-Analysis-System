# © Copyright 2026 PES University.
#
# Authors:
#   Mohit Pal - mp65742@gmail.com
#   Dr. Swetha P - swethap@pes.edu
#   Dr. Prasad B Honnavalli - prasadhb@pes.edu
#
# Contributors:
#   PurpleSynapz - info@purplesynapz.com
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# SPDX-License-Identifier: Apache-2.0

def extract_http_malicious_alerts(suricata_alerts):

    http_alerts = []

    http_keywords = [
        "http",
        "user-agent",
        "web",
        "uri",
        "trojan",
        "c2",
        "malware"
    ]

    for alert in suricata_alerts:

        if not isinstance(alert, dict):
            continue

        signature = str(alert.get("signature", "")).lower()
        category = str(alert.get("category", "")).lower()

        if any(keyword in signature for keyword in http_keywords) or \
           any(keyword in category for keyword in http_keywords):

            http_alerts.append({
                "signature": alert.get("signature"),
                "category": alert.get("category"),
                "severity": alert.get("severity"),
                "src_ip": alert.get("src_ip"),
                "dest_ip": alert.get("dest_ip")
            })

    return http_alerts