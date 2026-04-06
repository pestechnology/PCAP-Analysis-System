import React from "react";
import { Globe2 } from "lucide-react";

export default function CountryTrafficCard({ data = [] }) {

    return (
        <div className="card">
            <div className="card-title" style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0, paddingBottom: "14px", borderBottom: "1px solid var(--border-subtle)", marginBottom: "16px" }}>
                <Globe2 size={16} color="var(--accent-orange)" style={{ marginTop: "-2px" }} />
                <span style={{ fontSize: "13px", letterSpacing: "1px", lineHeight: 1 }}>COUNTRY TRAFFIC DISTRIBUTION</span>
            </div>

            {data.length === 0 ? (
                <div className="muted">No country data available</div>
            ) : (
                <div className="table-container">

                    <table className="ip-table">
                        <thead>
                        <tr>
                            <th>Country</th>
                            <th className="right">Packets</th>
                        </tr>
                        </thead>
                    </table>

                    <div className="table-scroll custom-scroll">
                        <table className="ip-table">
                            <tbody>
                            {data.filter(item => item[0] && item[0] !== "Unknown").map((item, index) => (
                                <tr key={index}>
                                    <td>{item[0]}</td>
                                    <td className="right">{item[1]}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>

                </div>
            )}
        </div>
    );
}
