# © Copyright 2026 Mohit Pal
# Licensed under the MIT;
# you may not use this file except in compliance with the License.
# SPDX-License-Identifier: MIT

import re
from .feed_manager import load_feed

malicious_domains = load_feed()

def normalize(domain):
    domain = domain.lower().strip()
    domain = re.sub(r"^www\.", "", domain)
    return domain

def check_domain(domain):
    domain = normalize(domain)

    if domain in malicious_domains:
        return "malicious"

    return "clean"