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
import { Lock } from "lucide-react";

/* ============================
   TLS Version Mapping
============================ */
function formatTLSVersion(hex) {
    const map = {
        "0x0301": "TLS 1.0",
        "0x0302": "TLS 1.1",
        "0x0303": "TLS 1.2",
        "0x0304": "TLS 1.3"
    };
    return map[hex] || hex;
}

/* ============================
   Section Component
============================ */
function Section({ title, data }) {
    const entries = Object.entries(data || {}).sort((a, b) => b[1] - a[1]);

    if (!entries.length) return null;

    return (
        <div style={{ marginBottom: "28px" }}>
            <div
                style={{
                    fontWeight: 600,
                    fontSize: "14px",
                    marginBottom: "10px",
                    letterSpacing: "0.5px",
                    color: "#d1d5db"
                }}
            >
                {title}
            </div>

            <div
                style={{
                    maxHeight: "180px",
                    overflowY: "auto",
                    borderRadius: "8px",
                    background: "rgba(255,255,255,0.02)",
                    padding: "10px 12px"
                }}
                className="clean-scroll"
            >
                {entries.map(([key, count], i) => (
                    <div
                        key={i}
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "6px 0",
                            borderBottom:
                                i !== entries.length - 1
                                    ? "1px solid rgba(255,255,255,0.04)"
                                    : "none"
                        }}
                    >
                        <span
                            style={{
                                fontSize: "13px",
                                color: "#e5e7eb",
                                maxWidth: "75%",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap"
                            }}
                            title={key}
                        >
                            {title === "TLS Versions"
                                ? formatTLSVersion(key)
                                : key}
                        </span>

                        <span
                            style={{
                                background: "rgba(90,200,250,0.15)",
                                color: "#5ac8fa",
                                padding: "2px 8px",
                                borderRadius: "20px",
                                fontSize: "12px",
                                fontWeight: 500
                            }}
                        >
                            {count}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ============================
   Main TLS Card
============================ */
export default function TLSMetadataCard({ data }) {
    if (!data) return null;

    return (
        <div className="card">
            <div className="card-title" style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0, paddingBottom: "14px", borderBottom: "1px solid var(--border-subtle)", marginBottom: "25px" }}>
                <Lock size={16} color="var(--accent-green)" style={{ marginTop: "-2px" }} />
                <span style={{ fontSize: "13px", letterSpacing: "1px", lineHeight: 1 }}>TLS / SSL METADATA</span>
            </div>

            <Section title="TLS Versions" data={data.versions} />
            <Section title="Cipher Suites" data={data.cipher_suites} />
            <Section title="SNI Domains" data={data.sni_domains} />
            <Section title="JA3 Fingerprints" data={data.ja3_fingerprints} />
            <Section title="Certificate Issuers" data={data.cert_issuers} />
        </div>
    );
}