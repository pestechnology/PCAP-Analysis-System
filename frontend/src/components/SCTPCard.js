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

import React from 'react';
import { Target, Activity, Share2, Server } from 'lucide-react';

const SCTPCard = ({ data }) => {
    const { 
        sctp_analysis = { 
            total_sctp_packets: 0, 
            unique_associations: 0, 
            port_distribution: {}, 
            chunk_types: {}, 
            multi_homing_indicators: 0 
        } 
    } = data;

    if (sctp_analysis.total_sctp_packets === 0) return null;

    return (
        <div className="card">
            <div className="card-title" style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0, paddingBottom: "14px", borderBottom: "1px solid var(--border-subtle)", marginBottom: "16px" }}>
                <Target size={16} color="var(--accent-cyan)" style={{ marginTop: "-2px" }} />
                <span style={{ fontSize: "13px", letterSpacing: "1px", lineHeight: 1 }}>SCTP PROTOCOL ANALYSIS</span>
            </div>

            <div className="grid" style={{ marginBottom: "20px" }}>
                <div className="metric">
                    <h4>Total SCTP Packets</h4>
                    <p>{sctp_analysis.total_sctp_packets.toLocaleString()}</p>
                </div>
                <div className="metric">
                    <h4>Unique Associations</h4>
                    <p>{sctp_analysis.unique_associations}</p>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                {/* Chunk Distribution */}
                <div className="metric" style={{ minHeight: "auto" }}>
                    <h4>Chunk Types Distribution</h4>
                    <div className="chunk-list" style={{ marginTop: "12px" }}>
                        {Object.entries(sctp_analysis.chunk_types).map(([chunk, count]) => (
                            <div key={chunk} className="chunk-item">
                                <span className="chunk-name">{chunk}</span>
                                <span className="chunk-count">{count}</span>
                                <div className="chunk-bar-bg">
                                    <div 
                                        className="chunk-bar-fill" 
                                        style={{ width: `${(count / sctp_analysis.total_sctp_packets * 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Ports */}
                <div className="metric" style={{ minHeight: "auto" }}>
                    <h4>Top SCTP Ports</h4>
                    <div className="port-tags" style={{ marginTop: "12px" }}>
                        {Object.entries(sctp_analysis.port_distribution)
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 10)
                            .map(([port, count]) => (
                                <div key={port} className="port-tag">
                                    <span className="port-num">{port}</span>
                                    <span style={{ color: "var(--accent-cyan)" }}>{count}</span>
                                </div>
                            ))}
                    </div>
                    {sctp_analysis.multi_homing_indicators > 0 && (
                        <div style={{ marginTop: "12px", fontSize: "11px", color: "var(--accent-cyan)", display: "flex", alignItems: "center", gap: "6px" }}>
                            <Share2 size={12} /> Multi-homing indicators detected
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SCTPCard;
