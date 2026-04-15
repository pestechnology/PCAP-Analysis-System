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

import os
import psutil
from math import ceil


class AnalysisRecommender:

    def __init__(self, file_path):
        self.file_path = file_path

    def get_file_size_gb(self):
        return os.path.getsize(self.file_path) / (1024 ** 3)

    def get_system_specs(self):
        memory = psutil.virtual_memory().total / (1024 ** 3)
        cpu = psutil.cpu_count(logical=True)

        return memory, cpu

    def recommend(self):
        file_size = self.get_file_size_gb()
        total_ram, cpu_cores = self.get_system_specs()

        usable_ram = total_ram * 0.4

        # average packet assumption ~ 1000 bytes
        packets_per_chunk = int((usable_ram * (1024 ** 3)) / 1000)

        if file_size < 0.1:
            return {
                "mode": "streaming",
                "chunk_packets": None,
                "recommended_workers": 1,
                "estimated_chunks": 1
            }

        workers = max(1, min(cpu_cores - 1, 4))

        estimated_chunks = ceil(
            (file_size * (1024 ** 3)) / (packets_per_chunk * 1000)
        )

        return {
            "mode": "chunk",
            "chunk_packets": packets_per_chunk,
            "recommended_workers": workers,
            "estimated_chunks": estimated_chunks
        }
