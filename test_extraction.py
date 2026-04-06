import sys
from backend.core.credential_extractor import extract_credentials
from backend.core.file_extractor import extract_files_metadata

pcap_file = "tmp/2022-03-14-Qakbot-with-Cobalt-Strike-and-VNC-module.pcap"
print("Files:", extract_files_metadata(pcap_file))
print("Creds:", extract_credentials(pcap_file))
