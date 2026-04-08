# © Copyright 2026 Mohit Pal
# Licensed under the MIT;
# you may not use this file except in compliance with the License.
# SPDX-License-Identifier: MIT

class DetectionEngine:

    def analyze(self, flows):
        suspicious_flows = []

        for flow_key, packets in flows.items():
            tcp_flags = [pkt.get("flags") for pkt in packets if pkt.get("flags")]

            if "R" in tcp_flags and "S" not in tcp_flags:
                suspicious_flows.append({
                    "flow": flow_key,
                    "reason": "RST without SYN detected"
                })

        return suspicious_flows
