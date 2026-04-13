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
