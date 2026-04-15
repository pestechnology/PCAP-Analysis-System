/*
 * © Copyright 2026 PES University.
 *
 * Authors:
 *   Mohit Pal - mp65742@gmail.com
 *   Dr. Swetha P - swethap@pes.edu
 *   Dr. Prasad B Honnavalli - prasadhb@pes.edu
 *
 * Contributors:
 *   PurpleSynapz - info@purplesynapz.com
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
import { FileText, FileSpreadsheet, CheckCircle2, AlertTriangle } from 'lucide-react';
import { downloadReport } from '../api';

/* =========================================================
   Toast notification — auto-dismiss, portal-style
   ========================================================= */
function Toast({ message, type, onClose }) {
    const isSuccess = type === 'success';
    const bg = isSuccess ? 'rgba(0, 229, 160, 0.12)' : 'rgba(255, 77, 77, 0.12)';
    const border = isSuccess ? 'rgba(0, 229, 160, 0.35)' : 'rgba(255, 77, 77, 0.35)';
    const color = isSuccess ? '#00E5A0' : '#FF4D4D';
    const Icon = isSuccess ? CheckCircle2 : AlertTriangle;

    return (
        <div style={{
            position: 'fixed',
            bottom: '32px',
            right: '32px',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            background: bg,
            border: `1px solid ${border}`,
            backdropFilter: 'blur(16px)',
            borderRadius: '10px',
            padding: '14px 18px',
            maxWidth: '360px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            animation: 'slideInToast 0.25s ease-out',
        }}>
            <Icon size={18} color={color} style={{ flexShrink: 0, marginTop: '1px' }} />
            <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color, marginBottom: '2px' }}>
                    {isSuccess ? 'Download Ready' : 'Export Failed'}
                </div>
                <div style={{ fontSize: '12px', color: '#9ca3af', lineHeight: 1.5 }}>
                    {message}
                </div>
            </div>
            <button
                onClick={onClose}
                style={{
                    marginLeft: 'auto',
                    background: 'none',
                    border: 'none',
                    color: '#6b7280',
                    cursor: 'pointer',
                    fontSize: '16px',
                    lineHeight: 1,
                    padding: '0 0 0 8px',
                    flexShrink: 0,
                }}
            >
                ×
            </button>
        </div>
    );
}

/* =========================================================
   Main DownloadReportButton component
   ========================================================= */
export default function DownloadReportButton({ data }) {
    const [loadingCsv, setLoadingCsv] = useState(false);
    const [loadingPdf, setLoadingPdf] = useState(false);
    const [toast, setToast] = useState(null);   // { message, type }

    // Enabled only when we have real analysis data
    const hasData = Boolean(data && data.total_packets > 0);

    const showToast = useCallback((message, type) => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    }, []);

    const handleDownload = useCallback(async (format) => {
        if (!hasData) return;

        const setLoading = format === 'csv' ? setLoadingCsv : setLoadingPdf;
        setLoading(true);

        try {
            await downloadReport(data, format);
            showToast(`Report downloaded successfully as ${format.toUpperCase()}.`, 'success');
        } catch (err) {
            showToast(err.message || 'Export failed — please retry.', 'error');
        } finally {
            setLoading(false);
        }
    }, [data, hasData, showToast]);

    const disabledTitle = 'No analysis data available. Upload and analyze a PCAP file first.';
    const enabledTitle = 'Download SOC-ready report';

    const btnBase = {
        display: 'flex',
        alignItems: 'center',
        gap: '7px',
        padding: '7px 13px',
        borderRadius: '7px',
        fontSize: '12px',
        fontWeight: 600,
        letterSpacing: '0.4px',
        cursor: hasData ? 'pointer' : 'not-allowed',
        border: '1px solid',
        transition: 'all 0.2s ease',
        opacity: hasData ? 1 : 0.42,
        userSelect: 'none',
        whiteSpace: 'nowrap',
    };

    const csvStyle = {
        ...btnBase,
        background: hasData ? 'rgba(0, 229, 160, 0.08)' : 'rgba(0,0,0,0.2)',
        borderColor: hasData ? 'rgba(0, 229, 160, 0.4)' : 'rgba(255,255,255,0.08)',
        color: hasData ? '#00E5A0' : '#555',
    };

    const pdfStyle = {
        ...btnBase,
        background: hasData ? 'rgba(0, 240, 255, 0.08)' : 'rgba(0,0,0,0.2)',
        borderColor: hasData ? 'rgba(0, 240, 255, 0.4)' : 'rgba(255,255,255,0.08)',
        color: hasData ? '#00F0FF' : '#555',
    };

    return (
        <>
            <div
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                title={hasData ? enabledTitle : disabledTitle}
            >
                {/* CSV Button */}
                <button
                    id="download-csv-btn"
                    style={csvStyle}
                    disabled={!hasData || loadingCsv}
                    onClick={() => handleDownload('csv')}
                    onMouseEnter={e => {
                        if (hasData) {
                            e.currentTarget.style.background = 'rgba(0, 229, 160, 0.16)';
                            e.currentTarget.style.boxShadow = '0 0 12px rgba(0, 229, 160, 0.2)';
                        }
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.background = hasData ? 'rgba(0, 229, 160, 0.08)' : 'rgba(0,0,0,0.2)';
                        e.currentTarget.style.boxShadow = 'none';
                    }}
                    title={hasData ? 'Download as CSV' : disabledTitle}
                >
                    {loadingCsv
                        ? <span style={{
                            display: 'inline-block',
                            width: '13px',
                            height: '13px',
                            minWidth: '13px',
                            minHeight: '13px',
                            flexShrink: 0,
                            border: '2px solid rgba(0,229,160,0.25)',
                            borderTopColor: '#00E5A0',
                            borderRadius: '50%',
                            animation: 'spin 0.7s linear infinite',
                        }} />
                        : <FileSpreadsheet size={13} />
                    }
                    {loadingCsv ? 'Generating…' : 'CSV'}
                </button>

                {/* PDF Button */}
                <button
                    id="download-pdf-btn"
                    style={pdfStyle}
                    disabled={!hasData || loadingPdf}
                    onClick={() => handleDownload('pdf')}
                    onMouseEnter={e => {
                        if (hasData) {
                            e.currentTarget.style.background = 'rgba(0, 240, 255, 0.16)';
                            e.currentTarget.style.boxShadow = '0 0 12px rgba(0, 240, 255, 0.2)';
                        }
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.background = hasData ? 'rgba(0, 240, 255, 0.08)' : 'rgba(0,0,0,0.2)';
                        e.currentTarget.style.boxShadow = 'none';
                    }}
                    title={hasData ? 'Download SOC-ready PDF report' : disabledTitle}
                >
                    {loadingPdf
                        ? <span style={{
                            display: 'inline-block',
                            width: '13px',
                            height: '13px',
                            minWidth: '13px',
                            minHeight: '13px',
                            flexShrink: 0,
                            border: '2px solid rgba(0,240,255,0.25)',
                            borderTopColor: '#00F0FF',
                            borderRadius: '50%',
                            animation: 'spin 0.7s linear infinite',
                        }} />
                        : <FileText size={13} />
                    }
                    {loadingPdf ? 'Generating…' : 'PDF'}
                </button>
            </div>

            {/* Toast */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            {/* Keyframe animations */}
            <style>{`
                @keyframes slideInToast {
                    from { opacity: 0; transform: translateY(12px); }
                    to   { opacity: 1; transform: translateY(0);    }
                }
                @keyframes spin {
                    from { transform: rotate(0deg);   }
                    to   { transform: rotate(360deg); }
                }
            `}</style>
        </>
    );
}
