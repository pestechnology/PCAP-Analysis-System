import subprocess
import os
import uuid

def split_pcap(file_path, chunk_packets):

    output_prefix = f"/tmp/{uuid.uuid4()}_chunk"

    cmd = [
        "editcap",
        "-c", str(chunk_packets),
        file_path,
        output_prefix + ".pcap"
    ]

    subprocess.run(cmd, check=True)

    chunks = sorted([
        f for f in os.listdir("/tmp")
        if f.startswith(output_prefix.split("/")[-1])
    ])

    return [f"/tmp/{c}" for c in chunks]