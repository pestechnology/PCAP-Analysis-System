import React, { useEffect, useRef, useMemo } from "react";
import {
    Chart,
    PieController,
    ArcElement,
    Tooltip,
    Legend
} from "chart.js";

Chart.register(
    PieController,
    ArcElement,
    Tooltip,
    Legend
);

export default function IPChart({ data }) {

    const canvasRef = useRef(null);
    const chartRef = useRef(null);

    const distribution = data?.ip_distribution || {};

    // ✅ Memoized values (fixes ESLint warning properly)
    const labels = useMemo(() => Object.keys(distribution), [distribution]);
    const values = useMemo(() => Object.values(distribution), [distribution]);

    useEffect(() => {

        if (!labels.length) return;

        if (chartRef.current) {
            chartRef.current.destroy();
        }

        chartRef.current = new Chart(canvasRef.current, {
            type: "pie",
            data: {
                labels,
                datasets: [{
                    data: values,
                    backgroundColor: [
                        "#0A84FF",  // Apple Blue
                        "#30D158",  // Apple Green
                        "#FF9F0A",  // Apple Orange
                        "#BF5AF2",  // Apple Purple
                        "#64D2FF"   // Apple Teal
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: "#ffffff" }
                    }
                }
            }
        });

    }, [labels, values]);   // ✅ Now clean and valid

    return (
        <div className="card">
            <div className="card-title">IP Address Classification</div>

            <div style={{
                width: "250px",
                height: "250px",
                margin: "0 auto"
            }}>
                <canvas ref={canvasRef} />
            </div>
        </div>
    );
}
