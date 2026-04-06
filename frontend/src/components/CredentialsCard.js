import React from "react";
import { Key } from "lucide-react";

export default function CredentialsCard({ credentials = [] }) {
    return (
        <div className="card">
            <div className="card-title" style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0, paddingBottom: "14px", borderBottom: "1px solid var(--border-subtle)", marginBottom: "16px" }}>
                <Key size={16} color="var(--accent-red)" style={{ marginTop: "-2px" }} />
                <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: "13px", letterSpacing: "1px", lineHeight: 1 }}>UNENCRYPTED CREDENTIALS</span>
                    <span style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "4px" }}>
                        IMAP/POP, SMTP, HTTP, FTP, Telnet, SMB/NTLM, Postgres, LDAP, Kerberos, MSSQL, SNMP, SIP
                    </span>
                </div>
            </div>

            {credentials.length === 0 ? (
                <div className="muted" style={{ padding: "16px 0", fontSize: "12px", color: "var(--text-muted)" }}>No credentials extracted</div>
            ) : (
                <div className="scroll-list">
                    {credentials.map((cred, index) => (
                        <div key={index} className="scroll-item" style={{ display: "flex", flexDirection: "column", gap: "6px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "10px", marginBottom: "10px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontWeight: 600, color: "var(--accent-red)", fontSize: "11px", letterSpacing: "0.5px" }}>{cred.protocol}</span>
                                <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "monospace" }}>{cred.client} ➔ {cred.server}</span>
                            </div>
                            <div style={{ fontSize: "13px", background: "rgba(255,255,255,0.02)", padding: "6px 8px", borderRadius: "4px", border: "1px solid var(--border-subtle)" }}>
                                <div style={{ marginBottom: "2px" }}><span style={{ color: "var(--text-subtle)", width: "40px", display: "inline-block" }}>User:</span> <span style={{ color: "var(--text-main)", fontWeight: 500 }}>{cred.username}</span></div>
                                <div><span style={{ color: "var(--text-subtle)", width: "40px", display: "inline-block" }}>Pass:</span> <span style={{ color: "var(--text-main)", fontFamily: "monospace" }}>{cred.password_snippet}</span></div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
