import os
import subprocess
import datetime


def parse_pcap(file_path):
    """
    We no longer load packets into memory.
    Just return file_path for streaming processing.
    """
    return file_path


def extract_capture_metadata(file_path):

    file_size = os.path.getsize(file_path)

    # =====================================================
    # Extract timestamps (start/end/duration)
    # =====================================================

    ts_cmd = [
        "tshark",
        "-r", file_path,
        "-T", "fields",
        "-e", "frame.time_epoch"
    ]

    ts_result = subprocess.run(ts_cmd, capture_output=True, text=True)

    timestamps = []
    for line in ts_result.stdout.splitlines():
        try:
            timestamps.append(float(line.strip()))
        except:
            pass

    if timestamps:
        start_ts = min(timestamps)
        end_ts = max(timestamps)
        start_time = datetime.datetime.fromtimestamp(start_ts)
        end_time = datetime.datetime.fromtimestamp(end_ts)
        duration = round(end_ts - start_ts, 2)
    else:
        start_time = None
        end_time = None
        duration = 0

    # =====================================================
    # Extract snapshot length + link layer (SAFE FIX)
    # =====================================================

    capinfo_cmd = ["capinfos", file_path]
    capinfo = subprocess.run(capinfo_cmd, capture_output=True, text=True)

    snapshot_length = None
    link_layer_type = None

    for line in capinfo.stdout.splitlines():
        clean_line = line.strip()

        # Handle both:
        # "Snapshot length: 65535"
        # "File header snapshot length: (not set)"
        if "snapshot length" in clean_line.lower():
            value = clean_line.split(":")[-1].strip()

            if "(not set)" in value.lower():
                snapshot_length = None
            else:
                try:
                    snapshot_length = int(value.split()[0])
                except:
                    snapshot_length = None

        # Extract link layer
        if "file encapsulation" in clean_line.lower():
            link_layer_type = clean_line.split(":")[-1].strip()

    # Detect file format
    pcap_format = "pcapng" if file_path.lower().endswith(".pcapng") else "pcap"

    return {
        "file_size_bytes": file_size,
        "capture_start_time": str(start_time) if start_time else None,
        "capture_end_time": str(end_time) if end_time else None,
        "capture_duration_seconds": duration,
        "pcap_format": pcap_format,
        "link_layer_type": link_layer_type,
        "snapshot_length": snapshot_length
    }