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
import React from "react";
import { Link } from "lucide-react";

export default function UrlsCard({ urls = [] }) {
    return (
        <div className="card mac-card">
            <div className="card-title" style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0, paddingBottom: "14px", borderBottom: "1px solid var(--border-subtle)", marginBottom: "16px" }}>
                <Link size={16} color="var(--accent-purple)" style={{ marginTop: "-2px" }} />
                <span style={{ fontSize: "13px", letterSpacing: "1px", lineHeight: 1 }}>EXTRACTED URLS</span>
            </div>

            {urls.length === 0 ? (
                <div className="muted">No HTTP URLs extracted</div>
            ) : (
                <div
                    className="mac-scroll"
                    style={{
                        maxHeight: "300px",
                        overflowY: "auto",
                        paddingRight: "6px",
                        marginTop: "10px"
                    }}
                >
                    <ul
                        className="simple-list"
                        style={{
                            listStyle: "none",
                            padding: 0,
                            margin: 0
                        }}
                    >
                        {urls.map((url, index) => (
                            <li
                                key={index}
                                className="scroll-item"
                                style={{
                                    wordBreak: "break-all",
                                    color: "var(--text-secondary)",
                                    fontFamily: "var(--font-mono)"
                                }}
                            >
                                {url}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}