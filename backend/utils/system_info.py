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
