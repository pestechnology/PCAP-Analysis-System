import sys
from backend.analysis_engine import analyze_parallel

file_path = "tmp/2022-03-14-Qakbot-with-Cobalt-Strike-and-VNC-module.pcap"
analyze_parallel(file_path, _job_id_override="test_job_123")
