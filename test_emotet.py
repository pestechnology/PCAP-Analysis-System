from backend.core.file_extractor import extract_files_metadata
from backend.core.credential_extractor import extract_credentials

pcap = "tmp/2022-03-14-Emotet-epoch5-with-Cobalt-Strike-and-spambot-traffic.pcap"
print("Files:", extract_files_metadata(pcap))
print("Creds:", extract_credentials(pcap))
