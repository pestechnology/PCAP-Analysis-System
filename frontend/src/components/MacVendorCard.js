import React from "react";

export default function MacVendorCard({ vendors = [] }) {

    return (
        <div className="card mac-card">
            <div className="card-title">MAC Vendor Identification</div>

            {vendors.length === 0 ? (
                <div className="muted">No vendor data detected</div>
            ) : (
                <div className="mac-scroll">
                    <table className="ip-table">
                        <thead>
                        <tr>
                            <th>Vendor</th>
                            <th className="right">Occurrences</th>
                        </tr>
                        </thead>
                        <tbody>
                        {vendors.map((item, index) => (
                            <tr key={index}>
                                <td>
                                    <a
                                        href={`https://macvendors.com/query/${item[0]}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ color: "#0A84FF", textDecoration: "none" }}
                                    >
                                        {item[0]}
                                    </a>
                                </td>

                                <td className="right">{item[1]}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
