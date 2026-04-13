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

from concurrent.futures import ProcessPoolExecutor, as_completed
from backend.statistics import extract_stats_streaming

def process_chunk(chunk_path):
    return extract_stats_streaming(chunk_path)

def run_parallel(chunks, workers, progress_tracker=None):

    results = []

    with ProcessPoolExecutor(max_workers=workers) as executor:

        futures = {executor.submit(process_chunk, c): c for c in chunks}

        completed = 0
        total = len(chunks)

        for future in as_completed(futures):
            result = future.result()
            results.append(result)

            completed += 1

            if progress_tracker:
                progress_tracker["progress"] = int((completed/total)*100)

    return results