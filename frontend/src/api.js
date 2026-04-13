/*
 * © Copyright 2026 PES University.
 *
 * Authors:
 *   Mohit Pal - mp65742@gmail.com
 *   Swetha P - swethap@pes.edu
 *
 * Contributors:
 *   PurpleSynapz
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * SPDX-License-Identifier: Apache-2.0
 */
export async function analyzePCAP(file) {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/analyze", {
        method: "POST",
        body: formData
    });
    if (!response.ok) throw new Error("Backend error");
    return response.json();
}

export async function startAnalysis(file, advanced = false) {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(`/analyze-async?advanced=${advanced}`, {
        method: "POST",
        body: formData
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({ detail: "Upload failed" }));
        throw new Error(err.detail || `HTTP ${response.status}`);
    }
    return response.json();
}

export async function pollProgress(jobId) {
    const response = await fetch(`/analysis-progress/${jobId}`);
    if (!response.ok) throw new Error("Progress fetch failed");
    return response.json();
}

export async function fetchResult(jobId, retries = 3) {
    try {
        const response = await fetch(`/analysis-result/${jobId}`);
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

export async function fetchChunks(jobId) {
    const response = await fetch(`/analysis-chunks/${jobId}`);
    if (!response.ok) return { chunks: [] };
    return response.json();
}

export function getChunkDownloadUrl(jobId, filename) {
    return `/download-chunk/${jobId}/${filename}`;
}

export async function downloadReport(data, format = "pdf") {
    const response = await fetch("/api/export-report", {
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
    const disposition = response.headers.get("Content-Disposition") || "";
    const match = disposition.match(/filename="?([^";\r\n]+)"?/);
    const filename = match ? match[1] : `pcap_report.${format}`;
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(objectUrl);
}

export async function initUpload(filename) {
    const response = await fetch(`/upload/init?filename=${encodeURIComponent(filename)}`, {
        method: "POST"
    });
    if (!response.ok) throw new Error("Could not initialize upload session");
    return response.json();
}

export async function sendChunk(uploadId, filename, index, blob) {
    const formData = new FormData();
    formData.append("file", blob);
    const response = await fetch(`/upload/chunk?upload_id=${uploadId}&filename=${encodeURIComponent(filename)}&chunk_index=${index}`, {
        method: "POST",
        body: formData
    });
    if (!response.ok) throw new Error(`Upload failed at chunk ${index}`);
    return response.json();
}

export async function finalizeUpload(uploadId, filename, advanced = false) {
    const response = await fetch(`/upload/complete?upload_id=${uploadId}&filename=${encodeURIComponent(filename)}&advanced=${advanced}`, {
        method: "POST"
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({ detail: "Finalization failed" }));
        throw new Error(err.detail || "Could not complete upload");
    }
    return response.json();
}

export async function splitPCAP(file, prefix = "") {
    const formData = new FormData();
    formData.append("file", file);
    const url = prefix ? `/split-pcap?prefix=${encodeURIComponent(prefix)}` : "/split-pcap";
    const response = await fetch(url, {
        method: "POST",
        body: formData
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({ detail: "Splitting failed" }));
        throw new Error(err.detail || `Split server error: ${response.status}`);
    }
    return response.json();
}

export function getSplitDownloadUrl(filename) {
    return `/download-split/${filename}`;
}
