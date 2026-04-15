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

import React from "react";
import { ScanSearch, ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";

// ─── Triage config ────────────────────────────────────────────────────────────
const TRIAGE = {
    LOW:      { color: "var(--accent-green, #22c55e)",  bg: "rgba(34,197,94,0.08)",  border: "rgba(34,197,94,0.2)",  Icon: ShieldCheck },
    MEDIUM:   { color: "var(--accent-orange, #f59e0b)", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)", Icon: ShieldAlert },
    HIGH:     { color: "#f97316",                       bg: "rgba(249,115,22,0.08)", border: "rgba(249,115,22,0.2)", Icon: ShieldAlert },
    CRITICAL: { color: "var(--accent-red, #ef4444)",    bg: "rgba(239,68,68,0.08)",  border: "rgba(239,68,68,0.2)",  Icon: ShieldX     },
};

// ─── Layer pill colours ───────────────────────────────────────────────────────
const LAYER_CLR = {
    "L2":    { bg: "rgba(139,92,246,0.14)", text: "#a78bfa" },
    "L3/L4": { bg: "rgba(6,182,212,0.14)",  text: "var(--accent-cyan, #22d3ee)" },
    "L3/L7": { bg: "rgba(20,184,166,0.14)", text: "#2dd4bf" },
    "L3":    { bg: "rgba(6,182,212,0.14)",  text: "var(--accent-cyan, #22d3ee)" },
    "L7":    { bg: "rgba(234,179,8,0.14)",  text: "#facc15" },
};

// ─── Half-circle gauge using the app's accent colour ─────────────────────────
function ScoreDial({ pct, color }) {
    const r   = 48;
    const cx  = 60;
    const cy  = 60;
    const arc = Math.PI * r;
    const off = arc * (1 - Math.min(pct, 100) / 100);
    const d   = `M ${cx - r},${cy} A ${r},${r} 0 0 1 ${cx + r},${cy}`;

    return (
        <svg width="120" height="64" viewBox="0 0 120 64" style={{ overflow: "visible" }}>
            <path d={d} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={8} strokeLinecap="round" />
            <path
                d={d}
                fill="none"
                stroke={color}
                strokeWidth={8}
                strokeLinecap="round"
                strokeDasharray={arc}
                strokeDashoffset={off}
                style={{ transition: "stroke-dashoffset 0.85s cubic-bezier(0.34,1.56,0.64,1)" }}
            />
        </svg>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ForensicScoreCard({ data }) {
    const fcs = data?.forensic_score;
    if (!fcs) return null;

    const {
        forensic_confidence_score: rawScore = 0,
        triage_priority: triage = "LOW",
        raw_score = 0,
        signal_count = 0,
        detected_signals = [],
    } = fcs;

    const score = Math.round(rawScore);
    const cfg   = TRIAGE[triage] || TRIAGE.LOW;
    const { color, bg, border, Icon } = cfg;

    return (
        <div className="card">

            {/* ── Header — matches app card-title pattern ────────── */}
            <div className="card-title" style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                margin: 0,
                paddingBottom: "14px",
                borderBottom: "1px solid var(--border-subtle)",
                marginBottom: "20px",
            }}>
                <ScanSearch size={16} color="var(--accent-cyan)" style={{ marginTop: "-2px" }} />
                <span style={{ fontSize: "13px", letterSpacing: "1px", lineHeight: 1 }}>
                    FORENSIC CONFIDENCE SCORE
                </span>
            </div>

            {/* ── Score row ──────────────────────────────────────── */}
            <div style={{ display: "flex", alignItems: "flex-end", gap: "24px", marginBottom: "24px" }}>

                {/* Dial */}
                <div style={{ position: "relative", flexShrink: 0, width: 120 }}>
                    <ScoreDial pct={rawScore} color={color} />
                    <div style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        textAlign: "center",
                        lineHeight: 1,
                    }}>
                        <span style={{
                            fontSize: "28px",
                            fontWeight: 800,
                            color,
                            fontVariantNumeric: "tabular-nums",
                        }}>
                            {score}
                        </span>
                        <span style={{ fontSize: "12px", color: "var(--text-secondary)", marginLeft: "2px" }}>/100</span>
                    </div>
                </div>

                {/* Triage badge + metrics */}
                <div style={{ flexGrow: 1 }}>
                    {/* Badge */}
                    <div style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        background: bg,
                        border: `1px solid ${border}`,
                        borderRadius: "999px",
                        padding: "4px 12px",
                        marginBottom: "14px",
                    }}>
                        <Icon size={12} color={color} />
                        <span style={{ fontSize: "11px", fontWeight: 700, color, letterSpacing: "0.5px" }}>
                            {triage} RISK
                        </span>
                    </div>

                    {/* Metrics — uses app grid/metric classes */}
                    <div className="grid">
                        <div className="metric">
                            <h4>Evidence Weight</h4>
                            <p>{raw_score} pts</p>
                        </div>
                        <div className="metric">
                            <h4>Signals Detected</h4>
                            <p>{signal_count}</p>
                        </div>
                        <div className="metric">
                            <h4>Layers Scanned</h4>
                            <p style={{ color: "var(--accent-cyan)" }}>L2 – L7</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Evidence signals ───────────────────────────────── */}
            {detected_signals.length > 0 ? (
                <>
                    <div style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        letterSpacing: "1px",
                        color: "var(--text-secondary)",
                        textTransform: "uppercase",
                        marginBottom: "10px",
                    }}>
                        Evidence Signals
                    </div>

                    <table className="ip-table">
                        <thead>
                            <tr>
                                <th>Layer</th>
                                <th>Signal</th>
                                <th>Detail</th>
                                <th className="right">Weight</th>
                            </tr>
                        </thead>
                        <tbody>
                            {detected_signals.map((sig, i) => {
                                const lc = LAYER_CLR[sig.layer] || { bg: "rgba(255,255,255,0.06)", text: "var(--text-secondary)" };
                                return (
                                    <tr key={i}>
                                        <td>
                                            <span style={{
                                                fontSize: "9px",
                                                fontWeight: 700,
                                                letterSpacing: "0.6px",
                                                padding: "2px 7px",
                                                borderRadius: "4px",
                                                background: lc.bg,
                                                color: lc.text,
                                                display: "inline-block",
                                            }}>
                                                {sig.layer}
                                            </span>
                                        </td>
                                        <td style={{ fontWeight: 600, color: "var(--text-primary, #e2e8f0)" }}>
                                            {sig.label}
                                        </td>
                                        <td style={{ color: "var(--text-secondary)", fontSize: "12px" }}>
                                            {sig.detail}
                                        </td>
                                        <td className="right" style={{ color: "var(--text-secondary)", fontWeight: 600 }}>
                                            ×{sig.weight}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </>
            ) : (
                <div style={{
                    padding: "13px 14px",
                    background: "rgba(34,197,94,0.05)",
                    borderRadius: "8px",
                    border: "1px solid rgba(34,197,94,0.15)",
                    display: "flex",
                    alignItems: "center",
                    gap: "9px",
                }}>
                    <ShieldCheck size={14} color="var(--accent-green, #22c55e)" />
                    <span style={{ fontSize: "12px", color: "#86efac" }}>
                        No anomaly signals detected across any OSI layer. Capture appears clean.
                    </span>
                </div>
            )}
        </div>
    );
}
