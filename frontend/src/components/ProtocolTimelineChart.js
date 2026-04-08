/*
© Copyright 2026 Mohit Pal
Licensed under the MIT;
you may not use this file except in compliance with the License.
SPDX-License-Identifier: MIT
*/
import React, { useEffect, useRef, useState } from "react";
import { ActivitySquare } from "lucide-react";
import {
    Chart,
    LineController,
    LineElement,
    PointElement,
    LinearScale,
    CategoryScale,
    Tooltip,
    Legend
} from "chart.js";
import zoomPlugin from "chartjs-plugin-zoom";

Chart.register(
    LineController,
    LineElement,
    PointElement,
    LinearScale,
    CategoryScale,
    Tooltip,
    Legend,
    zoomPlugin
);

export default function ProtocolTimelineChart({ timeline = {} }) {

    const canvasRef = useRef(null);
    const chartRef = useRef(null);
    const [mode, setMode] = useState("relative"); // relative | absolute

    // Keep a ref to bucket metadata for tooltip enrichment
    const bucketMeta = useRef({ startTime: 0, bucketKeys: [] });

    useEffect(() => {

        if (!timeline || Object.keys(timeline).length === 0) return;

        if (chartRef.current) chartRef.current.destroy();

        // ===============================
        // Sort raw timestamps
        // ===============================
        const rawTimestamps = Object.keys(timeline)
            .map(Number)
            .sort((a, b) => a - b);

        if (rawTimestamps.length === 0) return;

        const startTime = rawTimestamps[0];

        // ===============================
        // 1-second granularity bucketing
        // ===============================
        const bucketed = {};

        rawTimestamps.forEach(ts => {
            const relativeSeconds = ts - startTime;
            const bucket = Math.floor(relativeSeconds); // 1-second bucket

            if (!bucketed[bucket]) bucketed[bucket] = {};

            Object.entries(timeline[ts]).forEach(([proto, count]) => {
                bucketed[bucket][proto] =
                    (bucketed[bucket][proto] || 0) + count;
            });
        });

        const bucketKeys = Object.keys(bucketed)
            .map(Number)
            .sort((a, b) => a - b);

        const isMultiDay = bucketKeys.length > 0 &&
            new Date(startTime * 1000).toDateString() !==
            new Date((startTime + bucketKeys[bucketKeys.length - 1]) * 1000).toDateString();

        // Store for tooltip use
        bucketMeta.current = { startTime, bucketKeys };

        // ===============================
        // X-Axis Labels
        // ===============================
        const labels = bucketKeys.map(bucket => {
            if (mode === "relative") {
                return `${bucket}s`;
            }
            const absoluteTime = new Date((startTime + bucket) * 1000);

            if (isMultiDay) {
                // Multi-day: include date part (MM-DD HH:MM)
                return absoluteTime.toISOString().slice(5, 16).replace("T", " ");
            }

            // Single day: only show time (HH:MM:SS)
            return absoluteTime.toISOString().slice(11, 19);
        });

        // ===============================
        // Top 5 Protocols Only
        // ===============================
        const protocolTotals = {};

        bucketKeys.forEach(t => {
            Object.entries(bucketed[t]).forEach(([p, c]) => {
                protocolTotals[p] = (protocolTotals[p] || 0) + c;
            });
        });

        const topProtocols = Object.entries(protocolTotals)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(entry => entry[0]);

        // ===============================
        // Protocol Color Palette
        // ===============================
        const protocolColors = {
            TCP: "#30D158",
            UDP: "#64D2FF",
            IPv4: "#0A84FF",
            IPv6: "#3c3bc5",
            HTTPS: "#dc98ff",
            HTTP: "#FF9F0A",
            DNS: "#FFD60A",
            ICMP: "#FF375F",
            ARP: "#AC8E68",
            QUIC: "#8d22ba"
        };

        const datasets = topProtocols.map((protocol) => ({
            label: protocol,
            data: bucketKeys.map(t => bucketed[t][protocol] || 0),
            borderColor: protocolColors[protocol] || "#8E8E93",
            backgroundColor: protocolColors[protocol] || "#8E8E93",
            tension: 0.35,
            pointRadius: 0,
            borderWidth: 2
        }));

        // ===============================
        // Render Chart with Zoom Plugin
        // ===============================
        chartRef.current = new Chart(canvasRef.current, {
            type: "line",
            data: { labels, datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: "index",
                    intersect: false
                },
                plugins: {
                    legend: {
                        labels: { color: "#f5f5f7" }
                    },
                    tooltip: {
                        backgroundColor: "#1c1c1e",
                        titleColor: "#ffffff",
                        bodyColor: "#adadad",
                        borderColor: "rgba(255,255,255,0.1)",
                        borderWidth: 1,
                        padding: 12,
                        callbacks: {
                            title(items) {
                                if (!items.length) return "";
                                const idx = items[0].dataIndex;
                                const { startTime, bucketKeys } = bucketMeta.current;
                                const bucket = bucketKeys[idx] ?? 0;
                                const absDate = new Date((startTime + bucket) * 1000);
                                const absStr = absDate.toISOString().replace("T", " ").slice(0, 19) + " UTC";
                                return [`+${bucket}s from capture start`, absStr];
                            },
                            label(ctx) {
                                return `  ${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString()} pkt`;
                            }
                        }
                    },
                    zoom: {
                        pan: {
                            enabled: true,
                            mode: "x"
                        },
                        zoom: {
                            wheel: { enabled: true },
                            pinch: { enabled: true },
                            drag: { enabled: false },
                            mode: "x"
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: "#a1a1a6",
                            maxTicksLimit: 10,
                            maxRotation: 0
                        },
                        grid: { color: "rgba(255,255,255,0.05)" },
                        title: {
                            display: true,
                            text: mode === "relative" ? "Time from capture start (seconds)" : "Capture time (UTC)",
                            color: "#6e6e73",
                            font: { size: 11 },
                            padding: { top: 8 }
                        }
                    },
                    y: {
                        ticks: { color: "#a1a1a6" },
                        grid: { color: "rgba(255,255,255,0.05)" },
                        title: {
                            display: true,
                            text: "Packets / second",
                            color: "#6e6e73",
                            font: { size: 11 },
                            padding: { bottom: 8 }
                        }
                    }
                }
            }
        });

    }, [timeline, mode]);

    const handleResetZoom = () => {
        if (chartRef.current) chartRef.current.resetZoom();
    };

    return (
        <div className="card">
            <div
                className="card-title"
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: 0, paddingBottom: "14px", borderBottom: "1px solid var(--border-subtle)", marginBottom: "16px" }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <ActivitySquare size={16} color="var(--accent-green)" style={{ marginTop: "-2px" }} />
                    <span style={{ fontSize: "13px", letterSpacing: "1px", lineHeight: 1 }}>PROTOCOL ACTIVITY OVER TIME</span>
                    {bucketMeta.current.startTime > 0 && (
                        <span style={{
                            fontSize: "11px",
                            color: "var(--text-muted, #8e8e93)",
                            marginLeft: "8px",
                            paddingLeft: "8px",
                            borderLeft: "1px solid var(--border-subtle)",
                            fontWeight: 400
                        }}>
                            Date: {new Date(bucketMeta.current.startTime * 1000).toISOString().slice(0, 10)}
                            {bucketMeta.current.bucketKeys.length > 0 &&
                                new Date(bucketMeta.current.startTime * 1000).toDateString() !==
                                new Date((bucketMeta.current.startTime + bucketMeta.current.bucketKeys[bucketMeta.current.bucketKeys.length - 1]) * 1000).toDateString() &&
                                ` → ${new Date((bucketMeta.current.startTime + bucketMeta.current.bucketKeys[bucketMeta.current.bucketKeys.length - 1]) * 1000).toISOString().slice(0, 10)}`
                            }
                        </span>
                    )}
                </div>

                <div style={{ display: "flex", gap: "6px", alignItems: "center", fontSize: "12px" }}>
                    <button
                        onClick={() => setMode("relative")}
                        style={{
                            background: mode === "relative" ? "var(--bg-panel-hover)" : "transparent",
                            border: "1px solid var(--border-subtle)",
                            color: "var(--text-primary)",
                            padding: "4px 8px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            transition: "all 0.2s ease"
                        }}
                    >
                        Relative
                    </button>
                    <button
                        onClick={() => setMode("absolute")}
                        style={{
                            background: mode === "absolute" ? "var(--bg-panel-hover)" : "transparent",
                            border: "1px solid var(--border-subtle)",
                            color: "var(--text-primary)",
                            padding: "4px 8px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            transition: "all 0.2s ease"
                        }}
                    >
                        Absolute
                    </button>
                    <button
                        onClick={handleResetZoom}
                        title="Reset zoom"
                        style={{
                            background: "transparent",
                            border: "1px solid var(--border-subtle)",
                            color: "var(--text-muted, #8e8e93)",
                            padding: "4px 8px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            fontSize: "11px"
                        }}
                    >
                        ↺ Reset
                    </button>
                </div>
            </div>

            <div style={{ height: "320px" }}>
                <canvas ref={canvasRef} />
            </div>
        </div>
    );
}
