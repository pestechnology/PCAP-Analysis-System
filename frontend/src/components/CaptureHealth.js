/*
 * © Copyright 2026 PES University.
 *
 * Authors:
 *   Mohit Pal - mp65742@gmail.com
 *   Dr. Swetha P - swethap@pes.edu
 *   Dr. Prasad B Honnavalli - prasadhb@pes.edu
 *
 * Contributors:
 *   PurpleSynapz - info@purplesynapz.com
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { HeartPulse } from "lucide-react";

export default function CaptureHealth({
                                          valid = 0,
                                          malformed = 0,
                                          fragmented = 0,
                                          jumbo = 0,
                                          retransmissions = {}
                                      }) {

    // Safe fallback to prevent crash
    const {
        severity = "normal",
        note = "",
        retransmission_rate = 0,
        fast_retransmissions = 0,
        timeout_retransmissions = 0,
        partial_retransmissions = 0,
        out_of_order = 0
    } = retransmissions || {};

    const severityColor =
        severity === "normal"
            ? "#30d158"
            : severity === "medium"
                ? "#ff9f0a"
                : "#ff453a";

    return (
        <div className="card">
            <div className="card-title" style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0, paddingBottom: "14px", borderBottom: "1px solid var(--border-subtle)", marginBottom: "16px" }}>
                <HeartPulse size={16} color="var(--accent-red)" style={{ marginTop: "-2px" }} />
                <span style={{ fontSize: "13px", letterSpacing: "1px", lineHeight: 1 }}>CAPTURE HEALTH</span>
            </div>

            <div className="grid">

                {/* VALID */}
                <div className="metric">
                    <h4>
                        Valid Packets
                        <span className="info-wrapper">
                            <span className="info">ⓘ</span>
                            <div className="tooltip-content">
                                <ul>
                                    <li>Successfully parsed without errors</li>
                                    <li>Complete protocol structure</li>
                                    <li>Reliable for analysis</li>
                                </ul>
                            </div>
                        </span>
                    </h4>
                    <p>{valid}</p>
                </div>

                {/* MALFORMED */}
                <div className="metric">
                    <h4>
                        Malformed Packets
                        <span className="info-wrapper">
                            <span className="info">ⓘ</span>
                            <div className="tooltip-content">
                                <ul>
                                    <li>Parsing or structural errors</li>
                                    <li>Corrupted or truncated frames</li>
                                    <li>May indicate anomalies</li>
                                </ul>
                            </div>
                        </span>
                    </h4>
                    <p>{malformed}</p>
                </div>

                {/* FRAGMENTED */}
                <div className="metric">
                    <h4>
                        Fragmented Packets
                        <span className="info-wrapper">
                            <span className="info">ⓘ</span>
                            <div className="tooltip-content">
                                <ul>
                                    <li>IPv4 MF flag or fragment offset set</li>
                                    <li>Packet split into multiple segments</li>
                                    <li>May complicate inspection</li>
                                </ul>
                            </div>
                        </span>
                    </h4>
                    <p>{fragmented}</p>
                </div>

                {/* JUMBO */}
                <div className="metric">
                    <h4>
                        Jumbo Frames
                        <span className="info-wrapper">
                            <span className="info">ⓘ</span>
                            <div className="tooltip-content">
                                <ul>
                                    <li>Packet size exceeds 1500 bytes</li>
                                    <li>Non-standard MTU usage</li>
                                    <li>Common in high-throughput networks</li>
                                </ul>
                            </div>
                        </span>
                    </h4>
                    <p>{jumbo}</p>
                </div>

                {/* TCP INTELLIGENCE */}
                <div className="metric">
                    <h4>TCP Transport Intelligence</h4>

                    {/* Overall Rate + Formula Tooltip */}
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <p style={{ color: severityColor, margin: 0 }}>
                            {retransmission_rate}%
                        </p>

                        <span className="info-wrapper">
            <span className="info">ⓘ</span>
            <div className="tooltip-content">
                <ul>
                    <li>
                        Retransmission Rate = (Total Retransmissions ÷ Total TCP Packets) × 100
                    </li>
                    <li>
                        Example:
                    </li>
                    <li>
                        {(fast_retransmissions + timeout_retransmissions)}
                        {" ÷ "}
                        {retransmissions.total_tcp_packets || 0}
                        {" × 100 = "}
                        {retransmission_rate}%
                    </li>
                </ul>
            </div>
        </span>
                    </div>

                    {note && (
                        <div
                            style={{
                                fontSize: "12px",
                                marginTop: "6px",
                                color: "#a1a1a6"
                            }}
                        >
                            {note}
                        </div>
                    )}

                    {/* Detailed Breakdown */}
                    <div
                        style={{
                            marginTop: "10px",
                            fontSize: "12px",
                            color: "#d1d1d6",
                            display: "grid",
                            gap: "6px"
                        }}
                    >

                        <div>
                            Fast: {fast_retransmissions}
                            <span className="info-wrapper">
                <span className="info"> ⓘ</span>
                <div className="tooltip-content">
                    <ul>
                        <li>Triggered after 3 duplicate ACKs</li>
                        <li>Sender retransmits before timeout</li>
                        <li>Congestion or packet loss indicator</li>
                    </ul>
                </div>
            </span>
                        </div>

                        <div>
                            Timeout: {timeout_retransmissions}
                            <span className="info-wrapper">
                <span className="info"> ⓘ</span>
                <div className="tooltip-content">
                    <ul>
                        <li>No ACK received before RTO expired</li>
                        <li>Segment resent after timeout</li>
                        <li>Higher severity than fast retransmit</li>
                    </ul>
                </div>
            </span>
                        </div>

                        <div>
                            Partial: {partial_retransmissions}
                            <span className="info-wrapper">
                <span className="info"> ⓘ</span>
                <div className="tooltip-content">
                    <ul>
                        <li>Only part of segment retransmitted</li>
                        <li>Occurs with TCP SACK</li>
                        <li>Selective recovery behavior</li>
                    </ul>
                </div>
            </span>
                        </div>

                        <div>
                            Out-of-Order: {out_of_order}
                            <span className="info-wrapper">
                <span className="info"> ⓘ</span>
                <div className="tooltip-content">
                    <ul>
                        <li>Packet arrived earlier than expected</li>
                        <li>Network reordering event</li>
                        <li>May not always indicate loss</li>
                    </ul>
                </div>
            </span>
                        </div>

                        {/* Graceful / Reset Closes */}
                        <div style={{ marginTop: "8px", borderTop: "1px solid var(--border-subtle)", paddingTop: "8px" }}>
                            Session Termination:
                        </div>
                        <div>
                            Graceful: {retransmissions.graceful_closes || 0}
                            <span className="info-wrapper">
                <span className="info"> ⓘ</span>
                <div className="tooltip-content">
                    <ul>
                        <li>Connections closed with FIN flags</li>
                        <li>Proper handshake termination</li>
                        <li>Normal network behavior</li>
                    </ul>
                </div>
            </span>
                        </div>
                        <div>
                            Reset: {retransmissions.rst_closes || 0}
                            <span className="info-wrapper">
                <span className="info"> ⓘ</span>
                <div className="tooltip-content">
                    <ul>
                        <li>Connections terminated abruptly with RST</li>
                        <li>Potential scanner or broken session</li>
                        <li>Security indicator if high</li>
                    </ul>
                </div>
            </span>
                        </div>

                    </div>
                </div>


            </div>
        </div>
    );
}
