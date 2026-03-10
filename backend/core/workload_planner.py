def plan_workload(file_size_bytes, system_profile):

    file_size_mb = file_size_bytes / (1024**2)
    cores = system_profile["cpu_cores"]
    ram = system_profile["available_ram_gb"]

    if ram < 4:
        workers = 1
    elif ram < 8:
        workers = min(2, cores)
    elif ram < 16:
        workers = min(4, cores)
    else:
        workers = min(8, cores)

    if file_size_mb < 50:
        chunk_packets = 100000
    elif file_size_mb < 500:
        chunk_packets = 250000
    else:
        chunk_packets = 500000

    return {
        "workers": workers,
        "chunk_packets": chunk_packets
    }