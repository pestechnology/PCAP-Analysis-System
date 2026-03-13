import React, { useState, useEffect } from "react";
import { analyzePCAP } from "../api";

export default function Upload({ onResult }) {

    const [file, setFile] = useState(null);
    const [mode, setMode] = useState("—");
    const [analyzing, setAnalyzing] = useState(false);
    const [progressStep, setProgressStep] = useState(0);

    const allowedExtensions = [
        ".pcap",
        ".pcapng",
        ".cap",
        ".dump",
        ".pcap.gz",
        ".pcapng.gz"
    ];

    const stages = [
        "Uploading capture...",
        "Parsing packets...",
        "Running IDS detection...",
        "Extracting artifacts...",
        "Enriching threat intelligence...",
        "Generating SOC report..."
    ];

    useEffect(() => {
        if (!analyzing) {
            setProgressStep(0);
            return;
        }

        // Simulate progress through stages
        const interval = setInterval(() => {
            setProgressStep(prev => prev < stages.length - 1 ? prev + 1 : prev);
        }, 800);
        return () => clearInterval(interval);
    }, [analyzing]);

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
            
            // Allow the last stage to show very briefly if analysis was fast
            setTimeout(() => {
                onResult(result);
                setAnalyzing(false);
            }, 800);

        } catch (err) {
            console.error("Upload failed:", err);
            alert("Backend not reachable or analysis failed.");
            setAnalyzing(false);
        }
    };

    return (
        <div className="upload-wrapper" style={{ position: "relative" }}>

            {analyzing && (
                <div className="loader-overlay">
                    <div className="loader-spinner"></div>
                    <p>{stages[progressStep]}</p>
                </div>
            )}

            <div className="upload-container">

                <label className="file-upload">
                    <input
                        type="file"
                        accept=".pcap,.pcapng,.cap,.dump,.pcap.gz,.pcapng.gz"
                        onChange={handleFileChange}
                        disabled={analyzing}
                    />
                    <span className="upload-button" style={{ opacity: analyzing ? 0.5 : 1 }}>
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
                    disabled={analyzing || !file}
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
