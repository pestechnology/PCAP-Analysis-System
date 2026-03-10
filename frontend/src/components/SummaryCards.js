export default function SummaryCards({ data }) {
    return (
        <div className="card">
            <div className="card-title">Capture Overview</div>

            <div className="grid">

                <div className="metric">
                    <h4>Total Packets</h4>
                    <p>{data.total_packets}</p>
                </div>

                <div className="metric">
                    <h4>Packets Per Second(PPS)</h4>
                    <p>{data.packets_per_second}</p>
                </div>

                <div className="metric">
                    <h4>Min Packet Size</h4>
                    <p>{data.packet_size.min} bytes</p>
                </div>

                <div className="metric">
                    <h4>Max Packet Size</h4>
                    <p>{data.packet_size.max} bytes</p>
                </div>

                <div className="metric">
                    <h4>Average Packet Size</h4>
                    <p>{data.packet_size.avg} bytes</p>
                </div>

            </div>
        </div>
    );
}
