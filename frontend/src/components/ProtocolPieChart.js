import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
    Chart,
    PieController,
    ArcElement,
    Tooltip,
    Legend
} from "chart.js";

Chart.register(PieController, ArcElement, Tooltip, Legend);

export default function ProtocolPieChart({ distribution = {} }) {

    const canvasRef = useRef(null);
    const chartRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {

        if (!distribution || Object.keys(distribution).length === 0) return;

        if (chartRef.current) chartRef.current.destroy();

        const labels = Object.keys(distribution);
        const values = Object.values(distribution);

        chartRef.current = new Chart(canvasRef.current, {
            type: "pie",
            data: {
                labels,
                datasets: [{
                    data: values,
                    backgroundColor: [
                        "#0A84FF",
                        "#30D158",
                        "#FF9F0A",
                        "#FF453A",
                        "#BF5AF2",
                        "#64D2FF",
                        "#FFD60A",
                        "#AC8E68",
                        "#2f2985",
                    ],
                    borderWidth: 1,
                    borderColor: "rgba(28,28,30,0.05)"
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: "top",
                        labels: {
                            color: "#ffffff",
                            padding: 14,
                            boxWidth: 12
                        }
                    },
                    tooltip: {
                        backgroundColor: "#2c2c2e",
                        titleColor: "#fff",
                        bodyColor: "#fff"
                    }
                },
                onClick: (event, elements) => {
                    if (!elements.length) return;

                    const index = elements[0].index;
                    const protocol = labels[index];

                    navigate(`/protocol/${protocol}`);
                }
            }
        });

    }, [distribution, navigate]);

    return (
        <div className="card">
            <div className="card-title">Protocol Distribution</div>
            <div style={{ height: "300px" }}>
                <canvas ref={canvasRef} />
            </div>
        </div>
    );
}
