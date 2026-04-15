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

import React, { useEffect, useRef } from "react";
import { BarChart2 } from "lucide-react";
import {
    Chart,
    BarController,
    BarElement,
    CategoryScale,
    LinearScale,
    Tooltip,
    Legend
} from "chart.js";

Chart.register(
    BarController,
    BarElement,
    CategoryScale,
    LinearScale,
    Tooltip,
    Legend
);

export default function PacketSizeHistogram({ histogram = {} }) {
    const canvasRef = useRef(null);
    const chartRef = useRef(null);

    useEffect(() => {
        if (!canvasRef.current) return;

        if (chartRef.current) {
            chartRef.current.destroy();
        }

        const bins = histogram || {};

        const labels = Object.keys(bins);
        const values = Object.values(bins).map(v => Number(v) || 0);

        chartRef.current = new Chart(canvasRef.current, {
            type: "bar",
            data: {
                labels: labels.length ? labels : ["0-200","201-400","401-800","801-1200","1201-1500","1500+"],
                datasets: [
                    {
                        label: "Packet Count",
                        data: values,
                        backgroundColor: "rgba(64, 156, 255, 0.53)",
                        borderWidth: 1,
                        borderRadius: 6,
                        hoverBackgroundColor: "rgba(64, 156, 255, 0.7)"
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        ticks: { color: "#8e8e93" },
                        grid: { display: false }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: { color: "#8e8e93" },
                        grid: { color: "rgba(255,255,255,0.05)" }
                    }
                },
                plugins: {
                    legend: {
                        labels: { color: "#d1d1d6" }
                    }
                }
            }
        });
    }, [histogram]);

    return (
        <div className="card">
            <div className="card-title" style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0, paddingBottom: "14px", borderBottom: "1px solid var(--border-subtle)", marginBottom: "16px" }}>
                <BarChart2 size={16} color="var(--accent-cyan)" style={{ marginTop: "-2px" }} />
                <span style={{ fontSize: "13px", letterSpacing: "1px", lineHeight: 1 }}>PACKET SIZE DISTRIBUTION</span>
            </div>
            <div style={{ height: "320px" }}>
                <canvas ref={canvasRef}></canvas>
            </div>
        </div>
    );
}
