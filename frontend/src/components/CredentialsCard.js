/*
© Copyright 2026 Mohit Pal
Licensed under the MIT;
you may not use this file except in compliance with the License.
SPDX-License-Identifier: MIT
*/
import React from "react";
import { Key, Shield, User, Lock, ArrowRight } from "lucide-react";

export default function CredentialsCard({ credentials = [] }) {
    return (
        <div className="card">
            <div className="card-title" style={{ display: "flex", alignItems: "center", gap: "10px", margin: 0, paddingBottom: "16px", borderBottom: "1px solid var(--border-subtle)", marginBottom: "20px" }}>
                <Key size={18} color="var(--accent-red)" />
                <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: "14px", fontWeight: "800", letterSpacing: "1px" }}>ENTERPRISE CREDENTIAL AUDIT</span>
                    <span style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "4px", textTransform: "uppercase" }}>
                        Unencrypted protocol intercept and authentication harvest
                    </span>
                </div>
            </div>

            {credentials.length === 0 ? (
                <div className="muted" style={{ padding: "20px 0", fontSize: "13px", textAlign: "center", color: "var(--text-muted)" }}>
                    No unencrypted credentials identified in the current telemetry stream.
                </div>
            ) : (
                <div className="scroll-list" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {credentials.map((cred, index) => (
                        <div key={index} className="scroll-item" style={{ 
                            background: "rgba(255,255,255,0.01)", 
                            borderRadius: "10px", 
                            padding: "16px", 
                            border: "1px solid var(--border-subtle)",
                            display: "flex",
                            flexDirection: "column",
                            gap: "12px"
                        }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "8px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <Shield size={14} color="var(--accent-red)" />
                                    <span style={{ fontWeight: "900", color: "var(--accent-red)", fontSize: "12px", letterSpacing: "1px" }}>{cred.protocol}</span>
                                </div>
                                <div style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "monospace", display: "flex", alignItems: "center", gap: "6px" }}>
                                    {cred.client} <ArrowRight size={10} /> {cred.server}
                                </div>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-subtle)", fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                        <User size={12} /> Identity / Username
                                    </div>
                                    <div style={{ 
                                        background: "rgba(0,240,255,0.03)", 
                                        padding: "10px 12px", 
                                        borderRadius: "6px", 
                                        border: "1px solid rgba(0,240,255,0.1)",
                                        color: "var(--text-main)",
                                        fontSize: "13px",
                                        fontWeight: "600",
                                        wordBreak: "break-all"
                                    }}>
                                        {cred.username}
                                    </div>
                                </div>

                                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-subtle)", fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                        <Lock size={12} /> Secret / Password
                                    </div>
                                    <div style={{ 
                                        background: "rgba(255,0,0,0.03)", 
                                        padding: "10px 12px", 
                                        borderRadius: "6px", 
                                        border: "1px solid rgba(255,0,0,0.1)",
                                        color: "var(--accent-red)",
                                        fontSize: "13px",
                                        fontFamily: "monospace",
                                        fontWeight: "700",
                                        wordBreak: "break-all"
                                    }}>
                                        {cred.password_snippet}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
