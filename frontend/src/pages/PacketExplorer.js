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

import { useParams, useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";

export default function PacketExplorer({ data }) {

    const { protocol } = useParams();
    const navigate = useNavigate();

    const [srcFilter, setSrcFilter] = useState("");
    const [dstFilter, setDstFilter] = useState("");
    const [lengthFilter, setLengthFilter] = useState("");

    /* ===============================
       Timestamp Formatter
    =============================== */
    const formatTimestamp = (ts) => {
        if (!ts) return "-";

        const date = new Date(ts * 1000);

        return date.toLocaleString(undefined, {
            year: "numeric",
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        });
    };

    const filteredPackets = useMemo(() => {
        // SAFE ACCESS
        const packets =
            data?.protocol_packets?.[protocol] || [];

        return packets.filter((pkt) => {

            const matchSrc =
                !srcFilter ||
                pkt.src?.toLowerCase().includes(srcFilter.toLowerCase());

            const matchDst =
                !dstFilter ||
                pkt.dst?.toLowerCase().includes(dstFilter.toLowerCase());

            const matchLength =
                !lengthFilter ||
                String(pkt.length).includes(lengthFilter);

            return matchSrc && matchDst && matchLength;
        });
    }, [data, protocol, srcFilter, dstFilter, lengthFilter]);

    /* ===============================
       Render Guards AFTER Hooks
    =============================== */

    if (!data || !data.protocol_packets) {
        return <div className="card">No packet data available.</div>;
    }

    return (
        <div className="card">
            <div className="card-title">
                {protocol} Packets ({filteredPackets.length})
            </div>

            <button
                onClick={() => navigate(-1)}
                style={{
                    marginBottom: "15px",
                    background: "transparent",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--accent-blue)",
                    padding: "6px 12px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "13px"
                }}
            >
                ← Back
            </button>

            {/* FILTER BAR */}
            <div style={filterBar}>
                <input
                    placeholder="Filter Source IP"
                    value={srcFilter}
                    onChange={(e) => setSrcFilter(e.target.value)}
                    style={filterInput}
                />
                <input
                    placeholder="Filter Destination IP"
                    value={dstFilter}
                    onChange={(e) => setDstFilter(e.target.value)}
                    style={filterInput}
                />
                <input
                    placeholder="Filter Length"
                    value={lengthFilter}
                    onChange={(e) => setLengthFilter(e.target.value)}
                    style={filterInput}
                />
            </div>

            {filteredPackets.length === 0 ? (
                <div>No packets found for this protocol.</div>
            ) : (
                <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                    <table className="ip-table">
                        <thead>
                        <tr>
                            <th>ID</th>
                            <th>Timestamp</th>
                            <th>Source</th>
                            <th>Destination</th>
                            <th>Length</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredPackets.map(pkt => (
                            <tr
                                key={pkt.id}
                                style={{ cursor: "pointer" }}
                                onClick={() =>
                                    navigate(`/packet/${pkt.id}`, {
                                        state: { packet: pkt }
                                    })
                                }
                            >
                                <td>{pkt.id}</td>
                                <td>{formatTimestamp(pkt.timestamp)}</td>
                                <td>{pkt.src || "-"}</td>
                                <td>{pkt.dst || "-"}</td>
                                <td>{pkt.length}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

/* ===============================
   Styles
=============================== */

const filterBar = {
    display: "flex",
    gap: "12px",
    marginBottom: "20px",
};

const filterInput = {
    flex: 1,
    padding: "8px 12px",
    borderRadius: "6px",
    border: "1px solid var(--border-subtle)",
    background: "var(--bg-panel)",
    color: "var(--text-primary)",
    fontSize: "13px",
    fontFamily: "var(--font-mono)",
    outline: "none"
};