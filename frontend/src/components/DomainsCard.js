import React from "react";
import { Compass } from "lucide-react";

export default function DomainsCard({ domains = [] }) {
    return (
        <div className="card">
            <div className="card-title" style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0, paddingBottom: "14px", borderBottom: "1px solid var(--border-subtle)", marginBottom: "16px" }}>
                <Compass size={16} color="var(--accent-blue)" style={{ marginTop: "-2px" }} />
                <span style={{ fontSize: "13px", letterSpacing: "1px", lineHeight: 1 }}>EXTRACTED DOMAINS</span>
            </div>

            {domains.length === 0 ? (
                <div className="muted">No domains extracted</div>
            ) : (
                <div className="scroll-list">
                    {domains.map((domain, index) => (
                        <div key={index} className="scroll-item">
                            {domain}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
