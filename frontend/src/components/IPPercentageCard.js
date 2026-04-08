/*
© Copyright 2026 Mohit Pal
Licensed under the MIT;
you may not use this file except in compliance with the License.
SPDX-License-Identifier: MIT
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
