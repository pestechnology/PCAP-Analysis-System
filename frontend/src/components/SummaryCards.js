/*
© Copyright 2026 Mohit Pal
Licensed under the MIT;
you may not use this file except in compliance with the License.
SPDX-License-Identifier: MIT
*/
import { LayoutDashboard } from "lucide-react";

export default function SummaryCards({ data }) {
    return (
        <div className="card" style={{ height: "100%" }}>
            <div className="card-title" style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0, paddingBottom: "14px", borderBottom: "1px solid var(--border-subtle)", marginBottom: "16px" }}>
                <LayoutDashboard size={16} color="var(--accent-cyan)" style={{ marginTop: "-2px" }} />
                <span style={{ fontSize: "13px", letterSpacing: "1px", lineHeight: 1 }}>CAPTURE OVERVIEW</span>
            </div>

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
