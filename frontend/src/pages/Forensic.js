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
import ForensicScoreCard from "../components/ForensicScoreCard";

export default function Forensic({ data }) {
    if (!data) return null;

    const hasScore = !!data.forensic_score;

    return (
        <>
            <h2 className="section-heading">Forensic Confidence Assessment</h2>

            <div className="section-group">
                {hasScore ? (
                    <ForensicScoreCard data={data} />
                ) : (
                    <div style={{
                        padding: "40px 24px",
                        textAlign: "center",
                        color: "#4b5563",
                        fontSize: "14px",
                        background: "var(--card-bg, #0f1117)",
                        border: "1px solid var(--border-subtle, rgba(255,255,255,0.07))",
                        borderRadius: "12px",
                    }}>
                        No analysis result available. Upload and analyze a PCAP file to generate a
                        Forensic Confidence Score.
                    </div>
                )}
            </div>
        </>
    );
}
