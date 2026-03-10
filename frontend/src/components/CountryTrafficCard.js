import React from "react";

export default function CountryTrafficCard({ data = [] }) {

    return (
        <div className="card">
            <div className="card-title">Country Traffic Distribution</div>

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
                            {data.map((item, index) => (
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
