import React from "react";

export default function UrlsCard({ urls = [] }) {
    return (
        <div className="card mac-card">
            <div className="card-title">Extracted URLs</div>

            {urls.length === 0 ? (
                <div className="muted">No HTTP URLs extracted</div>
            ) : (
                <div
                    className="mac-scroll"
                    style={{
                        maxHeight: "300px",
                        overflowY: "auto",
                        paddingRight: "6px",
                        marginTop: "10px"
                    }}
                >
                    <ul
                        className="simple-list"
                        style={{
                            listStyle: "none",
                            padding: 0,
                            margin: 0
                        }}
                    >
                        {urls.map((url, index) => (
                            <li
                                key={index}
                                className="scroll-item"
                                style={{
                                    wordBreak: "break-all",
                                    color: "var(--text-secondary)",
                                    fontFamily: "var(--font-mono)"
                                }}
                            >
                                {url}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}