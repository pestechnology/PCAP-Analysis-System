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

import psutil
import os

def profile_system():
    cpu_cores = os.cpu_count()
    total_ram = psutil.virtual_memory().total / (1024**3)
    available_ram = psutil.virtual_memory().available / (1024**3)

    return {
        "cpu_cores": cpu_cores,
        "total_ram_gb": round(total_ram, 2),
        "available_ram_gb": round(available_ram, 2)
    }