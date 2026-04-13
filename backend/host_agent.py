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

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import platform
import psutil
import socket

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/host-info")
def get_host_info():
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage("/")

    return {
        "os": platform.system(),
        "os_version": platform.version(),
        "architecture": platform.machine(),
        "processor": platform.processor(),
        "hostname": socket.gethostname(),
        "cpu_cores": psutil.cpu_count(logical=True),
        "total_ram_gb": round(memory.total / (1024**3), 2),
        "available_ram_gb": round(memory.available / (1024**3), 2),
        "total_disk_gb": round(disk.total / (1024**3), 2),
        "free_disk_gb": round(disk.free / (1024**3), 2)
    }