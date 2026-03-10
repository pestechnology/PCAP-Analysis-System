export default function HttpThreatsCard({ threats }) {

    if (!threats || threats.length === 0) {
        return null;
    }

    return (
        <div className="card mac-card">

            <div className="card-title">
                Unencrypted Malicious HTTP
            </div>

            {/* SCROLLABLE BODY */}
            <div
                className="card-body mac-scroll"
                style={{
                    maxHeight: "300px",
                    overflowY: "auto",
                    paddingRight: "6px"
                }}
            >

                {threats.map((alert, index) => {

                    const severityColor =
                        alert.severity === 1
                            ? "#ff4d4f"
                            : alert.severity === 2
                                ? "#ffa940"
                                : "#fadb14";

                    return (
                        <div
                            key={index}
                            style={{
                                paddingBottom: "10px",
                                borderBottom: "1px solid rgba(255,255,255,0.05)"
                            }}
                        >

                            <div
                                style={{
                                    fontWeight: 600,
                                    color: severityColor,
                                    marginBottom: "4px"
                                }}
                            >
                                {alert.signature}
                            </div>

                            <div
                                style={{
                                    fontSize: "12px",
                                    opacity: 0.85
                                }}
                            >
                                {alert.src_ip} → {alert.dest_ip}
                            </div>

                            <div
                                style={{
                                    fontSize: "12px",
                                    opacity: 0.7
                                }}
                            >
                                {alert.category}
                            </div>

                        </div>
                    );
                })}

            </div>

        </div>
    );
}