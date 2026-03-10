import os
import psutil


class ScalingManager:

    def __init__(self, pcap_path):
        self.pcap_path = pcap_path

    def get_system_specs(self):
        memory = psutil.virtual_memory().total / (1024 ** 3)  # GB
        cpu_cores = os.cpu_count()

        return {
            "total_memory_gb": round(memory, 2),
            "cpu_cores": cpu_cores
        }

    def get_file_size_gb(self):
        size = os.path.getsize(self.pcap_path) / (1024 ** 3)
        return round(size, 2)

    def recommend_chunk_size(self):
        specs = self.get_system_specs()
        file_size = self.get_file_size_gb()

        memory = specs["total_memory_gb"]

        if memory < 8:
            return 0.25  # 250MB
        elif memory < 16:
            return 1  # 1GB
        else:
            return 2  # 2GB
