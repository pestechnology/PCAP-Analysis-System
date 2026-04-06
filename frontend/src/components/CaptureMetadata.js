import React from "react";
import { FileJson } from "lucide-react";

export default function CaptureMetadata({ metadata }) {
    return (
        <div className="card">
            <div className="card-title" style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0, paddingBottom: "14px", borderBottom: "1px solid var(--border-subtle)", marginBottom: "16px" }}>
                <FileJson size={16} color="var(--accent-purple)" style={{ marginTop: "-2px" }} />
                <span style={{ fontSize: "13px", letterSpacing: "1px", lineHeight: 1 }}>CAPTURE METADATA</span>
            </div>

            <div className="grid">

                {/* PCAP Format */}
                <div className="metric">
                    <h4>PCAP Format</h4>
                    <p>{metadata?.pcap_format || "—"}</p>
                </div>

                {/* File Size */}
                <div className="metric">
                    <h4>File Size</h4>
                    <p>
                        {metadata?.file_size_kb
                            ? metadata.file_size_kb.toFixed(2) + " KB"
                            : "0 KB"}
                    </p>
                </div>

                {/* Capture Duration */}
                <div className="metric">
                    <h4>Capture Duration</h4>
                    <p>
                        {metadata?.capture_duration
                            ? metadata.capture_duration.toFixed(2) + " s"
                            : "0 s"}
                    </p>
                </div>

                {/* Start Time */}
                <div className="metric">
                    <h4>Start Time</h4>
                    <p className="timestamp">
                        {metadata?.start_time?.split('.')[0] || "—"}
                    </p>
                </div>

                {/* End Time */}
                <div className="metric">
                    <h4>End Time</h4>
                    <p className="timestamp">
                        {metadata?.end_time?.split('.')[0] || "—"}
                    </p>
                </div>

            </div>
        </div>
    );
}