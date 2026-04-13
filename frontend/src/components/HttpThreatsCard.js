/*
 * © Copyright 2026 PES University.
 *
 * Authors:
 *   Mohit Pal - mp65742@gmail.com
 *   Swetha P - swethap@pes.edu
 *
 * Contributors:
 *   PurpleSynapz
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * SPDX-License-Identifier: Apache-2.0
 */
import { ShieldAlert } from "lucide-react";

export default function HttpThreatsCard({ threats }) {

    return (
        <div className="card mac-card">

            <div className="card-title" style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0, paddingBottom: "14px", borderBottom: "1px solid var(--border-subtle)", marginBottom: "16px" }}>
                <ShieldAlert size={16} color="var(--accent-orange)" style={{ marginTop: "-2px" }} />
                <span style={{ fontSize: "13px", letterSpacing: "1px", lineHeight: 1 }}>UNENCRYPTED MALICIOUS HTTP</span>
            </div>

            {(!threats || threats.length === 0) ? (
                <div className="muted">No unencrypted threats detected</div>
            ) : (
                <div
                    className="card-body mac-scroll"
                    style={{
                        maxHeight: "300px",
                        overflowY: "auto",
                        paddingRight: "6px"
                    }}
                >

                {threats.map((alert, index) => {

                    const severityColor =
                        alert.severity === 1
                            ? "var(--accent-red)"
                            : alert.severity === 2
                                ? "var(--accent-orange)"
                                : "var(--accent-cyan)";

                    return (
                        <div
                            key={index}
                            className="scroll-item"
                            style={{
                                paddingBottom: "10px",
                            }}
                        >

                            <div
                                style={{
                                    fontWeight: 600,
                                    color: severityColor,
                                    marginBottom: "4px",
                                    fontFamily: "var(--font-heading)"
                                }}
                            >
                                {alert.signature}
                            </div>

                            <div
                                style={{
                                    fontSize: "12px",
                                    color: "var(--text-secondary)",
                                    fontFamily: "var(--font-mono)"
                                }}
                            >
                                {alert.src_ip} → {alert.dest_ip}
                            </div>

                            <div
                                style={{
                                    fontSize: "12px",
                                    color: "var(--text-secondary)",
                                    marginTop: "4px"
                                }}
                            >
                                {alert.category}
                            </div>

                        </div>
                    );
                })}

            </div>
            )}
        </div>
    );
}