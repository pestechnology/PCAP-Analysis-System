export default function CaptureMetadata({ metadata }) {
    return (
        <div className="card">
            <div className="card-title">Capture Metadata</div>

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

                {/* Snapshot Length */}
                {/*<div className="metric">*/}
                {/*    <h4>Snapshot Length</h4>*/}
                {/*    <p>*/}
                {/*        {metadata?.snapshot_length !== null &&*/}
                {/*        metadata?.snapshot_length !== undefined*/}
                {/*            ? `${metadata.snapshot_length.toLocaleString()} bytes`*/}
                {/*            : "Not Defined (Full Capture)"}*/}
                {/*    </p>*/}
                {/*</div>*/}

                {/* Start Time */}
                <div className="metric">
                    <h4>Start Time</h4>
                    <p className="timestamp">
                        {metadata?.start_time || "—"}
                    </p>
                </div>

                {/* End Time */}
                <div className="metric">
                    <h4>End Time</h4>
                    <p className="timestamp">
                        {metadata?.end_time || "—"}
                    </p>
                </div>

            </div>
        </div>
    );
}