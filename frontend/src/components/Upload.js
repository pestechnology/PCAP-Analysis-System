import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";
import { 
    startAnalysis, 
    pollProgress, 
    fetchResult, 
    initUpload,
    sendChunk,
    finalizeUpload,
    splitPCAP
} from "../api";
import { AlertCircle, Download, CheckCircle2, Split, X } from "lucide-react";

export default function Upload({ onResult, currentFilename, currentMode }) {
    const { pathname } = useLocation();

    const [file, setFile] = useState(null);
    const [mode, setMode] = useState("—");
    const [analyzing, setAnalyzing] = useState(false);
    const [progressStage, setProgressStage] = useState("");
    const [progressPct, setProgressPct] = useState(0);
    const [showSplitModal, setShowSplitModal] = useState(false);
    const [isSplitting, setIsSplitting] = useState(false);
    const [splitChunks, setSplitChunks] = useState([]);
    const [pendingFile, setPendingFile] = useState(null);
    const [customPrefix, setCustomPrefix] = useState("");
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
        const isValid = allowedExtensions.some(ext => fileName.endsWith(ext));

        if (!isValid) {
            alert("Only PCAP/PCAPNG capture files are allowed.");
            e.target.value = null;
            setFile(null);
            setMode("—");
            return;
        }

        const sizeMB = selected.size / (1024 * 1024);

        if (sizeMB > 650) {
            setPendingFile(selected);
            setShowSplitModal(true);
            setSplitChunks([]);
            e.target.value = null;
            return;
        }

        setFile(selected);
        setMode(sizeMB < 50 ? "Streaming Mode" : "Chunk Optimized Mode");
    };

    const handleAutoSplit = async () => {
        if (!pendingFile) return;
        setIsSplitting(true);
        try {
            const result = await splitPCAP(pendingFile, customPrefix);
            setSplitChunks(result.chunks || []);
        } catch (err) {
            console.error(err);
            alert("Enterprise Split Engine Error: " + (err.message || "Unknown error"));
        } finally {
            setIsSplitting(false);
        }
    };

    const handleChunkDownload = (chunk) => {
        const a = document.createElement("a");
        a.href = `http://localhost:8000/download-split/${chunk.chunk_filename}`;
        a.download = chunk.chunk_filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
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
                
                const chunkSize = 10 * 1024 * 1024;
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
                const { job_id } = await finalizeUpload(upload_id, file.name, false);
                finalJobId = job_id;
            } else {
                setProgressStage("Uploading capture file…");
                const { job_id } = await startAnalysis(file, false);
                finalJobId = job_id;
            }

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

            setProgressPct(99);
            setProgressStage("Loading results…");
            const result = await fetchResult(finalJobId);

            if (!result) throw new Error("Result not ready");

            onResult({
                ...result,
                current_filename: file.name,
                current_mode: mode
            });

        } catch (err) {
            console.error(err);
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

            {showSplitModal && createPortal(
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(5, 10, 20, 0.9)',
                    backdropFilter: 'blur(10px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    padding: '24px'
                }}>
                    <div style={{
                        maxWidth: '550px',
                        width: '100%',
                        background: '#0B111D',
                        border: '1px solid var(--accent-orange, #FF9900)',
                        borderRadius: '20px',
                        padding: '40px',
                        boxShadow: '0 30px 60px rgba(0,0,0,0.8), 0 0 20px rgba(255, 153, 0, 0.1)',
                        position: 'relative'
                    }}>
                        <button 
                            onClick={() => { setShowSplitModal(false); setPendingFile(null); setCustomPrefix(""); }}
                            style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                        >
                            <X size={20} />
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                            <div style={{ background: 'rgba(255, 153, 0, 0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px' }}>
                                <AlertCircle size={32} color="var(--accent-orange)" />
                            </div>
                            <div>
                                <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Payload Limit Exceeded</h2>
                                <p style={{ fontSize: '13px', color: 'var(--accent-orange)', margin: '4px 0 0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Enterprise Safety Gateway</p>
                            </div>
                        </div>

                        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.6, marginBottom: '32px' }}>
                            The file <strong style={{ color: 'var(--text-primary)' }}>{pendingFile?.name}</strong> is <strong>{(pendingFile?.size / (1024 * 1024)).toFixed(1)} MB</strong>, which exceeds the stability threshold (650MB). To ensure packet integrity and deep inspection reliability, please choose an action:
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {splitChunks.length === 0 ? (
                                <>
                                    <div style={{ marginBottom: '12px' }}>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            Custom Chunk Prefix (Optional)
                                        </label>
                                        <input 
                                            type="text" 
                                            placeholder="e.g. Security_Audit"
                                            value={customPrefix}
                                            onChange={(e) => setCustomPrefix(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '14px 16px',
                                                background: 'rgba(255,255,255,0.03)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '10px',
                                                color: 'var(--text-primary)',
                                                fontSize: '14px',
                                                outline: 'none',
                                                transition: 'border-color 0.2s',
                                                boxSizing: 'border-box'
                                            }}
                                            onFocus={e => e.target.style.borderColor = 'var(--accent-orange)'}
                                            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                                        />
                                    </div>

                                    <button 
                                        onClick={handleAutoSplit}
                                        disabled={isSplitting}
                                        style={{
                                            padding: '18px 24px',
                                            background: 'linear-gradient(90deg, #FF9900, #FF6600)',
                                            border: 'none',
                                            borderRadius: '12px',
                                            color: 'white',
                                            fontWeight: 700,
                                            fontSize: '15px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '12px',
                                            transition: 'transform 0.2s',
                                            opacity: isSplitting ? 0.7 : 1
                                        }}
                                        onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                                        onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                                    >
                                        {isSplitting ? (
                                            <>Processing Partitioning...</>
                                        ) : (
                                            <>
                                                <Split size={20} />
                                                Automated Partitioning (Split for me)
                                            </>
                                        )}
                                    </button>

                                    <button 
                                        onClick={() => { setShowSplitModal(false); setPendingFile(null); }}
                                        style={{
                                            padding: '18px 24px',
                                            background: 'rgba(255,255,255,0.03)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '12px',
                                            color: 'var(--text-secondary)',
                                            fontWeight: 600,
                                            fontSize: '15px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                                        onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                                    >
                                        I will split it myself manually
                                    </button>
                                </>
                            ) : (
                                <div style={{ background: 'rgba(0, 255, 102, 0.05)', border: '1px solid rgba(0, 255, 102, 0.2)', borderRadius: '16px', padding: '24px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', color: 'var(--accent-green)' }}>
                                        <CheckCircle2 size={20} />
                                        <span style={{ fontWeight: 700, fontSize: '15px' }}>Partitioning Complete</span>
                                    </div>
                                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                                        Your capture has been split optimally without packet tampering. Download the chunks below and re-upload them separately for analysis.
                                    </p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {splitChunks.map((chunk, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => handleChunkDownload(chunk)}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    padding: '12px 16px',
                                                    background: 'rgba(0,0,0,0.3)',
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    borderRadius: '8px',
                                                    color: 'var(--text-primary)',
                                                    fontSize: '13px',
                                                    fontWeight: 500,
                                                    cursor: 'pointer',
                                                    width: '100%',
                                                    textAlign: 'left'
                                                }}
                                            >
                                                <span>{chunk.chunk_filename}</span>
                                                <Download size={16} color="var(--accent-cyan)" />
                                            </button>
                                        ))}
                                    </div>
                                    <button 
                                        onClick={() => { setShowSplitModal(false); setPendingFile(null); setSplitChunks([]); setCustomPrefix(""); }}
                                        style={{ 
                                            marginTop: '20px', 
                                            width: '100%', 
                                            padding: '12px', 
                                            background: 'var(--accent-blue)', 
                                            border: 'none', 
                                            borderRadius: '8px', 
                                            color: 'white', 
                                            fontWeight: 600, 
                                            cursor: 'pointer' 
                                        }}
                                    >
                                        Acknowledge & Close
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {analyzing && (
                <div className="loader-overlay">
                    <div className="loader-spinner"></div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <p style={{ fontWeight: "600", fontSize: "14px" }}>{progressStage}</p>
                        <p style={{ fontSize: "12px", color: "var(--text-muted)", opacity: 0.8 }}>
                            Processing Status: <span style={{ color: "var(--accent-cyan)", fontWeight: "bold" }}>{progressPct}%</span>
                        </p>
                    </div>
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

            <div className="upload-container" style={{ 
                gap: '16px', 
                minHeight: '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%'
            }}>
                <label className="file-upload">
                    <input
                        type="file"
                        accept=".pcap,.pcapng,.cap,.dump,.pcap.gz,.pcapng.gz"
                        onChange={handleFileChange}
                        disabled={analyzing}
                    />
                    <span className="upload-button" style={{ 
                        opacity: analyzing ? 0.5 : 1,
                        padding: '10px 20px',
                        fontSize: '13px',
                        whiteSpace: 'nowrap'
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
                        color: file ? 'var(--text-primary)' : 'rgba(255,255,255,0.4)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        margin: '0 12px',
                        textAlign: 'center',
                        fontStyle: file ? 'normal' : 'italic'
                    }}
                >
                    {file ? file.name : (currentFilename || "No file selected. Please choose a capture.")}
                </div>

                <button
                    className="analyze-button"
                    onClick={submit}
                    disabled={analyzing}
                    style={{ 
                        padding: '10px 24px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: '600',
                        whiteSpace: 'nowrap'
                    }}
                >
                    {analyzing ? "Analyzing..." : "Analyze"}
                </button>
            </div>

            {!file && !currentFilename && pathname === '/' && (
                <div style={{ marginTop: '4px', textAlign: 'center' }}>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', opacity: 0.8 }}>
                        Not sure how to capture a PCAP?{' '}
                        <a 
                            href="#capture-guide" 
                            style={{ 
                                color: 'var(--accent-cyan)', 
                                textDecoration: 'underline',
                                cursor: 'pointer',
                                fontWeight: 500
                            }}
                        >
                            Click here to view our guide
                        </a>
                    </p>
                </div>
            )}

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
            </div>

        </div>
    );
}
