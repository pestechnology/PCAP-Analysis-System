# © Copyright 2026 Mohit Pal
# Licensed under the MIT;
# you may not use this file except in compliance with the License.
# SPDX-License-Identifier: MIT

from collections import defaultdict


class FlowEngine:
    def __init__(self):
        self.flows = defaultdict(list)

    def build_flows(self, parsed_packets):
        for pkt in parsed_packets:
            key = (
                pkt.get("src_ip"),
                pkt.get("dst_ip"),
                pkt.get("src_port"),
                pkt.get("dst_port"),
                pkt.get("protocol")
            )
            self.flows[key].append(pkt)

        return dict(self.flows)
