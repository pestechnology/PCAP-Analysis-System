import React, { useState, useMemo } from "react";
import { UploadCloud, DownloadCloud, HardDriveUpload, HardDriveDownload, Search } from "lucide-react";

function getFlagEmoji(countryCode) {
    if (!countryCode) return "";
    return countryCode
        .toUpperCase()
        .replace(/./g, char =>
            String.fromCodePoint(127397 + char.charCodeAt())
        );
}

export default function IPCard({
    title,
    list = [],
    geoData = {},
    showCountry = false
}) {

    const [vtResults, setVtResults] = useState({});
    const [loadingIP, setLoadingIP] = useState(null);

    let Icon = Search;
    let iconColor = "var(--text-primary)";
    if (title === "Public Senders") { Icon = UploadCloud; iconColor = "var(--accent-orange)"; }
    else if (title === "Public Receivers") { Icon = DownloadCloud; iconColor = "var(--accent-blue)"; }
    else if (title === "Private Senders") { Icon = HardDriveUpload; iconColor = "var(--accent-purple)"; }
    else if (title === "Private Receivers") { Icon = HardDriveDownload; iconColor = "var(--accent-cyan)"; }

    // ==================================================
    // RISK-BASED SORTING (SOC PRIORITY ORDER)
    // ==================================================

    const sortedList = useMemo(() => {

        return [...list].sort((a, b) => {

            const ipA = a[0];
            const ipB = b[0];

            const vtA = vtResults[ipA];
            const vtB = vtResults[ipB];

            // 1️⃣ Most recently enriched first
            if (vtA?.lastChecked && vtB?.lastChecked) {
                if (vtA.lastChecked !== vtB.lastChecked) {
                    return vtB.lastChecked - vtA.lastChecked;
                }
            } else if (vtA?.lastChecked) {
                return -1;
            } else if (vtB?.lastChecked) {
                return 1;
            }

            // 2️⃣ Then risk score
            const scoreA = vtA
                ? (vtA.malicious * 3 + vtA.suspicious * 2)
                : -1;

            const scoreB = vtB
                ? (vtB.malicious * 3 + vtB.suspicious * 2)
                : -1;

            if (scoreA !== scoreB) {
                return scoreB - scoreA;
            }

            // 3️⃣ Then packet count
            return b[1] - a[1];

        });

    }, [list, vtResults]);


    // ==================================================
    // SUMMARY (UNCHANGED LOGIC)
    // ==================================================

    const summary = Object.values(vtResults).reduce(
        (acc, vt) => {
            if (vt.malicious > 0) acc.malicious += 1;
            else if (vt.suspicious > 0) acc.suspicious += 1;
            else acc.clean += 1;
            return acc;
        },
        { clean: 0, suspicious: 0, malicious: 0 }
    );

    // ==================================================
    // ENRICH
    // ==================================================

    const handleEnrich = async (ip) => {
        setLoadingIP(ip);

        try {
            const response = await fetch(
                `http://localhost:8000/enrich/ip/${ip}`
            );

            const data = await response.json();

            setVtResults(prev => ({
                ...prev,
                [ip]: {
                    ...data,
                    lastChecked: Date.now()
                }
            }));

        } catch (err) {
            console.error("VT Error:", err);
        }

        setLoadingIP(null);
    };

    // ==================================================
    // BADGE RENDER
    // ==================================================

    const renderThreatBadge = (vt) => {
        if (!vt) return null;

        if (vt.malicious > 0) {
            return (
                <span className="threat-badge danger">
                    Malicious ({vt.malicious})
                </span>
            );
        }

        if (vt.suspicious > 0) {
            return (
                <span className="threat-badge warning">
                    Suspicious ({vt.suspicious})
                </span>
            );
        }

        return (
            <span className="threat-badge safe">
                &nbsp;Clean&nbsp;
            </span>
        );
    };

    // ==================================================
    // RENDER (UNCHANGED UI)
    // ==================================================

    return (
        <div className="card ip-card">
            <div className="card-title" style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0, paddingBottom: "14px", borderBottom: "1px solid var(--border-subtle)", marginBottom: "16px" }}>
                <Icon size={16} color={iconColor} style={{ marginTop: "-2px" }} />
                <span style={{ fontSize: "13px", letterSpacing: "1px", lineHeight: 1, textTransform: "uppercase" }}>{title}</span>
            </div>

            <div className="ip-card-body">

                {list.length === 0 ? (
                    <div style={{ color: "#8e8e93" }}>No data available</div>
                ) : (
                    <div className="ip-table-wrapper">
                        <table className="ip-table">
                            <thead>
                                <tr>
                                    <th>IP Address</th>
                                    {showCountry && <th>Country</th>}
                                    <th className="right">Packets</th>
                                    {showCountry && <th className="right">Threat</th>}
                                </tr>
                            </thead>

                            <tbody>
                                {sortedList.map((item, index) => {
                                    const ip = item[0];
                                    const count = item[1];
                                    const geo = geoData[ip];
                                    const vt = vtResults[ip];

                                    return (
                                        <tr key={index}>
                                            <td style={{ fontVariantNumeric: "tabular-nums" }}>
                                                {ip}
                                            </td>

                                            {showCountry && (
                                                <td>
                                                    {geo && geo.country_code ? (
                                                        <div className="country-cell">
                                                            <span className="flag">
                                                                {getFlagEmoji(geo.country_code)}
                                                            </span>
                                                            <span className="country-name">
                                                                {geo.country}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="muted">Unmapped</span>
                                                    )}
                                                </td>
                                            )}

                                            <td className="right">{count}</td>

                                            {showCountry && (
                                                <td className="right">
                                                    {!vt ? (
                                                        <span
                                                            className="enrich-link"
                                                            onClick={() => handleEnrich(ip)}
                                                        >
                                                            {loadingIP === ip ? "Check" : "Enrich"}
                                                        </span>
                                                    ) : (
                                                        renderThreatBadge(vt)
                                                    )}
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {showCountry && list.length > 0 && (
                    <div className="vt-summary">
                        <div className="vt-summary-stats">
                            <span className="vt-clean">Clean: {summary.clean}</span>
                            <span className="vt-warning">Suspicious: {summary.suspicious}</span>
                            <span className="vt-danger">Malicious: {summary.malicious}</span>
                        </div>

                        <div className="vt-summary-note">
                            {Object.keys(vtResults).length === 0
                                ? "No IPs enriched yet."
                                : summary.malicious > 0
                                    ? "Elevated risk detected in external traffic."
                                    : summary.suspicious > 0
                                        ? "Suspicious indicators observed."
                                        : "No malicious indicators detected."
                            }
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
