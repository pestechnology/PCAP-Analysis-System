import React, { useEffect, useRef, useState } from "react";
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

Chart.register(
    LineController,
    LineElement,
    PointElement,
    LinearScale,
    CategoryScale,
    Tooltip,
    Legend
);

export default function ProtocolTimelineChart({ timeline = {} }) {

    const canvasRef = useRef(null);
    const chartRef = useRef(null);

    const [mode, setMode] = useState("relative"); // relative | absolute

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
        // Bucket RELATIVE to first packet
        // ===============================

        const bucketed = {};

        rawTimestamps.forEach(ts => {

            const relativeSeconds = ts - startTime;

            const bucket = Math.floor(relativeSeconds / 5) * 5;

            if (!bucketed[bucket]) bucketed[bucket] = {};

            Object.entries(timeline[ts]).forEach(([proto, count]) => {
                bucketed[bucket][proto] =
                    (bucketed[bucket][proto] || 0) + count;
            });
        });

        const bucketKeys = Object.keys(bucketed)
            .map(Number)
            .sort((a, b) => a - b);

        // ===============================
        // X-Axis Labels
        // ===============================

        const labels = bucketKeys.map(bucket => {

            if (mode === "relative") {
                return `${bucket}s`;
            }

            // Absolute time
            const absoluteTime = new Date((startTime + bucket) * 1000);
            return absoluteTime.toLocaleTimeString();
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
        // Apple Subtle Color Palette
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
        // STEP 5: Render Chart
        // ===============================

        chartRef.current = new Chart(canvasRef.current, {
            type: "line",
            data: {
                labels,
                datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: "index",
                    intersect: false
                },
                plugins: {
                    legend: {
                        labels: {
                            color: "#f5f5f7"
                        }
                    },
                    tooltip: {
                        backgroundColor: "#2c2c2e",
                        titleColor: "#ffffff",
                        bodyColor: "#ffffff"
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: "#a1a1a6",
                            maxTicksLimit: 8
                        },
                        grid: {
                            color: "rgba(255,255,255,0.05)"
                        }
                    },
                    y: {
                        ticks: {
                            color: "#a1a1a6"
                        },
                        grid: {
                            color: "rgba(255,255,255,0.05)"
                        }
                    }
                }
            }
        });

    }, [timeline, mode]);

    return (
        <div className="card">
            <div
                className="card-title"
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
            >
                <span>Protocol Activity Over Time</span>

                <div style={{ fontSize: "12px" }}>
                    <button
                        onClick={() => setMode("relative")}
                        style={{
                            marginRight: "8px",
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
                </div>
            </div>

            <div style={{ height: "320px" }}>
                <canvas ref={canvasRef} />
            </div>
        </div>
    );
}
