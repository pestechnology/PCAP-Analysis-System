const BASE_URL = "http://localhost:8000";

export async function analyzePCAP(file) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${BASE_URL}/analyze`, {
        method: "POST",
        body: formData
    });

    if (!response.ok) {
        throw new Error("Backend error");
    }

    return response.json();
}

/**
 * Start an async analysis — returns job_id immediately.
 * Poll pollProgress(job_id) for real-time updates.
 */
export async function startAnalysis(file, advanced = false) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${BASE_URL}/analyze-async?advanced=${advanced}`, {
        method: "POST",
        body: formData
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({ detail: "Upload failed" }));
        throw new Error(err.detail || `HTTP ${response.status}`);
    }

    return response.json(); // { job_id }
}

/**
 * Poll real-time progress for a running job.
 * Returns { status, percent, current_stage, completed_chunks, total_chunks }
 */
export async function pollProgress(jobId) {
    const response = await fetch(`${BASE_URL}/analysis-progress/${jobId}`);
    if (!response.ok) throw new Error("Progress fetch failed");
    return response.json();
}

/**
 * Fetch the final analysis result once status === 'done'.
 * Includes retry logic to handle potential race conditions during disk write.
 */
export async function fetchResult(jobId, retries = 3) {
    try {
        const response = await fetch(`${BASE_URL}/analysis-result/${jobId}`);
        
        // Backend returns 202 if file isn't ready yet
        if (response.status === 202) return null;
        if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
        
        const text = await response.text();
        if (!text || text.trim() === "") {
            if (retries > 0) {
                await new Promise(r => setTimeout(r, 600));
                return fetchResult(jobId, retries - 1);
            }
            return null;
        }
        
        try {
            return JSON.parse(text);
        } catch (e) {
            // "Unexpected end of JSON input" usually happens here if file was partially written
            if (retries > 0) {
                await new Promise(r => setTimeout(r, 1000));
                return fetchResult(jobId, retries - 1);
            }
            throw new Error(`JSON format error: ${e.message}`);
        }
    } catch (err) {
        if (retries > 0) {
            await new Promise(r => setTimeout(r, 1500));
            return fetchResult(jobId, retries - 1);
        }
        throw err;
    }
}

/**
 * Advanced Mode: Fetch list of chunks
 */
export async function fetchChunks(jobId) {
    const response = await fetch(`${BASE_URL}/analysis-chunks/${jobId}`);
    if (!response.ok) return { chunks: [] };
    return response.json();
}

/**
 * Advanced Mode: Download a specific chunk
 */
export function getChunkDownloadUrl(jobId, filename) {
    return `${BASE_URL}/download-chunk/${jobId}/${filename}`;
}

/**
 * Download a CSV or PDF report by POSTing the full analysis data to the backend.
 * This is stateless — no server-side caching needed, works after server restarts.
 * @param {object} data   - The full analysis data object from React state
 * @param {"csv"|"pdf"} format - Export format
 */
export async function downloadReport(data, format = "pdf") {
    const response = await fetch(`${BASE_URL}/api/export-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format, data }),
    });

    if (!response.ok) {
        const detail = await response.json().catch(() => ({ detail: "Unknown error" }));
        throw new Error(detail.detail || `Export failed with status ${response.status}`);
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);

    // Derive filename from Content-Disposition header
    const disposition = response.headers.get("Content-Disposition") || "";
    const match = disposition.match(/filename="?([^";\r\n]+)"?/);
    const fallbackName = `pcap_report.${format}`;
    const filename = match ? match[1] : fallbackName;

    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(objectUrl);
}

/**
 * Enterprise Chunked Upload Helpers
 */
export async function initUpload(filename) {
    const response = await fetch(`${BASE_URL}/upload/init?filename=${encodeURIComponent(filename)}`, {
        method: "POST"
    });
    if (!response.ok) throw new Error("Could not initialize upload session");
    return response.json();
}

export async function sendChunk(uploadId, filename, index, blob) {
    const formData = new FormData();
    formData.append("file", blob);
    const response = await fetch(`${BASE_URL}/upload/chunk?upload_id=${uploadId}&filename=${encodeURIComponent(filename)}&chunk_index=${index}`, {
        method: "POST",
        body: formData
    });
    if (!response.ok) throw new Error(`Upload failed at chunk ${index}`);
    return response.json();
}

export async function finalizeUpload(uploadId, filename, advanced = false) {
    const response = await fetch(`${BASE_URL}/upload/complete?upload_id=${uploadId}&filename=${encodeURIComponent(filename)}&advanced=${advanced}`, {
        method: "POST"
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({ detail: "Finalization failed" }));
        throw new Error(err.detail || "Could not complete upload");
    }
    return response.json(); // { job_id }
}
