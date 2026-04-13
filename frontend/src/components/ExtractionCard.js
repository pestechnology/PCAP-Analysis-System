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
export default function ExtractionCard({ domains, urls }) {
    return (
        <div className="card">
            <div className="card-title">Extracted Domains & URLs</div>

            <div style={{ marginBottom: "12px" }}>
                <strong>Domains:</strong>
                <ul>
                    {domains.map((d, i) => (
                        <li key={i}>{d}</li>
                    ))}
                </ul>
            </div>

            <div>
                <strong>URLs:</strong>
                <ul>
                    {urls.map((u, i) => (
                        <li key={i}>{u}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
