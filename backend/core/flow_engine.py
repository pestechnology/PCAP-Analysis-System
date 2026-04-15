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
