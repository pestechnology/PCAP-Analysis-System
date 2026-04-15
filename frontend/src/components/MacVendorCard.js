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
import { Cpu } from "lucide-react";

export default function MacVendorCard({ vendors = [] }) {

    return (
        <div className="card mac-card">
            <div className="card-title" style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0, paddingBottom: "14px", borderBottom: "1px solid var(--border-subtle)", marginBottom: "16px" }}>
                <Cpu size={16} color="var(--accent-purple)" style={{ marginTop: "-2px" }} />
                <span style={{ fontSize: "13px", letterSpacing: "1px", lineHeight: 1 }}>MAC VENDOR IDENTIFICATION</span>
            </div>

            {vendors.length === 0 ? (
                <div className="muted">No vendor data detected</div>
            ) : (
                <div className="mac-scroll">
                    <table className="ip-table">
                        <thead>
                        <tr>
                            <th>Vendor</th>
                            <th className="right">Occurrences</th>
                        </tr>
                        </thead>
                        <tbody>
                        {vendors.map((item, index) => (
                            <tr key={index}>
                                <td>
                                    <a
                                        href={`https://macvendors.com/query/${item[0]}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ color: "var(--accent-blue)", textDecoration: "none" }}
                                    >
                                        {item[0]}
                                    </a>
                                </td>

                                <td className="right">{item[1]}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
