/*
© Copyright 2026 Mohit Pal
Licensed under the MIT ;
you may not use this file except in compliance with the License.
SPDX-License-Identifier: MIT
*/

import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";

export default function PacketDetailPage() {

    const location = useLocation();
    const navigate = useNavigate();
    const packet = location.state?.packet;

    const [openLayer, setOpenLayer] = useState({
        l2: true,
        l3: true,
        l4: true,
        icmp: true
    });

    const toggle = (layer) => {
        setOpenLayer(prev => ({
            ...prev,
            [layer]: !prev[layer]
        }));
    };

    if (!packet) {
        return (
            <div className="card">
                <div>No packet data available.</div>
                <button onClick={() => navigate(-1)}>Back</button>
            </div>
        );
    }

    return (
        <div className="card">

            <div className="card-title">
                Packet #{packet.id}
            </div>

            <button
                onClick={() => navigate(-1)}
                style={{
                    marginBottom: "15px",
                    background: "none",
                    border: "1px solid #3a3a3c",
                    color: "#0A84FF",
                    padding: "6px 12px",
                    borderRadius: "6px",
                    cursor: "pointer"
                }}
            >
                ← Back
            </button>

            {/* ============================= */}
            {/* Layer 2 — Ethernet */}
            {/* ============================= */}

            <div className="layer-card">
                <div className="layer-header" onClick={() => toggle("l2")}>
                    ▼ Layer 2 — Ethernet
                </div>

                {openLayer.l2 && (
                    <div className="layer-content">

                        <div className="layer-row">
                            <span className="layer-key">Source MAC</span>
                            <span className="layer-value">{packet.ether_src ?? "-"}</span>
                        </div>

                        <div className="layer-row">
                            <span className="layer-key">Destination MAC</span>
                            <span className="layer-value">{packet.ether_dst ?? "-"}</span>
                        </div>

                        <div className="layer-row">
                            <span className="layer-key">Frame Length</span>
                            <span className="layer-value">{packet.length ?? "-"}</span>
                        </div>

                    </div>
                )}
            </div>


            {/* ============================= */}
            {/* Layer 3 — Network */}
            {/* ============================= */}

            <div className="layer-card">
                <div className="layer-header" onClick={() => toggle("l3")}>
                    ▼ Layer 3 — Network (IP)
                </div>

                {openLayer.l3 && (
                    <div className="layer-content">

                        <div className="layer-row">
                            <span className="layer-key">IP Version</span>
                            <span className="layer-value">{packet.ip_version ?? "-"}</span>
                        </div>

                        <div className="layer-row">
                            <span className="layer-key">TTL</span>
                            <span className="layer-value">{packet.ttl ?? "-"}</span>
                        </div>

                        <div className="layer-row">
                            <span className="layer-key">Header Length</span>
                            <span className="layer-value">{packet.header_length ?? "-"}</span>
                        </div>

                        <div className="layer-row">
                            <span className="layer-key">Payload Length</span>
                            <span className="layer-value">{packet.payload_length ?? "-"}</span>
                        </div>

                        <div className="layer-row">
                            <span className="layer-key">Source IP</span>
                            <span className="layer-value">{packet.src ?? "-"}</span>
                        </div>

                        <div className="layer-row">
                            <span className="layer-key">Destination IP</span>
                            <span className="layer-value">{packet.dst ?? "-"}</span>
                        </div>

                    </div>
                )}
            </div>


            {/* ============================= */}
            {/* Layer 4 — Transport */}
            {/* ============================= */}

            {(packet.src_port || packet.dst_port || packet.tcp_flags) && (
                <div className="layer-card">
                    <div className="layer-header" onClick={() => toggle("l4")}>
                        ▼ Layer 4 — Transport
                    </div>

                    {openLayer.l4 && (
                        <div className="layer-content">

                            <div className="layer-row">
                                <span className="layer-key">Protocol</span>
                                <span className="layer-value">{packet.protocol ?? "-"}</span>
                            </div>

                            <div className="layer-row">
                                <span className="layer-key">Source Port</span>
                                <span className="layer-value">{packet.src_port ?? "-"}</span>
                            </div>

                            <div className="layer-row">
                                <span className="layer-key">Destination Port</span>
                                <span className="layer-value">{packet.dst_port ?? "-"}</span>
                            </div>

                            {packet.tcp_flags && (
                                <div className="layer-row">
                                    <span className="layer-key">TCP Flags</span>
                                    <span className="layer-value">{packet.tcp_flags}</span>
                                </div>
                            )}

                            {packet.sequence_number !== null && (
                                <div className="layer-row">
                                    <span className="layer-key">Sequence Number</span>
                                    <span className="layer-value">{packet.sequence_number}</span>
                                </div>
                            )}

                            {packet.ack_number !== null && (
                                <div className="layer-row">
                                    <span className="layer-key">ACK Number</span>
                                    <span className="layer-value">{packet.ack_number}</span>
                                </div>
                            )}

                            {packet.window_size !== null && (
                                <div className="layer-row">
                                    <span className="layer-key">Window Size</span>
                                    <span className="layer-value">{packet.window_size}</span>
                                </div>
                            )}

                        </div>
                    )}
                </div>
            )}


            {/* ============================= */}
            {/* ICMP Section */}
            {/* ============================= */}

            {(packet.icmp_type !== null) && (
                <div className="layer-card">
                    <div className="layer-header" onClick={() => toggle("icmp")}>
                        ▼ ICMP Details
                    </div>

                    {openLayer.icmp && (
                        <div className="layer-content">

                            <div className="layer-row">
                                <span className="layer-key">ICMP Type</span>
                                <span className="layer-value">{packet.icmp_type}</span>
                            </div>

                            <div className="layer-row">
                                <span className="layer-key">ICMP Code</span>
                                <span className="layer-value">{packet.icmp_code}</span>
                            </div>

                            {packet.icmp_identifier !== null && (
                                <div className="layer-row">
                                    <span className="layer-key">Identifier</span>
                                    <span className="layer-value">{packet.icmp_identifier}</span>
                                </div>
                            )}

                            {packet.icmp_sequence !== null && (
                                <div className="layer-row">
                                    <span className="layer-key">Sequence</span>
                                    <span className="layer-value">{packet.icmp_sequence}</span>
                                </div>
                            )}

                            {packet.icmp_payload_hex && (
                                <div className="layer-row">
                                    <span className="layer-key">Payload (Hex)</span>
                                    <span className="layer-value">{packet.icmp_payload_hex}</span>
                                </div>
                            )}

                            {packet.icmp_payload_ascii && (
                                <div className="layer-row">
                                    <span className="layer-key">Payload (ASCII)</span>
                                    <span className="layer-value">{packet.icmp_payload_ascii}</span>
                                </div>
                            )}

                        </div>
                    )}
                </div>
            )}

        </div>
    );
}
