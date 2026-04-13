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

import subprocess

ALLOWED_EXTENSIONS = {
    ".pcap",
    ".pcapng",
    ".cap",
    ".dump",
    ".pcap.gz",
    ".pcapng.gz"
}

ALLOWED_MIME_TYPES = {
    "application/vnd.tcpdump.pcap",
    "application/x-pcapng",
    "application/octet-stream"
}


def is_allowed_extension(filename: str) -> bool:
    filename = filename.lower()

    # handle .pcap.gz case properly
    for ext in ALLOWED_EXTENSIONS:
        if filename.endswith(ext):
            return True

    return False


def is_valid_pcap_signature(file_path: str) -> bool:
    """
    Uses capinfos to verify the file is a real packet capture file.
    This prevents fake renamed files.
    """
    try:
        result = subprocess.run(
            ["capinfos", file_path],
            capture_output=True,
            text=True
        )

        if result.returncode != 0:
            return False

        return "File type:" in result.stdout

    except Exception:
        return False


def validate_pcap_file(file_path: str, filename: str):
    """
    Main validation function.
    Raises ValueError if invalid.
    """

    if not is_allowed_extension(filename):
        raise ValueError(
            "Unsupported file format. Only PCAP/PCAPNG formats are allowed."
        )

    if not is_valid_pcap_signature(file_path):
        raise ValueError(
            "Invalid or corrupted packet capture file."
        )

    return True