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