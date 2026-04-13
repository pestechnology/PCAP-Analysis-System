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

import requests
import os

FEED_URL = "https://urlhaus.abuse.ch/downloads/hostfile/"
CACHE_FILE = "threat_intel/domain_feed.txt"

def update_feed():
    try:
        response = requests.get(FEED_URL, timeout=10)
        if response.status_code == 200:
            os.makedirs("threat_intel", exist_ok=True)
            with open(CACHE_FILE, "w") as f:
                f.write(response.text)
    except Exception:
        pass

def load_feed():
    if not os.path.exists(CACHE_FILE):
        update_feed()

    domains = set()
    try:
        with open(CACHE_FILE, "r") as f:
            for line in f:
                if line.startswith("#") or not line.strip():
                    continue
                domain = line.strip().split()[0]
                domains.add(domain.lower())
    except Exception:
        pass

    return domains