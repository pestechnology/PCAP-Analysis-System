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

from backend.parsing import extract_capture_metadata
from backend.statistics import extract_stats_streaming
from backend.utils.system_info import get_host_system_info


def analyze_pcap(file_path):

    stats = extract_stats_streaming(file_path)
    metadata = extract_capture_metadata(file_path, [])

    return {
        "host_system": get_host_system_info(),
        "capture_metadata": metadata,
        **stats
    }

