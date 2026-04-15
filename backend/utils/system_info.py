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

import platform
import psutil
import socket


def get_host_system_info():
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage("/")

    return {
        "os": platform.system(),
        "architecture": platform.machine(),
        "processor": platform.processor(),
        "hostname": socket.gethostname(),
        "cpu_cores": psutil.cpu_count(logical=True),
        "total_ram_gb": round(memory.total / (1024 ** 3), 1),
        "available_ram_gb": round(memory.available / (1024 ** 3), 1),
        "total_disk_gb": round(disk.total / (1024 ** 3), 1)
    }
