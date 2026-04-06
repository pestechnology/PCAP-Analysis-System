import { useState, useEffect } from "react";
import { Siren } from "lucide-react";
import IPCard from "../components/IPCard";
import CountryTrafficCard from "../components/CountryTrafficCard";
import IPChart from "../components/IPChart";
import GeoGlobeCinematic from "../components/GeoGlobeCinematic";
import TLSMetadataCard from "../components/TLSMetadataCard";
import "../index.css";
import UDPAnalysisCard from "../components/UDPAnalysisCard";

/* ================================
   IP Classification
================================ */
function classifyIP(ip) {
    const parts = ip.split(".").map(Number);
    if (parts.length !== 4) return "Public";

    const [a, b] = parts;

    if (a === 10) return "Private";
    if (a === 172 && b >= 16 && b <= 31) return "Private";
    if (a === 192 && b === 168) return "Private";

    return "Public";
}

/* ================================
   Suricata Severity Mapping
================================ */
function mapSuricataSeverity(sev) {
    if (sev === 1) return { label: "High", color: "var(--accent-red)", className: "pulse-critical" };
    if (sev === 2) return { label: "Medium", color: "var(--accent-orange)", className: "" };
    return { label: "Low", color: "var(--accent-green)", className: "" };
}

export default function Intelligence({ data }) {

    const [severityFilter, setSeverityFilter] = useState("All");
    const [senders, setSenders] = useState([]);
    const [receivers, setReceivers] = useState([]);
    const [expandedIP, setExpandedIP] = useState(null);
    const [collapsed, setCollapsed] = useState(false)

    useEffect(() => {
        setSenders(data?.top_senders || []);
        setReceivers(data?.top_receivers || []);
    }, [data]);

    const thStyle = {
        textAlign: "left",
        padding: "14px 10px",
        fontSize: "13px",
        fontWeight: 600,
        color: "#9ca3af"
    };

    const tdStyle = {
        padding: "14px 10px",
        fontSize: "14px",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        color: "#e5e7eb",
        verticalAlign: "middle"
    };

    const abnormalData = data?.abnormal_activity?.flagged_entities || [];

    return (
        <>
            <h2 className="section-heading">Threat & IP Intelligence</h2>

            <GeoGlobeCinematic countryData={data?.country_traffic} />

            <div className="section-group">
                <IPChart data={data} />
            </div>

            <div className="section-group grid">
                <CountryTrafficCard data={data?.country_traffic} />
            </div>

            {/* ================================
               Enterprise Suricata IDS View
            ================================ */}
            <div className="section-group">
                <div className="card">

                    {/* Header */}
                    {/* Header */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: "20px"
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px"
                            }}
                        >
                            <div className="card-title" style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
                                <Siren size={18} color="var(--accent-red)" style={{ marginTop: "-2px" }} />
                                <span style={{ fontSize: "14px", letterSpacing: "1px", lineHeight: 1 }}>SURICATA IDS ALERTS</span>
                            </div>

                            {/* Info Icon */}
                            <div
                                style={{
                                    position: "relative",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center"
                                }}
                            >
                                <div
                                    style={{
                                        width: "22px",
                                        height: "22px",
                                        borderRadius: "50%",
                                        border: "1px solid rgba(255,255,255,0.2)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: "13px",
                                        color: "#aaa",
                                        cursor: "pointer",
                                        transition: "all 0.2s ease"
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.nextSibling.style.opacity = "1";
                                        e.currentTarget.nextSibling.style.visibility = "visible";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.nextSibling.style.opacity = "0";
                                        e.currentTarget.nextSibling.style.visibility = "hidden";
                                    }}
                                >
                                    i
                                </div>

                                {/* Tooltip */}
                                <div
                                    style={{
                                        position: "absolute",
                                        top: "32px",
                                        left: "0",
                                        width: "360px",
                                        background: "var(--bg-secondary)",
                                        padding: "16px",
                                        borderRadius: "10px",
                                        fontSize: "13px",
                                        color: "#ccc",
                                        boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
                                        opacity: 0,
                                        visibility: "hidden",
                                        transition: "opacity 0.2s ease",
                                        zIndex: 9999,
                                        lineHeight: "1.6"
                                    }}
                                >
                                    Displays alerts generated directly by the Suricata IDS engine.
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filter */}
                    <div style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        marginBottom: "12px"
                    }}>
                        <select
                            value={severityFilter}
                            onChange={(e) => setSeverityFilter(e.target.value)}
                            style={{
                                padding: "6px 10px",
                                borderRadius: "6px",
                                background: "var(--bg-secondary)",
                                color: "var(--text-primary)",
                                border: "1px solid var(--border-subtle)"
                            }}
                        >
                            <option value="All">All</option>
                            <option value="High">High (Severity 1)</option>
                            <option value="Medium">Medium (Severity 2)</option>
                            <option value="Low">Low (Severity 3)</option>
                        </select>
                    </div>

                    <div className="ids-scroll" style={{ maxHeight: "450px", overflowY: "scroll" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead style={{
                                position: "sticky",
                                top: 0,
                                zIndex: 10,
                                background: "var(--bg-secondary)",
                                borderBottom: "1px solid var(--border-subtle)"
                            }}>
                            <tr>
                                <th style={thStyle}>Source IP</th>
                                <th style={thStyle}>Highest Severity</th>
                                <th style={thStyle}>Alert Count</th>
                                <th style={thStyle}>First Seen</th>
                                <th style={thStyle}>Last Seen</th>
                                <th style={thStyle}></th>
                            </tr>
                            </thead>

                            <tbody>
                            {(() => {
                                const filteredData = abnormalData.filter(item => {
                                    if (severityFilter === "All") return true;
                                    const sev = mapSuricataSeverity(item.highest_severity).label;
                                    return sev === severityFilter;
                                });

                                if (filteredData.length === 0) {
                                    return (
                                        <tr>
                                            <td colSpan="6" style={{ padding: "30px", textAlign: "center", color: "var(--text-secondary)" }}>
                                                {abnormalData.length === 0 ? "No IDS alerts detected in this capture." : "No IDS alerts match the selected severity."}
                                            </td>
                                        </tr>
                                    );
                                }

                                return filteredData.map((item, i) => {

                                    const sevObj = mapSuricataSeverity(item.highest_severity);

                                    const timestamps = item.alerts
                                        .map(a => a.timestamp)
                                        .filter(Boolean)
                                        .sort((a, b) => new Date(a) - new Date(b));

                                    const formatDate = (isoStr) => {
                                        if (!isoStr || isoStr === "-") return "-";
                                        const date = new Date(isoStr);
                                        return date.toLocaleString();
                                    };

                                    const firstSeen = timestamps.length ? formatDate(timestamps[0]) : "-";
                                    const lastSeen = timestamps.length ? formatDate(timestamps[timestamps.length - 1]) : "-";

                                    return (
                                        <>
                                            <tr
                                                key={i}
                                                className="ids-scroll ids-row-hover"
                                                style={{
                                                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                                                    cursor: "pointer"
                                                }}
                                                onClick={() =>
                                                    setExpandedIP(expandedIP === item.ip ? null : item.ip)
                                                }
                                            >
                                                <td style={tdStyle}>{item.ip}</td>

                                                <td style={{
                                                    ...tdStyle,
                                                    color: sevObj.color,
                                                    fontWeight: 600
                                                }} className={sevObj.className}>
                                                    {sevObj.label}
                                                </td>

                                                <td style={tdStyle}>{item.alert_count}</td>
                                                <td style={tdStyle}>{firstSeen}</td>
                                                <td style={tdStyle}>{lastSeen}</td>

                                                <td style={tdStyle}>
                                                    {expandedIP === item.ip ? "▲" : "▼"}
                                                </td>
                                            </tr>

                                            {expandedIP === item.ip && (
                                                <tr>
                                                    <td colSpan="6" style={{ padding: 0 }}>
                                                        <div
                                                            style={{
                                                                background: "var(--bg-panel)",
                                                                maxHeight: "320px",
                                                                overflowY: "scroll",
                                                                padding: "18px",
                                                                borderTop: "1px solid rgba(255,255,255,0.06)"
                                                            }}
                                                        >
                                                            {item.alerts.map((alert, idx) => {
                                                                const sevDetail = mapSuricataSeverity(alert.severity);

                                                                return (
                                                                    <div
                                                                        key={idx}
                                                                        className="ids-detail-hover"
                                                                        style={{
                                                                            marginBottom: "12px",
                                                                            padding: "12px",
                                                                            borderBottom: idx !== item.alerts.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none"
                                                                        }}
                                                                    >
                                                                        <div
                                                                            style={{
                                                                                fontWeight: 600,
                                                                                color: sevDetail.color,
                                                                                marginBottom: "8px"
                                                                            }}
                                                                        >
                                                                            {alert.signature}
                                                                        </div>

                                                                        <div style={{ fontSize: "12px", opacity: 0.85 }}>
                                                                            Severity: {sevDetail.label}
                                                                        </div>

                                                                        <div style={{ fontSize: "12px", opacity: 0.85 }}>
                                                                            Category: {alert.category}
                                                                        </div>

                                                                        <div style={{ fontSize: "12px", opacity: 0.85 }}>
                                                                            SID: {alert.sid} | Rev: {alert.rev || "-"}
                                                                        </div>

                                                                        <div style={{ fontSize: "12px", opacity: 0.85 }}>
                                                                            Timestamp: {alert.timestamp ? new Date(alert.timestamp).toLocaleString() : "-"}
                                                                        </div>

                                                                        <div style={{ fontSize: "12px", opacity: 0.85 }}>
                                                                            Source: {alert.src_ip}:{alert.src_port || "-"}
                                                                        </div>

                                                                        <div style={{ fontSize: "12px", opacity: 0.85 }}>
                                                                            Destination: {alert.dest_ip}:{alert.dest_port || "-"}
                                                                        </div>

                                                                        <div style={{ fontSize: "12px", opacity: 0.85 }}>
                                                                            Protocol: {alert.proto || "-"}
                                                                        </div>

                                                                        <div style={{ fontSize: "12px", opacity: 0.85 }}>
                                                                            Flow ID: {alert.flow_id || "-"}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </>
                                    );
                                });
                            })()}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* ================================
            UDP Threat Analysis
            ================================ */}
            {data?.udp_analysis && (
                <div className="section-group">
                    <UDPAnalysisCard data={data.udp_analysis} />
                </div>
            )}

            {/* ================================
            Suspicious Domain Detection
            ================================ */}
            {(data?.domain_threat_alerts || []).length > 0 && (
                <div className="section-group">
                    <div className="card">

                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "18px"
                    }}>
                        <div style={{
                            fontSize: "20px",
                            fontWeight: 600
                        }}>
                            Suspicious Domain Detection
                        </div>

                        <div
                            style={{
                                fontSize: "13px",
                                opacity: 0.6
                            }}
                        >
                            DNS & TLS SNI intelligence correlation
                        </div>
                    </div>

                    <div className="ids-scroll" style={{ maxHeight: "400px", overflowY: "auto" }}>
                        <table style={{
                            width: "100%",
                            borderCollapse: "collapse"
                        }}>
                            <thead style={{
                                position: "sticky",
                                top: 0,
                                zIndex: 10,
                                background: "var(--bg-secondary)",
                                borderBottom: "1px solid var(--border-subtle)"
                            }}>
                            <tr>
                                <th style={thStyle}>Domain</th>
                                <th style={thStyle}>Source</th>
                                <th style={thStyle}>Classification</th>
                            </tr>
                            </thead>

                            <tbody>
                            {(data?.domain_threat_alerts || []).length === 0 ? (
                                <tr>
                                    <td colSpan="3" style={{
                                        padding: "30px",
                                        textAlign: "center",
                                        color: "var(--text-secondary)"
                                    }}>
                                        No malicious domains detected in this capture.
                                    </td>
                                </tr>
                            ) : (
                                data.domain_threat_alerts.map((item, index) => {

                                    const isMalicious = item.classification === "malicious";
                                    const color = isMalicious ? "var(--accent-red)" : "var(--accent-orange)";
                                    const pulseClass = isMalicious ? "pulse-critical" : "";

                                    return (
                                        <tr
                                            key={index}
                                            className="ids-row-hover"
                                            style={{
                                                borderBottom: "1px solid rgba(255,255,255,0.05)"
                                            }}
                                        >
                                            <td style={tdStyle}>{item.domain}</td>

                                            <td style={tdStyle}>{item.source}</td>

                                            <td style={{
                                                ...tdStyle,
                                                color: color,
                                                fontWeight: 600
                                            }} className={pulseClass}>
                                                {item.classification.toUpperCase()}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            )}

            <h2 className="section-heading">Top Talkers</h2>

            <div className="section-group talkers-grid">
                <IPCard
                    title="Public Senders"
                    list={senders.filter(item => classifyIP(item[0]) === "Public")}
                    geoData={data?.geo_data}
                    showCountry={true}
                />

                <IPCard
                    title="Public Receivers"
                    list={receivers.filter(item => classifyIP(item[0]) === "Public")}
                    geoData={data?.geo_data}
                    showCountry={true}
                />

                <IPCard
                    title="Private Senders"
                    list={senders.filter(item => classifyIP(item[0]) === "Private")}
                />

                <IPCard
                    title="Private Receivers"
                    list={receivers.filter(item => classifyIP(item[0]) === "Private")}
                />
            </div>


            {data?.tls_metadata && (
                <TLSMetadataCard data={data.tls_metadata} />
            )}
        </>
    );
}