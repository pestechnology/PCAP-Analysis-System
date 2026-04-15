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
import { FileArchive } from "lucide-react";

export default function FilesCard({ files = [] }) {
    return (
        <div className="card">
            <div className="card-title" style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0, paddingBottom: "14px", borderBottom: "1px solid var(--border-subtle)", marginBottom: "16px" }}>
                <FileArchive size={16} color="var(--accent-blue)" style={{ marginTop: "-2px" }} />
                <span style={{ fontSize: "13px", letterSpacing: "1px", lineHeight: 1 }}>EXTRACTED FILES</span>
            </div>

            {files.length === 0 ? (
                <div className="muted" style={{ padding: "16px 0", fontSize: "12px", color: "var(--text-muted)" }}>No files extracted</div>
            ) : (
                <div className="scroll-list">
                    {files.map((file, index) => (
                        <div key={index} className="scroll-item" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ wordBreak: "break-all", marginRight: "10px", fontSize: "13px" }}>{file.filename}</div>
                            <div style={{ fontSize: "11px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                                {file.protocol} | {(file.size_bytes / 1024).toFixed(1)} KB
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
