import React, { useState } from "react";
import { Link, ChevronDown, ChevronRight, Download } from "lucide-react";

// Native fetch to backend
const BASE_URL = "http://localhost:8000";

function TransactionRow({ tx, jobId }) {
    const [expanded, setExpanded] = useState(false);
    const [streamData, setStreamData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const toggle = async () => {
        if (!expanded) {
            setExpanded(true);
            if (!streamData && !loading) {
                setLoading(true);
                try {
                    const res = await fetch(`${BASE_URL}/api/http-stream/${jobId}/${tx.stream_index}`);
                    if (!res.ok) throw new Error("Stream fetch failed");
                    const data = await res.json();
                    setStreamData(data.data);
                } catch (err) {
                    setError("Failed to fetch stream. The original capture may have been purged.");
                } finally {
                    setLoading(false);
                }
            }
        } else {
            setExpanded(false);
        }
    };

    const handleDownload = (e) => {
        e.stopPropagation();
        if (!streamData) return;
        const blob = new Blob([streamData], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `http_stream_${tx.stream_index}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const renderStreamText = (text) => {
        if (!text) return null;
        return (
            <pre style={{ 
                margin: 0, padding: "16px", backgroundColor: "#1e1e1e", 
                color: "#d4d4d4", fontSize: "11px", overflowX: "auto", 
                fontFamily: "var(--font-mono)", borderTop: "1px solid var(--border-subtle)" 
            }}>
                {text.split('\n').map((line, i) => {
                    // Method / Response coloring
                    if (line.match(/^(GET|POST|PUT|DELETE|HTTP\/1\.[01])/)) {
                        return <div key={i} style={{ color: "var(--accent-green)", fontWeight: 600 }}>{line}</div>;
                    } 
                    // Header keys coloring
                    else if (line.match(/^([\w-]+):\s(.*)/)) {
                        const parts = line.split(/:\s(.*)/);
                        return <div key={i}><span style={{ color: "var(--accent-red)" }}>{parts[0]}:</span> {parts[1]}</div>;
                    } 
                    // Default body
                    else {
                        return <div key={i}>{line}</div>;
                    }
                })}
            </pre>
        );
    };

    const getMethodColor = (method) => {
        switch (method) {
            case "GET": return "var(--accent-blue)";
            case "POST": return "var(--accent-orange)";
            case "PUT": return "var(--accent-purple)";
            case "DELETE": return "var(--accent-red)";
            default: return "var(--text-muted)";
        }
    };

    return (
        <div style={{ 
            marginBottom: "12px", 
            border: "1px solid var(--border-subtle)", 
            borderRadius: "6px", 
            overflow: "hidden",
            backgroundColor: expanded ? "var(--bg-panel)" : "transparent"
        }}>
            <div 
                onClick={toggle}
                style={{ 
                    cursor: "pointer", 
                    display: "flex", 
                    alignItems: "center", 
                    padding: "10px 14px", 
                    backgroundColor: expanded ? "var(--bg-panel-hover)" : "transparent", 
                    gap: "10px",
                    transition: "background 0.2s ease"
                }}
            >
                <div style={{ flex: 1, display: "flex", alignItems: "center", flexWrap: "wrap", gap: "6px", fontSize: "12px" }}>
                    <span style={{ 
                        backgroundColor: "rgba(59, 130, 246, 0.1)",
                        color: "var(--accent-blue)", 
                        padding: "2px 6px",
                        borderRadius: "4px"
                    }}>{tx.client_ip}</span>
                    <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>:{tx.client_port}</span>
                    
                    <span style={{ color: "var(--text-muted)", margin: "0 4px" }}>→</span>
                    
                    <span style={{ 
                        backgroundColor: "rgba(16, 185, 129, 0.1)",
                        color: "var(--accent-green)", 
                        padding: "2px 6px",
                        borderRadius: "4px"
                    }}>{tx.server_host}</span>
                    <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>({tx.server_ip})</span>
                    <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>:{tx.server_port}</span>
                </div>
                
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ 
                        backgroundColor: getMethodColor(tx.method),
                        color: "#fff",
                        padding: "3px 10px",
                        borderRadius: "12px",
                        fontSize: "10px",
                        fontWeight: "bold",
                        letterSpacing: "0.5px"
                    }}>
                        {tx.method}
                    </span>
                    <div style={{ color: "var(--text-muted)", display: "flex", alignItems: "center" }}>
                        {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </div>
                </div>
            </div>

            {expanded && (
                <div style={{ backgroundColor: "var(--bg-panel)", position: "relative" }}>
                    {loading ? (
                        <div style={{ padding: "20px", color: "var(--text-muted)", fontSize: "12px", textAlign: "center" }}>
                            Reconstructing TCP stream from origin...
                        </div>
                    ) : error ? (
                        <div style={{ padding: "20px", color: "var(--accent-red)", fontSize: "12px", textAlign: "center" }}>
                            {error}
                        </div>
                    ) : streamData ? (
                        <div style={{ position: "relative" }}>
                            {renderStreamText(streamData)}
                            <div style={{ padding: "12px 16px", backgroundColor: "#1e1e1e", borderTop: "1px dashed #333", display: "flex" }}>
                                <button 
                                    onClick={handleDownload}
                                    style={{
                                        display: "flex", 
                                        alignItems: "center", 
                                        gap: "8px",
                                        padding: "8px 14px", 
                                        backgroundColor: "var(--accent-blue)", 
                                        border: "none",
                                        borderRadius: "4px", 
                                        color: "#fff", 
                                        cursor: "pointer", 
                                        fontSize: "12px",
                                        fontWeight: 600,
                                        transition: "opacity 0.2s ease"
                                    }}
                                    onMouseOver={(e) => e.target.style.opacity = 0.8}
                                    onMouseOut={(e) => e.target.style.opacity = 1}
                                >
                                    <Download size={14} /> Download text dump
                                </button>
                            </div>
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );
}

export default function HttpTransactionsCard({ transactions = [], jobId }) {
    return (
        <div className="card mac-card" style={{ gridColumn: "span 2" }}>
            <div className="card-title" style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0, paddingBottom: "14px", borderBottom: "1px solid var(--border-subtle)", marginBottom: "16px" }}>
                <Link size={16} color="var(--accent-blue)" style={{ marginTop: "-2px" }} />
                <span style={{ fontSize: "13px", letterSpacing: "1px", lineHeight: 1 }}>EXTRACTED HTTP TRANSACTIONS</span>
            </div>

            {(!transactions || transactions.length === 0) ? (
                <div className="muted">No HTTP transactions extracted</div>
            ) : (
                <div
                    className="mac-scroll"
                    style={{
                        maxHeight: "500px",
                        overflowY: "auto",
                        paddingRight: "6px"
                    }}
                >
                    {transactions.map((tx, index) => (
                        <TransactionRow key={index} tx={tx} jobId={jobId} />
                    ))}
                </div>
            )}
        </div>
    );
}
