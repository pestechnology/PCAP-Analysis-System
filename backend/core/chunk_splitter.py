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

import subprocess
import os
import uuid

def split_pcap_by_size(file_path, size_limit_mb=600, custom_prefix=None):
    job_id = uuid.uuid4().hex
    if custom_prefix:
        output_prefix = f"/tmp/{custom_prefix}"
    else:
        output_prefix = f"/tmp/split_{job_id}"
    
    cmd = [
        "tcpdump",
        "-r", file_path,
        "-C", str(size_limit_mb),
        "-w", output_prefix
    ]

    try:
        subprocess.run(cmd, check=True, capture_output=True)
    except subprocess.CalledProcessError as e:
        stderr_msg = e.stderr.decode() if e.stderr else "Unknown error"
        raise RuntimeError(f"PCAP splitting failed via tcpdump: {stderr_msg}")
    
    chunks = []
    
    if os.path.exists(output_prefix):
        chunks.append(output_prefix)
    
    index = 1
    while True:
        next_chunk = f"{output_prefix}{index}"
        if os.path.exists(next_chunk):
            chunks.append(next_chunk)
            index += 1
        else:
            break
            
    return chunks