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

export default function IPPercentageCard({ percentages = {} }) {

    return (
        <div className="card">
            <div className="card-title">IP Classification Breakdown (%)</div>

            {Object.keys(percentages).length === 0 ? (
                <div className="muted">No classification data available</div>
            ) : (
                <div className="percentage-grid">
                    {Object.entries(percentages).map(([key, value]) => (
                        <div key={key} className="percentage-item">
                            <div className="percentage-label">{key}</div>
                            <div className="percentage-value">{value}%</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
