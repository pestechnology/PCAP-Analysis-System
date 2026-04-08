# © Copyright 2026 Mohit Pal
# Licensed under the MIT;
# you may not use this file except in compliance with the License.
# SPDX-License-Identifier: MIT

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