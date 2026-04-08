# © Copyright 2026 Mohit Pal
# Licensed under the MIT;
# you may not use this file except in compliance with the License.
# SPDX-License-Identifier: MIT

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

