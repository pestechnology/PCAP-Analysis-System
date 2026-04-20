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

import React, { useMemo } from "react";
import { Network } from "lucide-react";

export default function IPChart({ data }) {
    const { total, items } = useMemo(() => {
        const distribution = data?.ip_distribution || {};
        let sum = 0;
        const mapped = Object.entries(distribution).map(([label, count]) => {
            sum += count;
            return { label, count };
        });

        // Professional Apple-esque dashboard colors matching the CSS theme
        const colors = {
            "Public": "var(--accent-cyan)",    // Sky Blue priority
            "Private": "var(--accent-purple)", // Intelligence purple
            "Multicast": "var(--accent-orange)",
            "Broadcast": "var(--accent-green)",
            "Unknown": "var(--text-secondary)"
        };

        const fallbackColors = ["#0EA5E9", "#B200FF", "#00FF66", "#FF9900", "#A0ACC0"];

        return {
            total: sum,
            items: mapped.map((item, i) => ({
                ...item,
                percent: sum > 0 ? (item.count / sum) * 100 : 0,
                color: colors[item.label] || fallbackColors[i % fallbackColors.length]
            })).sort((a, b) => b.count - a.count)
        };
    }, [data?.ip_distribution]);

    if (total === 0) {
        return (
            <div className="card">
                <div className="card-title" style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0, paddingBottom: "14px", borderBottom: "1px solid var(--border-subtle)", marginBottom: "16px" }}>
                    <Network size={16} color="var(--accent-cyan)" style={{ marginTop: "-2px" }} />
                    <span style={{ fontSize: "13px", letterSpacing: "1px", lineHeight: 1 }}>IP ADDRESS CLASSIFICATION</span>
                </div>
                <div className="muted" style={{ padding: "40px 0", textAlign: "center" }}>No IP classification data detected in capture.</div>
            </div>
        );
    }

    return (
        <div className="card">
            <div className="card-title" style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0, paddingBottom: "14px", borderBottom: "1px solid var(--border-subtle)", marginBottom: "26px" }}>
                <Network size={16} color="var(--accent-cyan)" style={{ marginTop: "-2px" }} />
                <span style={{ fontSize: "13px", letterSpacing: "1px", lineHeight: 1 }}>IP ADDRESS CLASSIFICATION</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "22px", padding: "0 10px" }}>
                {items.map((item, idx) => (
                    <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        
                        {/* Header Row */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                            
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <div style={{ 
                                    width: "8px", 
                                    height: "8px", 
                                    borderRadius: "50%", 
                                    background: item.color,
                                    boxShadow: `0 0 6px ${item.color}40`
                                }}></div>
                                <span style={{ fontSize: "14px", color: "var(--text-primary)", fontWeight: 500, letterSpacing: "0.5px" }}>
                                    {item.label}
                                </span>
                            </div>

                            <div style={{ textAlign: "right" }}>
                                <span style={{ fontSize: "16px", fontWeight: 600, fontFamily: "var(--font-heading)" }}>
                                    {item.percent.toFixed(1)}%
                                </span>
                                <span style={{ marginLeft: "12px", fontSize: "12px", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
                                    {item.count.toLocaleString()} pkt
                                </span>
                            </div>

                        </div>

                        {/* Thin Progress Track */}
                        <div style={{ 
                            width: "100%", 
                            height: "6px", 
                            borderRadius: "4px", 
                            background: "rgba(255,255,255,0.06)", 
                            overflow: "hidden" 
                        }}>
                            <div style={{
                                width: `${item.percent}%`,
                                height: "100%",
                                background: item.color,
                                borderRadius: "4px",
                                transition: "width 1s cubic-bezier(0.16, 1, 0.3, 1)"
                            }} />
                        </div>
                        
                    </div>
                ))}
            </div>
        </div>
    );
}
