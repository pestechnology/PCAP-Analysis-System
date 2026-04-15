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
import { Layers, Share2, GitBranch, Crosshair } from 'lucide-react';

const LayerTwoCard = ({ data }) => {
    const { 
        link_layer = { primary: "—", all: [] },
        arp_analysis = { total_arp_packets: 0, arp_requests: 0, arp_replies: 0, request_reply_ratio: 0, potential_spoofing: [] },
        vlan_analysis = { total_tagged_frames: 0, unique_vlan_count: 0, double_tagged_frames: 0 },
        stp_analysis = { total_bpdus: 0, root_bridge: null, topology_changes: 0 }
    } = data;

    return (
        <div className="card" style={{ height: "100%" }}>
            <div className="card-title" style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0, paddingBottom: "14px", borderBottom: "1px solid var(--border-subtle)", marginBottom: "16px" }}>
                <Layers size={16} color="var(--accent-cyan)" style={{ marginTop: "-2px" }} />
                <span style={{ fontSize: "13px", letterSpacing: "1px", lineHeight: 1 }}>LAYER 2 ANALYTICS</span>
            </div>
            
            <div className="grid">
                {/* Link Layer Type */}
                <div className="metric">
                    <h4>Link Layer Type</h4>
                    <p style={{ color: "var(--accent-cyan)" }}>{link_layer.primary}</p>
                </div>

                {/* ARP Summary */}
                <div className="metric">
                    <h4>
                        ARP Protocol
                        {arp_analysis.potential_spoofing.length > 0 && (
                             <span style={{ float: 'right', color: 'var(--accent-orange)', fontSize: '10px' }}>⚠️ {arp_analysis.potential_spoofing.length} ALERTS</span>
                        )}
                    </h4>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <p>{arp_analysis.total_arp_packets.toLocaleString()}</p>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Ratio: {arp_analysis.request_reply_ratio}</span>
                    </div>
                </div>

                {/* VLAN Summary */}
                <div className="metric">
                    <h4>VLAN / 802.1Q</h4>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <p>{vlan_analysis.total_tagged_frames.toLocaleString()}</p>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{vlan_analysis.unique_vlan_count} IDs</span>
                    </div>
                </div>

                {/* STP Summary */}
                <div className="metric">
                    <h4>STP (802.1D)</h4>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <p>{stp_analysis.total_bpdus.toLocaleString()}</p>
                        <span style={{ fontSize: '12px', color: stp_analysis.topology_changes > 0 ? 'var(--accent-red)' : 'var(--text-secondary)' }}>
                            {stp_analysis.topology_changes} Topo Changes
                        </span>
                    </div>
                </div>
            </div>

            {arp_analysis.potential_spoofing.length > 0 && (
                <div style={{ marginTop: '20px', padding: '12px', background: 'rgba(255, 153, 0, 0.05)', borderRadius: '8px', border: '1px solid rgba(255, 153, 0, 0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--accent-orange)', fontWeight: '600', fontSize: '12px' }}>
                        <Share2 size={14} /> POTENTIAL ARP SPOOFING DETECTED
                    </div>
                    <table className="ip-table">
                        <thead>
                            <tr>
                                <th>IP Address</th>
                                <th className="right">Competing MACs</th>
                            </tr>
                        </thead>
                        <tbody>
                            {arp_analysis.potential_spoofing.map((s, idx) => (
                                <tr key={idx}>
                                    <td style={{ color: 'var(--accent-orange)' }}>{s.ip}</td>
                                    <td className="right" style={{ fontSize: '11px' }}>{s.macs.join(' • ')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default LayerTwoCard;
