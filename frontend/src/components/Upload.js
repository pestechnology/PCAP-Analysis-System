import React, { useState } from "react";
import { analyzePCAP } from "../api";

export default function Upload({ onResult }) {

    const [file, setFile] = useState(null);
    const [mode, setMode] = useState("—");
    const [analyzing, setAnalyzing] = useState(false);

    const allowedExtensions = [
        ".pcap",
        ".pcapng",
        ".cap",
        ".dump",
        ".pcap.gz",
        ".pcapng.gz"
    ];

    const handleFileChange = (e) => {
        const selected = e.target.files[0];

        if (!selected) {
            setFile(null);
            setMode("—");
            return;
        }

        const fileName = selected.name.toLowerCase();

        const isValid = allowedExtensions.some(ext =>
            fileName.endsWith(ext)
        );

        if (!isValid) {
            alert("Only PCAP/PCAPNG capture files are allowed.");
            e.target.value = null;
            setFile(null);
            setMode("—");
            return;
        }

        setFile(selected);

        const sizeMB = selected.size / (1024 * 1024);

        if (sizeMB < 50) {
            setMode("Streaming Mode");
        } else {
            setMode("Chunk Optimized Mode");
        }
    };

    const submit = async () => {
        if (!file) return alert("Select a PCAP file");

        try {
            setAnalyzing(true);

            const result = await analyzePCAP(file);
            onResult(result);

        } catch (err) {
            console.error("Upload failed:", err);
            alert("Backend not reachable or analysis failed.");
        } finally {
            setAnalyzing(false);
        }
    };

    return (
        <div className="upload-wrapper">

            <div className="upload-container">

                <label className="file-upload">
                    <input
                        type="file"
                        accept=".pcap,.pcapng,.cap,.dump,.pcap.gz,.pcapng.gz"
                        onChange={handleFileChange}
                    />
                    <span className="upload-button">
                    Upload PCAP
                </span>
                </label>

                <div
                    className="file-name"
                    title={file ? file.name : ""}
                >
                    {file ? file.name : "No file selected"}
                </div>

                <button
                    className="analyze-button"
                    onClick={submit}
                    disabled={analyzing}
                >
                    {analyzing ? "Analyzing..." : "Analyze"}
                </button>

            </div>

            <div className="analysis-mode">
                <span className="mode-label">Suggested Mode:</span>

                <span
                    className={`mode-pill ${
                        mode === "Streaming Mode"
                            ? "streaming"
                            : mode === "Chunk Optimized Mode"
                                ? "chunk"
                                : "neutral"
                    }`}
                >
        {mode}
    </span>
            </div>


        </div>
    );

}
