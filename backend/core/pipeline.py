from backend.core.ingestion import PCAPIngestion
from backend.parsing import parse_pcap
from backend.statistics import extract_stats
from backend.core.flow_engine import FlowEngine
from backend.core.detection_engine import DetectionEngine
from backend.services.threat_intel import check_ip_reputation
from backend.core.scaling_manager import ScalingManager
from backend.utils.system_info import get_host_system_info


class AnalysisPipeline:
    def __init__(self, pcap_path):
        self.pcap_path = pcap_path
        self.ingestion = PCAPIngestion(pcap_path)
        self.flow_engine = FlowEngine()
        self.detection_engine = DetectionEngine()

    def run(self):
        print("[*] Starting Analysis Pipeline")

        packets = self.ingestion.load_packets()

        parsed_data = parse_pcap(packets)

        flows = self.flow_engine.build_flows(parsed_data)

        detections = self.detection_engine.analyze(flows)

        stats = extract_stats(parsed_data)

        scaling = ScalingManager(self.pcap_path)

        system_specs = scaling.get_system_specs()
        file_size = scaling.get_file_size_gb()
        recommended_chunk = scaling.recommend_chunk_size()

        system_info = get_host_system_info()

        enriched_ips = []
        for ip in stats.get("public_ips", []):
            reputation = check_ip_reputation(ip)
            enriched_ips.append({
                "ip": ip,
                "reputation": reputation
            })

        return {
            "statistics": stats,
            "flows": flows,
            "detections": detections,
            "enriched_ips": enriched_ips,
            "scaling_info": {
                "system_specs": system_specs,
                "file_size_gb": file_size,
                "recommended_chunk_gb": recommended_chunk
            },
            "host_system": system_info,
        }
