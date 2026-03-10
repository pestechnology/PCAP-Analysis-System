export default function Capabilities() {
    return (
        <div className="card">
            <div className="card-title">Current Capabilities (Phase 1)</div>

            <ul>
                <li>✔ PCAP file upload</li>
                <li>✔ Packet parsing using <b>Scapy</b></li>
                <li>✔ Metadata extraction:</li>

                <ul>
                    <li>Total packet count</li>
                    <li>Packet size (min / max / avg)</li>
                    <li>Source IP frequency</li>
                    <li>Destination IP frequency</li>
                    <li>IP classification:</li>
                    <ul>
                        <li>Private</li>
                        <li>Public</li>
                        <li>Multicast</li>
                        <li>Reserved</li>
                    </ul>
                </ul>

                <li>✔ JSON response suitable for dashboards</li>
                <li>✔ CORS enabled for React integration</li>
            </ul>
        </div>
    );
}
