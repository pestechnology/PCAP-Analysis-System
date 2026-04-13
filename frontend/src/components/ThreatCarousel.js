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
import React, { useState, useMemo } from "react";

export default function ThreatCarousel({ data }) {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const countryData = data?.country_traffic || [];

    const sortedData = useMemo(() => {
        return [...countryData].sort((a, b) => b[1] - a[1]);
    }, [countryData]);

    const totalPackets = sortedData.reduce((s, [, p]) => s + p, 0);

    if (sortedData.length === 0) {
        return (
            <div className="card-surface" style={{ textAlign: "center", opacity: 0.5, fontSize: "12px" }}>
                No geospatial data available.
            </div>
        );
    }

    const selectedCountry = sortedData[selectedIndex]?.[0] || "Unknown";
    const selectedPackets = sortedData[selectedIndex]?.[1] || 0;

    const formatTrafficShare = (countryPackets, total) => {
        if (!total || countryPackets === 0) return "0%";
        const raw = (countryPackets / total) * 100;
        if (raw < 0.0001) return raw.toFixed(6) + "%";
        if (raw < 0.01) return raw.toFixed(4) + "%";
        if (raw < 0.1) return raw.toFixed(3) + "%";
        if (raw < 1) return raw.toFixed(2) + "%";
        return raw.toFixed(1) + "%";
    };

    const percentage = formatTrafficShare(selectedPackets, totalPackets);

    const nextCard = () => {
        setSelectedIndex(prev => prev < sortedData.length - 1 ? prev + 1 : prev);
    };

    const prevCard = () => {
        setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
    };

    return (
        <div className="card-surface" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            
            <div className="stat-sub-card">
                <span className="stat-label">SELECTED COUNTRY</span>
                <span className="stat-value" style={{ fontFamily: 'var(--font-display)' }}>{selectedCountry}</span>
            </div>

            <div className="stat-sub-card">
                <span className="stat-label">TOTAL PACKETS</span>
                <span className="stat-value">{selectedPackets}</span>
            </div>

            <div className="stat-sub-card">
                <span className="stat-label">TRAFFIC SHARE</span>
                <span className="stat-value" style={{ color: 'var(--accent-cyan)' }}>{percentage}</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", marginTop: "8px" }}>
                <button 
                    onClick={prevCard} 
                    disabled={selectedIndex === 0}
                    style={{
                        background: 'transparent', border: 'none', color: selectedIndex === 0 ? 'var(--text-muted)' : 'var(--accent-cyan)',
                        fontSize: '18px', cursor: selectedIndex === 0 ? 'not-allowed' : 'pointer', padding: '4px 8px'
                    }}
                >
                    &lt;
                </button>

                <div style={{ fontFamily: 'var(--font-data)', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {selectedIndex + 1} / {sortedData.length}
                </div>

                <button 
                    onClick={nextCard} 
                    disabled={selectedIndex === sortedData.length - 1}
                    style={{
                        background: 'transparent', border: 'none', color: selectedIndex === sortedData.length - 1 ? 'var(--text-muted)' : 'var(--accent-cyan)',
                        fontSize: '18px', cursor: selectedIndex === sortedData.length - 1 ? 'not-allowed' : 'pointer', padding: '4px 8px'
                    }}
                >
                    &gt;
                </button>
            </div>
        </div>
    );
}
