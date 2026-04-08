/*
© Copyright 2026 Mohit Pal
Licensed under the MIT;
you may not use this file except in compliance with the License.
SPDX-License-Identifier: MIT
*/
import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PieChart } from "lucide-react";

export default function ProtocolPieChart({ distribution = {} }) {
    const navigate = useNavigate();

    const { total, items } = useMemo(() => {
        let sum = 0;
        const mapped = Object.entries(distribution).map(([label, count]) => {
            sum += count;
            return { label, count };
        });

        // Professional Apple-esque dashboard colors
        const fallbackColors = [
            "#0EA5E9", "#B200FF", "#00FF66", "#FF9900", 
            "#FF003C", "#64D2FF", "#FFD60A", "#AC8E68", "#2f2985"
        ];

        return {
            total: sum,
            items: mapped.map((item, i) => ({
                ...item,
                percent: sum > 0 ? (item.count / sum) * 100 : 0,
                color: fallbackColors[i % fallbackColors.length]
            })).sort((a, b) => b.count - a.count)
        };
    }, [distribution]);

    if (total === 0) {
        return (
            <div className="card">
                <div className="card-title" style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0, paddingBottom: "14px", borderBottom: "1px solid var(--border-subtle)", marginBottom: "16px" }}>
                    <PieChart size={16} color="var(--accent-purple)" style={{ marginTop: "-2px" }} />
                    <span style={{ fontSize: "13px", letterSpacing: "1px", lineHeight: 1 }}>PROTOCOL DISTRIBUTION</span>
                </div>
                <div className="muted" style={{ padding: "40px 0", textAlign: "center" }}>No protocol data detected.</div>
            </div>
        );
    }

    return (
        <div className="card">
            <div className="card-title" style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0, paddingBottom: "14px", borderBottom: "1px solid var(--border-subtle)", marginBottom: "16px" }}>
                <PieChart size={16} color="var(--accent-purple)" style={{ marginTop: "-2px" }} />
                <span style={{ fontSize: "13px", letterSpacing: "1px", lineHeight: 1 }}>PROTOCOL DISTRIBUTION</span>
            </div>

            <div style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", 
                gap: "16px" 
            }}>
                {items.map((item, idx) => (
                    <div 
                        key={idx}
                        onClick={() => navigate(`/protocol/${item.label}`)}
                        className="protocol-card-hover"
                        style={{ 
                            background: "rgba(255,255,255,0.02)", 
                            borderRadius: "10px", 
                            padding: "16px",
                            cursor: "pointer",
                            border: "1px solid rgba(255,255,255,0.05)",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            minHeight: "100px"
                        }}
                    >
                        {/* Header Row */}
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                            <div style={{ 
                                width: "8px", 
                                height: "8px", 
                                borderRadius: "2px", 
                                background: item.color,
                                boxShadow: `0 0 8px ${item.color}40`
                            }}></div>
                            <span style={{ fontSize: "13px", color: "var(--text-primary)", fontWeight: 600, letterSpacing: "0.5px" }}>
                                {item.label}
                            </span>
                        </div>

                        {/* Values */}
                        <div>
                            <div style={{ fontSize: "22px", fontWeight: 700, fontFamily: "var(--font-heading)", color: "var(--text-primary)", lineHeight: "1.1" }}>
                                {item.count > 0 && item.percent < 0.1 ? "<0.1" : item.percent.toFixed(1)}%
                            </div>
                            <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px", fontFamily: "var(--font-mono)" }}>
                                {item.count.toLocaleString()} pkt
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div style={{ width: "100%", height: "4px", background: "rgba(255,255,255,0.08)", borderRadius: "2px", marginTop: "14px", overflow: "hidden" }}>
                            <div style={{ width: `${item.percent}%`, height: "100%", background: item.color, borderRadius: "2px", transition: "width 1s cubic-bezier(0.16, 1, 0.3, 1)" }} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
