import React, { useState } from "react";
import { Activity, ShieldAlert, Zap, Radio, AlertTriangle, ShieldCheck, Siren, ChevronDown, ChevronUp, Info } from "lucide-react";

export default function UDPAnalysisCard({ data }) {
    const [showAnomalies, setShowAnomalies] = useState(false);
    const [tooltipData, setTooltipData] = useState(null);

    if (!data) return null;

    const summary = data.udp_summary || {};
    const flagged = data.flagged_entities || [];
    const suspicious = data.suspicious_entities || [];
    const topSources = data.top_udp_sources || [];
    const ports = data.port_distribution || [];
    const priorityTargets = data.priority_targets || [];
    const suricataSummary = data.suricata_summary || { High: 0, Medium: 0, Low: 0 };

    // Check if there's any content for the left column (Priority Targets or Flagged Entities)
    const hasLeftColumnContent = priorityTargets.length > 0 || flagged.length > 0;

    // Robustly calculate status based on actual array lengths to avoid stale backend payloads overriding the view
    let status = "clean";
    if (flagged.length > 0) status = "malicious";
    else if (suspicious.length > 0) status = "suspicious";

    const formatNumber = (num) => {
        return num !== undefined && num !== null ? num.toLocaleString() : "0";
    };

    const getStatusDetails = () => {
        if (status === "malicious") return { color: "var(--accent-red)", label: "Malicious", icon: <ShieldAlert size={14} /> };
        if (status === "suspicious") return { color: "var(--accent-orange)", label: "Anomalous", icon: <AlertTriangle size={14} /> };
        return { color: "var(--accent-green)", label: "Clean", icon: <ShieldCheck size={14} /> };
    };

    const getReasonDescription = (reason) => {
        if (!reason) return "No description available.";
        const r = reason.toLowerCase();
        if (r.includes("high udp rate")) return "Entity is sending an abnormally high volume of UDP packets per second, potentially indicating a flood attack.";
        if (r.includes("port scanning")) return "Entity is probing multiple unique UDP ports in a short timeframe to discover open services.";
        if (r.includes("amplification")) return "Traffic exhibits characteristics of an amplification/reflection DDoS attack (e.g., large average packet sizes with minimal response ratio).";
        if (r.includes("abuse of ports")) return "Activity detected on UDP ports commonly abused for amplification (e.g., DNS, NTP, SSDP, Memcached).";
        if (r.includes("suricata")) return "Correlated with Suricata IDS signatures matching known malicious or suspicious traffic patterns.";
        return "Anomalous behavior detected based on statistical deviation from normal baselines.";
    };

    const handleMouseEnter = (e, reasonText) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setTooltipData({
            text: getReasonDescription(reasonText),
            x: rect.left + rect.width / 2,
            y: rect.top - 8
        });
    };

    const handleMouseLeave = () => {
        setTooltipData(null);
    };

    const statusObj = getStatusDetails();

    // Sort suspicious entities descending by score
    const sortedAnomalies = [...suspicious].sort((a, b) => (b.score || 0) - (a.score || 0));

    return (
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <style>
                {`
                .udp-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
                .udp-scroll::-webkit-scrollbar-track { background: transparent; }
                .udp-scroll::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.15); border-radius: 4px; }
                .udp-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.3); }
                `}
            </style>
            {/* Header */}
            <div className="card-title" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: 0, paddingBottom: "14px", borderBottom: "1px solid rgba(255,255,255,0.05)", marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Radio size={16} color="var(--accent-cyan)" style={{ marginTop: "-2px" }} />
                    <span style={{ fontSize: "14px", letterSpacing: "1px", lineHeight: 1 }}>UDP Threat Analysis</span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={{ display: "flex", gap: "12px", textTransform: "none", fontSize: "12px", fontWeight: "normal" }}>
                        <div className="threat-badge safe" style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                            <Activity size={12} /> {formatNumber(summary.total_sources)} Total Sources
                        </div>
                        <div className="threat-badge danger" style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                            <ShieldAlert size={12} /> {formatNumber(summary.total_flagged)} Flagged
                        </div>
                        <div className="threat-badge warning" style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                            <AlertTriangle size={12} /> {formatNumber(summary.total_suspicious)} Anomalies
                        </div>
                    </div>

                    <div style={{ borderLeft: "1px solid rgba(255,255,255,0.1)", height: "20px" }}></div>

                    <div style={{ display: "flex", alignItems: "center", gap: "6px", color: statusObj.color, fontWeight: 600, fontSize: "13px", padding: "4px 8px", background: `rgba(${status === 'malicious' ? '255,0,60' : status === 'suspicious' ? '255,153,0' : '0,255,0'}, 0.1)`, borderRadius: "4px" }}>
                        {statusObj.icon} {statusObj.label}
                    </div>
                </div>
            </div>

            {/* Enterprise Anomaly Intelligence Panel */}
            {suspicious.length > 0 && (
                <div style={{
                    padding: "16px 20px",
                    background: "linear-gradient(90deg, rgba(255,153,0,0.05) 0%, rgba(30,25,20,0.4) 100%)",
                    border: "1px solid rgba(255,153,0,0.15)",
                    borderLeft: "4px solid var(--accent-orange)",
                    borderRadius: "6px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px"
                }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                            <div style={{ padding: "10px", background: "rgba(255,153,0,0.1)", border: "1px solid rgba(255,153,0,0.2)", borderRadius: "8px" }}>
                                <AlertTriangle size={24} color="var(--accent-orange)" />
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                <div style={{ color: "var(--accent-orange)", fontSize: "16px", fontWeight: 600, letterSpacing: "0.5px" }}>
                                    {suspicious.length} Behavioral Anomalies Detected
                                </div>
                                <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", lineHeight: 1.5, maxWidth: "600px" }}>
                                    {status === "suspicious"
                                        ? "This capture lacks critical malicious signatures, but exhibits anomalous structural deviations (e.g., unexpected burst or port utilization) that warrant secondary SOC review."
                                        : "These behaviors do not strictly map to critical IOCs, but present deviations from normal traffic baselines."}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowAnomalies(!showAnomalies)}
                            style={{
                                background: showAnomalies ? "rgba(255,153,0,0.1)" : "transparent",
                                border: "1px solid rgba(255,153,0,0.3)",
                                color: "var(--accent-orange)",
                                fontSize: "12px",
                                fontWeight: 500,
                                padding: "8px 16px",
                                borderRadius: "4px",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "8px",
                                transition: "all 0.2s"
                            }}
                        >
                            {showAnomalies ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            {showAnomalies ? "Collapse Telemetry" : "Inspect Anomalies"}
                        </button>
                    </div>

                    {showAnomalies && (
                        <div style={{ marginTop: "4px", borderTop: "1px solid rgba(255,153,0,0.1)", paddingTop: "16px" }}>
                            <div className="udp-scroll" style={{ maxHeight: "250px", overflowY: "auto", padding: 0 }}>
                                <table className="ip-table" style={{ width: "100%", margin: 0, borderCollapse: "collapse" }}>
                                    <thead style={{ position: "sticky", top: 0, background: "rgba(255, 153, 0, 0.05)", zIndex: 1, backdropFilter: "blur(12px)" }}>
                                        <tr>
                                            <th style={{ textAlign: "left", fontSize: "11px", color: "var(--text-secondary)", padding: "10px", borderBottom: "1px solid rgba(255,153,0,0.15)", fontWeight: "600" }}>Source IP</th>
                                            <th style={{ textAlign: "left", fontSize: "11px", color: "var(--text-secondary)", padding: "10px", borderBottom: "1px solid rgba(255,153,0,0.1)", fontWeight: "600" }}>Score</th>
                                            <th style={{ textAlign: "left", fontSize: "11px", color: "var(--text-secondary)", padding: "10px", borderBottom: "1px solid rgba(255,153,0,0.1)", fontWeight: "600" }}>Risk</th>
                                            <th style={{ textAlign: "left", fontSize: "11px", color: "var(--text-secondary)", padding: "10px", borderBottom: "1px solid rgba(255,153,0,0.1)", fontWeight: "600" }}>Reason</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sortedAnomalies.map((item, i) => (
                                            <tr key={i} className="ids-row-hover">
                                                <td style={{ color: "var(--text-primary)", padding: "10px", fontSize: "12px", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>{item.ip}</td>
                                                <td style={{ color: "var(--accent-orange)", padding: "10px", fontSize: "12px", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>{formatNumber(item.score)}</td>
                                                <td style={{ color: "var(--text-secondary)", padding: "10px", fontSize: "12px", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>Low</td>
                                                <td style={{ color: "rgba(255,255,255,0.6)", padding: "10px", fontSize: "12px", borderBottom: "1px solid rgba(255,255,255,0.03)", fontStyle: "italic" }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                        <span>{(item.reasons || [])[0] || "Unknown Pattern"}</span>
                                                        <div
                                                            onMouseEnter={(e) => handleMouseEnter(e, (item.reasons || [])[0])}
                                                            onMouseLeave={handleMouseLeave}
                                                            style={{ display: "inline-flex" }}
                                                        >
                                                            <Info size={14} color="var(--text-secondary)" style={{ cursor: "help" }} />
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {status === "clean" ? (
                <div style={{ padding: "40px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", minHeight: "200px" }}>
                    <ShieldCheck size={48} color="var(--accent-green)" style={{ opacity: 0.8 }} />
                    <div style={{ fontSize: "16px", color: "var(--text-primary)", fontWeight: 500 }}>No malicious UDP behavior detected</div>
                    <div style={{ fontSize: "14px", color: "var(--text-secondary)", textAlign: "center" }}>
                        Traffic appears normal with no scanning, amplification, or burst patterns.
                        {suspicious.length > 0 && (
                            <div style={{ marginTop: "6px", color: "rgba(255,255,255,0.4)" }}>Minor anomalies detected but not indicative of active threats.</div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="grid" style={{ gap: "20px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))", alignItems: "stretch" }}>

                    {/* Left Column */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

                        {/* Priority Targets */}
                        {priorityTargets.length > 0 && (
                            <div className="layer-section" style={{ flex: 1, display: "flex", flexDirection: "column", margin: 0, border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "6px", overflow: "hidden" }}>
                                <div className="layer-header" style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 16px", color: "var(--text-primary)", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", background: "rgba(255, 255, 255, 0.02)" }}>
                                    <ShieldAlert size={14} color="var(--text-primary)" /> Priority Targets
                                </div>
                                <div className="layer-body" style={{ padding: 0, flex: 1, display: "flex", flexDirection: "column", background: "transparent" }}>
                                    <div className="udp-scroll" style={{ padding: 0, flex: 1, overflowY: "auto", overflowX: "hidden" }}>
                                        {priorityTargets.map((item, i) => {
                                            const riskColor = item.risk_badge === "High" ? "var(--accent-red)" : item.risk_badge === "Medium" ? "var(--accent-orange)" : "var(--accent-green)";
                                            const bgBadge = item.risk_badge === "High" ? 'rgba(255,0,60,0.15)' : item.risk_badge === "Medium" ? 'rgba(255,153,0,0.15)' : 'rgba(0,255,0,0.15)';
                                            const borderBadge = item.risk_badge === "High" ? 'rgba(255,0,60,0.3)' : item.risk_badge === "Medium" ? 'rgba(255,153,0,0.3)' : 'rgba(0,255,0,0.3)';
                                            return (
                                                <div key={i} className="ids-row-hover" style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "16px", borderBottom: i === priorityTargets.length - 1 ? "none" : "1px solid rgba(255,255,255,0.03)", transition: "background 0.2s" }} onMouseOver={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)"} onMouseOut={(e) => e.currentTarget.style.background = "transparent"}>
                                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                                            <span style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "14px", letterSpacing: "0.5px" }}>{item.ip}</span>
                                                            <span style={{ fontSize: "10px", fontWeight: 700, padding: "4px 8px", borderRadius: "4px", color: riskColor, background: bgBadge, border: `1px solid ${borderBadge}`, letterSpacing: "0.5px", textTransform: "uppercase" }}>{item.risk_badge} RISK</span>
                                                        </div>
                                                        <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", fontFamily: "monospace" }}>Score: <strong style={{ color: "var(--text-primary)", fontSize: "14px" }}>{formatNumber(item.score)}</strong></span>
                                                    </div>
                                                    <div style={{ fontSize: "13px", color: "var(--text-secondary)", fontStyle: "italic", whiteSpace: "normal" }}>
                                                        {item.explanation}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* High Risk Targets (Flagged) */}
                        {flagged.length > 0 && (
                            <div className="layer-section" style={{ margin: 0, border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "6px", overflow: "hidden" }}>
                                <div className="layer-header" style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 16px", color: "var(--text-primary)", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", background: "rgba(255, 255, 255, 0.02)" }}>
                                    <ShieldAlert size={14} color="var(--text-primary)" /> High Risk Section
                                </div>
                                <div className="layer-body" style={{ padding: 0 }}>
                                    <div className="udp-scroll" style={{ maxHeight: "200px", overflowY: "auto", padding: 0 }}>
                                        {flagged.map((item, i) => (
                                            <div key={i} className="ids-row-hover" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderBottom: i === flagged.length - 1 ? "none" : "1px solid rgba(255,255,255,0.03)", transition: "background 0.2s" }} onMouseOver={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)"} onMouseOut={(e) => e.currentTarget.style.background = "transparent"}>
                                                <span style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "14px", letterSpacing: "0.5px" }}>{item.ip}</span>
                                                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", fontFamily: "monospace" }}>Score: <strong style={{ color: "var(--text-primary)", fontSize: "14px" }}>{formatNumber(item.score)}</strong></span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                        {/* Suricata UDP Summary */}
                        <div className="layer-section" style={{ margin: 0, border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "6px", overflow: "hidden" }}>
                            <div className="layer-header" style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 14px", color: "var(--text-primary)", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", background: "rgba(255, 255, 255, 0.02)" }}>
                                <Siren size={14} color="var(--text-primary)" /> Suricata UDP Summary
                            </div>
                            <div className="layer-body" style={{ padding: "14px", display: "flex", flexDirection: "column", gap: "10px", background: "transparent" }}>
                                <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "4px" }}>Suricata Correlation:</div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "rgba(255, 255, 255, 0.03)", borderRadius: "4px", border: "1px solid rgba(255, 255, 255, 0.05)", borderLeft: "3px solid var(--accent-red)" }}>
                                    <span style={{ color: "var(--accent-red)", fontSize: "13px", fontWeight: 600 }}>High Priority Alerts</span>
                                    <span style={{ color: "var(--text-primary)", fontSize: "14px", fontWeight: 600, fontFamily: "monospace" }}>{formatNumber(suricataSummary.High)}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "rgba(255, 255, 255, 0.03)", borderRadius: "4px", border: "1px solid rgba(255, 255, 255, 0.05)", borderLeft: "3px solid var(--accent-orange)" }}>
                                    <span style={{ color: "var(--accent-orange)", fontSize: "13px", fontWeight: 600 }}>Medium Priority Alerts</span>
                                    <span style={{ color: "var(--text-primary)", fontSize: "14px", fontWeight: 600, fontFamily: "monospace" }}>{formatNumber(suricataSummary.Medium)}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "rgba(255, 255, 255, 0.03)", borderRadius: "4px", border: "1px solid rgba(255, 255, 255, 0.05)", borderLeft: "3px solid var(--accent-green)" }}>
                                    <span style={{ color: "var(--accent-green)", fontSize: "13px", fontWeight: 600 }}>Low Priority Alerts</span>
                                    <span style={{ color: "var(--text-primary)", fontSize: "14px", fontWeight: 600, fontFamily: "monospace" }}>{formatNumber(suricataSummary.Low)}</span>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Right Column / Full Width Blocks */}
                    <div style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "20px"
                    }}>

                        {/* Top UDP Sources */}
                        <div className="layer-section" style={{ flex: 1, display: "flex", flexDirection: "column", margin: 0, border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "6px", overflow: "hidden" }}>
                            <div className="layer-header" style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 16px", color: "var(--text-primary)", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", background: "rgba(255, 255, 255, 0.02)" }}>
                                <Activity size={14} color="var(--text-primary)" /> Top UDP Sources
                            </div>
                            <div className="layer-body" style={{ padding: 0, flex: 1, display: "flex", flexDirection: "column", background: "transparent" }}>
                                {topSources.length === 0 ? (
                                    <div style={{ fontSize: "13px", color: "var(--text-secondary)", padding: "16px", textAlign: "center", fontStyle: "italic" }}>
                                        Insufficient data.
                                    </div>
                                ) : (
                                    <div className="udp-scroll" style={{ padding: 0, flex: 1, overflowY: "auto", overflowX: "hidden" }}>
                                        <table className="ip-table" style={{ width: "100%", margin: 0, borderCollapse: "collapse" }}>
                                            <thead style={{ position: "sticky", top: 0, background: "rgba(255, 255, 255, 0.05)", zIndex: 1, backdropFilter: "blur(12px)" }}>
                                                <tr>
                                                    <th style={{ textAlign: "left", fontSize: "11px", color: "rgba(255,255,255,0.5)", padding: "12px 16px", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", fontWeight: "600", letterSpacing: "0.5px", textTransform: "uppercase" }}>IP</th>
                                                    <th style={{ textAlign: "right", fontSize: "11px", color: "rgba(255,255,255,0.5)", padding: "12px 16px", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", fontWeight: "600", letterSpacing: "0.5px", textTransform: "uppercase" }}>Count</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {topSources.slice(0, 8).map(([ip, count], i) => (
                                                    <tr key={i} className="ids-row-hover" style={{ transition: "background 0.2s" }} onMouseOver={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)"} onMouseOut={(e) => e.currentTarget.style.background = "transparent"}>
                                                        <td style={{ color: "var(--text-primary)", padding: "10px 16px", fontSize: "13px", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>{ip}</td>
                                                        <td style={{ color: "var(--text-primary)", padding: "10px 16px", fontSize: "13px", textAlign: "right", borderBottom: "1px solid rgba(255,255,255,0.03)", fontFamily: "monospace" }}>{formatNumber(count)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Top UDP Ports */}
                        <div className="layer-section" style={{ margin: 0, border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "6px", overflow: "hidden" }}>
                            <div className="layer-header" style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 16px", color: "var(--text-primary)", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", background: "rgba(255, 255, 255, 0.02)" }}>
                                <Zap size={14} color="var(--text-primary)" /> Top UDP Ports
                            </div>
                            <div className="layer-body" style={{ padding: 0 }}>
                                {ports.length === 0 ? (
                                    <div style={{ fontSize: "13px", color: "var(--text-secondary)", padding: "16px", textAlign: "center", fontStyle: "italic" }}>
                                        No port data available.
                                    </div>
                                ) : (
                                    <div className="udp-scroll" style={{ maxHeight: "220px", overflowY: "auto", overflowX: "hidden" }}>
                                        <table className="ip-table" style={{ width: "100%", margin: 0, borderCollapse: "collapse" }}>
                                            <thead style={{ position: "sticky", top: 0, background: "rgba(255, 255, 255, 0.05)", zIndex: 1, backdropFilter: "blur(12px)" }}>
                                                <tr>
                                                    <th style={{ textAlign: "left", fontSize: "11px", color: "rgba(255,255,255,0.5)", padding: "12px 16px", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", fontWeight: "600", letterSpacing: "0.5px", textTransform: "uppercase" }}>Port</th>
                                                    <th style={{ textAlign: "right", fontSize: "11px", color: "rgba(255,255,255,0.5)", padding: "12px 16px", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", fontWeight: "600", letterSpacing: "0.5px", textTransform: "uppercase" }}>Pkts</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {ports.slice(0, 6).map(([port, count], i) => (
                                                    <tr key={i} className="ids-row-hover" style={{ transition: "background 0.2s" }} onMouseOver={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)"} onMouseOut={(e) => e.currentTarget.style.background = "transparent"}>
                                                        <td style={{ color: "var(--text-primary)", padding: "10px 16px", fontSize: "13px", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>{port}</td>
                                                        <td style={{ color: "var(--text-primary)", padding: "10px 16px", fontSize: "13px", textAlign: "right", borderBottom: "1px solid rgba(255,255,255,0.03)", fontFamily: "monospace" }}>{formatNumber(count)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {/* Custom Tooltip Portal */}
            {tooltipData && (
                <div
                    style={{
                        position: "fixed",
                        left: tooltipData.x,
                        top: tooltipData.y,
                        transform: "translate(-50%, -100%)",
                        background: "var(--bg-secondary, #1a1a2e)",
                        border: "1px solid var(--border-subtle, #333)",
                        padding: "10px 14px",
                        borderRadius: "6px",
                        color: "var(--text-primary, #f3f4f6)",
                        fontSize: "12px",
                        boxShadow: "0 8px 32px rgba(0,0,0,0.8)",
                        zIndex: 99999,
                        pointerEvents: "none",
                        width: "max-content",
                        maxWidth: "280px",
                        lineHeight: 1.5,
                        fontStyle: "normal",
                        textAlign: "center"
                    }}
                >
                    {tooltipData.text}
                </div>
            )}
        </div>
    );
}