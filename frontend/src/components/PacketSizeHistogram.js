import React, { useEffect, useRef } from "react";
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
            <div className="card-title">Packet Size Distribution</div>
            <div style={{ height: "320px" }}>
                <canvas ref={canvasRef}></canvas>
            </div>
        </div>
    );
}
