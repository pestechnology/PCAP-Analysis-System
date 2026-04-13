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

from scapy.all import PcapReader


class PCAPIngestion:
    def __init__(self, file_path):
        self.file_path = file_path

    def load_packets(self):
        packets = []
        with PcapReader(self.file_path) as pcap_reader:
            for pkt in pcap_reader:
                packets.append(pkt)
        return packets
