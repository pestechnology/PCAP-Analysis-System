import React, { useState, useRef } from "react";
import { 
    startAnalysis, 
    pollProgress, 
    fetchResult, 
    fetchChunks, 
    getChunkDownloadUrl,
    initUpload,
    sendChunk,
    finalizeUpload
} from "../api";

export default function Upload({ onResult, currentFilename, currentMode }) {

    const [file, setFile] = useState(null);
    const [mode, setMode] = useState("—");
    const [analyzing, setAnalyzing] = useState(false);
    const [isAdvanced, setIsAdvanced] = useState(false);
    const [chunkList, setChunkList] = useState([]);
    const [progressStage, setProgressStage] = useState("");
    const [jobId, setJobId] = useState("");
    const [progressPct, setProgressPct] = useState(0);
    const pollRef = useRef(null);

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
        if (!file) {
            alert("No file selected. Please upload a .pcap, .pcapng, or .cap file before analyzing.");
            return;
        }

        const sizeMB = file.size / (1024 * 1024);
        const isLarge = sizeMB > 100;

        if (isLarge) {
            const confirmed = window.confirm(`Enterprise Notice: You are uploading a large file (${sizeMB.toFixed(1)} MB). This will be handled via Internal Chunked Transfer to ensure reliability. Do you wish to proceed?`);
            if (!confirmed) return;
        }

        try {
            setAnalyzing(true);
            setProgressPct(1);
            
            let finalJobId = "";

            if (isLarge) {
                setProgressStage("Initializing secure chunk transfer...");
                const { upload_id } = await initUpload(file.name);
                
                const chunkSize = 10 * 1024 * 1024; // 10MB chunks
                const totalChunks = Math.ceil(file.size / chunkSize);
                
                for (let i = 0; i < totalChunks; i++) {
                    const start = i * chunkSize;
                    const end = Math.min(file.size, start + chunkSize);
                    const chunk = file.slice(start, end);
                    
                    setProgressStage(`Uploading chunk ${i + 1} of ${totalChunks}...`);
                    await sendChunk(upload_id, file.name, i, chunk);
                    setProgressPct(Math.round(((i + 1) / totalChunks) * 100));
                }
                
                setProgressStage("Finalizing transfer and starting analysis...");
                const { job_id } = await finalizeUpload(upload_id, file.name, isAdvanced);
                finalJobId = job_id;
            } else {
                setProgressStage("Uploading capture file…");
                const { job_id } = await startAnalysis(file, isAdvanced);
                finalJobId = job_id;
            }

            setJobId(finalJobId);
            setChunkList([]);

            // Phase 2: poll until done
            await new Promise((resolve, reject) => {
                pollRef.current = setInterval(async () => {
                    try {
                        const prog = await pollProgress(finalJobId);

                        setProgressPct(prog.percent ?? 0);
                        setProgressStage(prog.current_stage ?? "Analyzing…");

                        if (prog.status === "done") {
                            clearInterval(pollRef.current);
                            resolve();
                        } else if (prog.status === "error") {
                            clearInterval(pollRef.current);
                            reject(new Error(prog.current_stage || "Analysis failed"));
                        }
                    } catch (e) {
                        clearInterval(pollRef.current);
                        reject(e);
                    }
                }, 1000);
            });

            // Phase 3: fetch result
            setProgressPct(99);
            setProgressStage("Loading results…");
            const result = await fetchResult(finalJobId);

            if (!result) throw new Error("Result not ready");

            if (isAdvanced) {
                try {
                    const { chunks } = await fetchChunks(finalJobId);
                    setChunkList(chunks || []);
                } catch (e) {
                    console.warn("Could not fetch chunks:", e);
                }
            }

            onResult({
                ...result,
                current_filename: file.name,
                current_mode: mode
            });

        } catch (err) {
            console.error("Analysis failed:", err);
            alert(`Analysis failed: ${err.message || "Backend not reachable."}`);
        } finally {
            setAnalyzing(false);
            setProgressPct(0);
            setProgressStage("");
            if (pollRef.current) clearInterval(pollRef.current);
        }
    };

    return (
        <div className="upload-wrapper" style={{ position: "relative" }}>

            {analyzing && (
                <div className="loader-overlay">
                    <div className="loader-spinner"></div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <p style={{ fontWeight: "600", fontSize: "14px" }}>{progressStage}</p>
                        <p style={{ fontSize: "12px", color: "var(--text-muted)", opacity: 0.8 }}>
                            Processing Status: <span style={{ color: "var(--accent-cyan)", fontWeight: "bold" }}>{progressPct}%</span>
                        </p>
                    </div>

                    {/* Real-time progress bar */}
                    <div style={{
                        width: "300px",
                        height: "6px",
                        background: "rgba(255,255,255,0.05)",
                        borderRadius: "10px",
                        overflow: "hidden",
                        border: "1px solid rgba(0, 240, 255, 0.1)"
                    }}>
                        <div style={{
                            width: `${progressPct}%`,
                            height: "100%",
                            background: "linear-gradient(90deg, var(--accent-blue), var(--accent-cyan))",
                            boxShadow: "0 0 10px rgba(0, 240, 255, 0.5)",
                            transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
                        }}></div>
                    </div>
                </div>
            )}

            <div className="upload-container" style={{ gap: '24px', minHeight: '60px' }}>

                <label className="file-upload">
                    <input
                        type="file"
                        accept=".pcap,.pcapng,.cap,.dump,.pcap.gz,.pcapng.gz"
                        onChange={handleFileChange}
                        disabled={analyzing}
                    />
                    <span className="upload-button" style={{ 
                        opacity: analyzing ? 0.5 : 1,
                        padding: '12px 24px',
                        fontSize: '14px'
                    }}>
                        Upload PCAP
                    </span>
                </label>

                <div
                    className="file-name"
                    title={file ? file.name : (currentFilename || "")}
                    style={{ 
                        flex: 1, 
                        fontSize: '13px', 
                        color: file ? 'var(--text-primary)' : 'var(--text-muted)',
                        maxWidth: '300px'
                    }}
                >
                    {file ? file.name : (currentFilename || "Select a capture file...")}
                </div>

                <button
                    className="analyze-button"
                    onClick={submit}
                    disabled={analyzing}
                    style={{ 
                        padding: '12px 32px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600'
                    }}
                >
                    {analyzing ? "Analyzing..." : "Analyze"}
                </button>

            </div>

            <div className="analysis-mode" style={{ marginTop: '20px', padding: '0 4px' }}>
                <span className="mode-label" style={{ fontSize: '12px', opacity: 0.7 }}>Recommended Engine:</span>

                <span
                    className={`mode-pill ${
                        (file ? mode : currentMode) === "Streaming Mode"
                            ? "streaming"
                            : (file ? mode : currentMode) === "Chunk Optimized Mode"
                                ? "chunk"
                                : "neutral"
                    }`}
                >
                    {file ? mode : (currentMode || "—")}
                </span>

                <label style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "6px", 
                    fontSize: "11px", 
                    color: "var(--text-muted, #8e8e93)",
                    cursor: "pointer",
                    marginLeft: "auto"
                }}>
                    <input 
                        type="checkbox" 
                        checked={isAdvanced}
                        onChange={(e) => setIsAdvanced(e.target.checked)}
                        style={{ accentColor: "var(--accent-blue)" }}
                    />
                    Advanced Mode (Split Chunks)
                </label>
            </div>

            {chunkList.length > 0 && (
                <div style={{ 
                    marginTop: "16px", 
                    padding: "12px", 
                    background: "rgba(255,255,255,0.03)", 
                    borderRadius: "8px",
                    border: "1px solid var(--border-subtle)"
                }}>
                    <p style={{ fontSize: "12px", marginBottom: "8px", color: "var(--text-primary)" }}>
                        Generated PCAP Chunks (Advanced Mode):
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                        {chunkList.map((c, i) => (
                            <a 
                                key={i} 
                                href={getChunkDownloadUrl(jobId, c)} 
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                    fontSize: "11px",
                                    padding: "4px 8px",
                                    background: "var(--bg-panel)",
                                    border: "1px solid var(--border-subtle)",
                                    borderRadius: "4px",
                                    color: "var(--accent-blue)",
                                    textDecoration: "none"
                                }}
                            >
                                Chunk {i + 1}
                            </a>
                        ))}
                    </div>
                </div>
            )}

        </div>
    );
}
