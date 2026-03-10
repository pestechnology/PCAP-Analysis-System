from scapy.all import PcapReader


class PCAPIngestion:
    def __init__(self, file_path):
        self.file_path = file_path

    def load_packets(self):
        packets = []
        with PcapReader(self.file_path) as pcap_reader:
            for pkt in pcap_reader:
                packets.append(pkt)
        return packets
