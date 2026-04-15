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

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Activity, ChevronRight, Lock, Layers, CheckCircle2, X } from 'lucide-react';
import Upload from '../components/Upload';
import '../index.css';

export default function Home({ setData }) {
    const navigate = useNavigate();
    const [activeModal, setActiveModal] = useState(null);

    const pillars = [
        {
            id: 0,
            icon: <Activity size={32} color="var(--accent-cyan)" />,
            accent: 'var(--accent-cyan)',
            accentHex: '#00f0ff',
            title: 'Network Intelligence',
            summary: 'Complete situational awareness across every layer of your network — from physical infrastructure to application-layer flows.',
            items: [
                { label: 'Full-Spectrum Traffic Visibility', detail: 'End-to-end inspection of all network communications across every standard and non-standard protocol.' },
                { label: 'Geospatial Threat Mapping', detail: 'Attribution of network activity to physical locations, enabling rapid identification of foreign or anomalous origin points.' },
                { label: 'Infrastructure Fingerprinting', detail: 'Identification of hardware vendors, device roles, and network topology from observed traffic patterns.' },
                { label: 'Encrypted Channel Profiling', detail: 'Assessment of encryption posture, certificate validity, and cipher compliance without decryption.' },
            ]
        },
        {
            id: 1,
            icon: <ShieldAlert size={32} color="var(--accent-red)" />,
            accent: 'var(--accent-red)',
            accentHex: '#ff4d4d',
            title: 'Threat & Risk Detection',
            summary: 'Proactive identification of adversarial activity, policy violations, and indicators of compromise across ingested capture data.',
            items: [
                { label: 'Signature-Based Threat Correlation', detail: 'Continuous matching of observed traffic against a curated library of known threat campaigns, malware families, and attack frameworks.' },
                { label: 'Adversarial Infrastructure Attribution', detail: 'Real-time reputation scoring of observed endpoints against global threat intelligence feeds.' },
                { label: 'Credential Exposure Assessment', detail: 'Detection of unprotected authentication events traversing the network in violation of security policy.' },
                { label: 'Web-Layer Threat Hunting', detail: 'Reconstruction and analysis of application-layer sessions to surface command execution, data staging, and exfiltration activity.' },
            ]
        },
        {
            id: 2,
            icon: <Layers size={32} color="var(--accent-purple)" />,
            accent: 'var(--accent-purple)',
            accentHex: '#a855f7',
            title: 'Resilience & Compliance',
            summary: 'Operational controls that ensure data fidelity, audit-readiness, and continuity of analysis at any scale.',
            items: [
                { label: 'Artifact Preservation & Chain of Custody', detail: 'Secure recovery of files and evidentiary objects present in network traffic, with integrity guarantees for forensic admissibility.' },
                { label: 'Large-Scale Capture Management', detail: 'Intelligent handling of high-volume capture data, ensuring no evidence is lost or degraded regardless of file size.' },
                { label: 'Multi-Protocol Session Reconstruction', detail: 'Coherent reassembly of fragmented or multi-path communications, including legacy and modern transport protocols.' },
                { label: 'Structured Reporting & Export', detail: 'Production of audit-ready reports in standard formats, suitable for submission to compliance, legal, or executive stakeholders.' },
            ]
        },
    ];

    const activePillar = pillars.find(p => p.id === activeModal);

    return (
        <div className="app-wrapper" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-primary)' }}>

            <div style={{
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' opacity=\'0.05\'/%3E%3C/svg%3E")',
                pointerEvents: 'none',
                zIndex: 0
            }}></div>

            <nav style={{ padding: '24px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', position: 'relative', zIndex: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img src="/logo.png" alt="PCAP Analysis Logo" style={{ height: '32px', objectFit: 'contain' }} />
                    <span style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '1px', color: 'var(--text-primary)' }}>
                        PCAP Analysis System
                    </span>
                </div>
            </nav>

            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 10, paddingBottom: '100px' }}>

                <section style={{ maxWidth: '1400px', width: '100%', padding: '0 48px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>

                    <div style={{ display: 'flex', justifyContent: 'center', position: 'relative', width: '100%', marginTop: '30px' }}>
                        <img
                            src="/pcap_dashboard_ui.png"
                            alt="PCAP Traffic Analysis Interface"
                            style={{
                                width: '100%',
                                maxWidth: '800px',
                                maxHeight: '35vh',
                                objectFit: 'contain',
                                borderRadius: '12px',
                                border: '1px solid rgba(0, 240, 255, 0.2)',
                                boxShadow: '0 20px 40px rgba(0,0,0,0.6), 0 0 20px rgba(0, 240, 255, 0.05)',
                                animation: 'float 8s ease-in-out infinite'
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textAlign: 'center', marginTop: '10px' }}>

                        <h1 style={{ fontSize: '42px', fontWeight: 800, lineHeight: 1.1, color: 'var(--text-primary)' }}>
                            PCAP Analysis System
                        </h1>

                        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.5, maxWidth: '750px', fontWeight: 400 }}>
                            Upload raw packet capture files for deep packet inspection. Our platform processes network traffic, extracts geographic routing endpoints, evaluates IDS rules, and provides comprehensive protocol diagnostics.
                        </p>

                        <div id="upload-zone" style={{ marginTop: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px 20px', width: '100%', maxWidth: '500px', backdropFilter: 'blur(10px)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', textAlign: 'left' }}>
                            <div style={{ marginBottom: '12px', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Lock size={16} color="var(--accent-cyan)" /> SECURE UPLOAD GATEWAY
                            </div>
                            <Upload
                                onResult={(result) => {
                                    setData(prev => ({
                                        ...prev,
                                        ...result,
                                        host_system: prev.host_system
                                    }));
                                    navigate('/dashboard');
                                }}
                            />
                        </div>

                    </div>
                </section>

                <section id="about" style={{ width: '100%', background: 'rgba(255,255,255,0.01)', borderTop: '1px solid rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.03)', padding: '100px 48px' }}>
                    <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', gap: '80px', alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                            <h2 style={{ fontSize: '36px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '24px' }}>
                                How the System Works
                            </h2>
                            <p style={{ fontSize: '16px', color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '20px', textAlign: 'justify' }}>
                                Inspecting massive packet captures manually through traditional network analyzers can be overwhelming and time-consuming. Finding specific anomalous behavior vectors requires filtering millions of unrelated packets.
                            </p>
                            <p style={{ fontSize: '16px', color: 'var(--text-secondary)', lineHeight: 1.8, textAlign: 'justify' }}>
                                The PCAP Analysis System streamlines this workflow by automatically parsing network layers, aggregating metadata, and organizing connections into actionable tables. It enables security analysts to swiftly identify unauthorized protocols, misconfigured data streams, and malicious payloads directly from the browser.
                            </p>

                            <div style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {['Comprehensive Packet Filtering', 'Domain and Payload Extraction', 'Structured Geographical Mapping'].map((text, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '15px', color: 'var(--text-primary)', fontWeight: 500 }}>
                                        <CheckCircle2 size={20} color="var(--accent-cyan)" /> {text}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div style={{ flex: 1, position: 'relative', height: '400px', background: 'rgba(0,0,0,0.2)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ position: 'relative', zIndex: 1, background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', padding: '30px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px', width: '70%' }}>
                                <h4 style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '16px', marginBottom: '8px' }}>Data Parsing Sequence</h4>
                                <div style={{ height: '8px', width: '40%', background: 'var(--accent-cyan)', borderRadius: '4px' }}></div>
                                <div style={{ height: '8px', width: '80%', background: 'rgba(255, 255, 255, 0.2)', borderRadius: '4px' }}></div>
                                <div style={{ height: '8px', width: '60%', background: 'rgba(255, 255, 255, 0.2)', borderRadius: '4px' }}></div>
                                <div style={{ height: '8px', width: '90%', background: 'rgba(255, 255, 255, 0.2)', borderRadius: '4px' }}></div>
                                <div style={{ height: '8px', width: '30%', background: 'rgba(255, 255, 255, 0.2)', borderRadius: '4px' }}></div>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="capabilities" style={{ maxWidth: '1400px', width: '100%', padding: '100px 48px' }}>
                    <div style={{ textAlign: 'center', marginBottom: '64px' }}>
                        <h2 style={{ fontSize: '36px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>System Capabilities</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '16px', marginTop: '16px', maxWidth: '560px', margin: '16px auto 0', lineHeight: 1.7 }}>A unified analysis platform built for security operations, compliance, and incident response teams.</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '28px', alignItems: 'stretch' }}>
                        {pillars.map((pillar) => (
                            <div
                                key={pillar.id}
                                style={{
                                    padding: '36px',
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(255,255,255,0.07)',
                                    borderRadius: '20px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '20px',
                                    transition: 'border-color 0.25s, box-shadow 0.25s',
                                    cursor: 'default'
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.borderColor = pillar.accentHex + '55';
                                    e.currentTarget.style.boxShadow = `0 0 32px ${pillar.accentHex}12`;
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{
                                        width: '56px', height: '56px', borderRadius: '14px',
                                        background: `${pillar.accentHex}18`,
                                        border: `1px solid ${pillar.accentHex}35`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        flexShrink: 0
                                    }}>
                                        {pillar.icon}
                                    </div>
                                    <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, lineHeight: 1.2 }}>{pillar.title}</h3>
                                </div>

                                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.75, margin: 0, flex: 1 }}>
                                    {pillar.summary}
                                </p>

                                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '20px' }}>
                                    <button
                                        onClick={() => setActiveModal(pillar.id)}
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            padding: '8px 16px',
                                            background: `${pillar.accentHex}18`,
                                            border: `1px solid ${pillar.accentHex}40`,
                                            borderRadius: '8px',
                                            color: pillar.accent,
                                            fontSize: '13px',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            letterSpacing: '0.2px',
                                            transition: 'background 0.2s, border-color 0.2s'
                                        }}
                                        onMouseEnter={e => {
                                            e.currentTarget.style.background = `${pillar.accentHex}28`;
                                            e.currentTarget.style.borderColor = `${pillar.accentHex}70`;
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.background = `${pillar.accentHex}18`;
                                            e.currentTarget.style.borderColor = `${pillar.accentHex}40`;
                                        }}
                                    >
                                        View Details <ChevronRight size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {activeModal !== null && activePillar && createPortal(
                    <div
                        onClick={() => setActiveModal(null)}
                        style={{
                            position: 'fixed', inset: 0,
                            background: 'rgba(3, 7, 18, 0.85)',
                            backdropFilter: 'blur(12px)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            zIndex: 9999, padding: '24px'
                        }}
                    >
                        <div
                            onClick={e => e.stopPropagation()}
                            style={{
                                width: '100%', maxWidth: '560px',
                                background: '#0d1220',
                                border: `1px solid ${activePillar.accentHex}40`,
                                borderRadius: '24px',
                                padding: '48px',
                                boxShadow: `0 40px 80px rgba(0,0,0,0.8), 0 0 40px ${activePillar.accentHex}14`,
                                position: 'relative'
                            }}
                        >
                            <button
                                onClick={() => setActiveModal(null)}
                                style={{
                                    position: 'absolute', top: '20px', right: '20px',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    borderRadius: '8px',
                                    color: 'var(--text-muted)',
                                    cursor: 'pointer',
                                    padding: '6px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'background 0.2s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                            >
                                <X size={16} />
                            </button>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                                <div style={{
                                    width: '52px', height: '52px', borderRadius: '13px',
                                    background: `${activePillar.accentHex}18`,
                                    border: `1px solid ${activePillar.accentHex}35`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                }}>
                                    {activePillar.icon}
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>{activePillar.title}</h3>
                                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: activePillar.accent, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Capability Overview</p>
                                </div>
                            </div>

                            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.75, margin: '0 0 28px' }}>
                                {activePillar.summary}
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                                {activePillar.items.map((item, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            padding: '18px 0',
                                            borderTop: '1px solid rgba(255,255,255,0.06)',
                                            display: 'flex', gap: '16px', alignItems: 'flex-start'
                                        }}
                                    >
                                        <div style={{
                                            width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
                                            background: `${activePillar.accentHex}15`,
                                            border: `1px solid ${activePillar.accentHex}30`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '11px', fontWeight: 700, color: activePillar.accent
                                        }}>
                                            {String(i + 1).padStart(2, '0')}
                                        </div>
                                        <div>
                                            <p style={{ margin: '0 0 5px', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{item.label}</p>
                                            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.65 }}>{item.detail}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>,
                    document.body
                )}

                <section id="capture-guide" style={{ maxWidth: '1400px', width: '100%', padding: '40px 48px 100px' }}>
                    <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                        <h2 style={{ fontSize: '36px', fontWeight: 800, color: 'var(--text-primary)' }}>Working with PCAP Files</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '16px', marginTop: '16px', maxWidth: '600px', margin: '16px auto 0' }}>Generate high-fidelity packet captures using native tooling on any platform.</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>

                        <div className="card hover-glow" style={{ padding: '32px', background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', transition: 'all 0.3s ease' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--accent-cyan)' }}></div> Windows Capture
                            </h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.7', marginBottom: '16px' }}>
                                Generate `.pcap` files using professional graphical tools like <strong style={{ color: "var(--text-primary)" }}>Wireshark</strong>.
                            </p>
                            <ol style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.7', paddingLeft: '20px', marginBottom: '24px' }}>
                                <li style={{ marginBottom: '8px' }}>Select your active <strong style={{ color: "var(--text-primary)" }}>Network Adapter</strong> from the interface list.</li>
                                <li style={{ marginBottom: '8px' }}>Click the <strong style={{ color: "var(--text-primary)" }}>Shark Icon</strong> to initiate real-time capture.</li>
                                <li>Save the file in `.pcap` or `.pcapng` format.</li>
                            </ol>
                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
                                <a href="https://www.wireshark.org/docs/" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-cyan)', fontSize: '13px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    Official Wireshark Guide <ChevronRight size={14} />
                                </a>
                            </div>
                        </div>

                        <div className="card hover-glow" style={{ padding: '32px', background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', transition: 'all 0.3s ease' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: 'var(--accent-orange)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--accent-orange)' }}></div> Linux / Unix Terminal
                            </h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.7', marginBottom: '16px' }}>
                                Use the <strong style={{ color: "var(--text-primary)" }}>tcpdump</strong> command-line utility to quickly and efficiently capture network traffic directly to a file.
                            </p>
                            <div style={{ background: 'rgba(0,0,0,0.5)', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '12px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--accent-orange)' }}>
                                sudo tcpdump -i eth0 -w dump.pcap
                            </div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.5', marginBottom: '16px' }}>
                                Ensure the resulting file has correct read permissions for processing:
                            </p>
                            <div style={{ background: 'rgba(0,0,0,0.5)', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '12px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-primary)' }}>
                                chmod 644 dump.pcap
                            </div>
                            <div style={{ marginTop: '16px', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                Pro Tip: Use -v for verbose output
                            </div>
                        </div>

                        <div className="card hover-glow" style={{ padding: '32px', background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', transition: 'all 0.3s ease' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--accent-purple)' }}></div> macOS Devices
                            </h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.7', marginBottom: '16px' }}>
                                macOS ships with a native <strong style={{ color: "var(--text-primary)" }}>tcpdump</strong> binary. Alternatively, use Homebrew to install standard CLI tooling.
                            </p>
                            <div style={{ background: 'rgba(0,0,0,0.5)', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '12px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--accent-purple)' }}>
                                brew install wireshark
                            </div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.5', marginBottom: '16px' }}>
                                Capture on the default Wi-Fi interface (en0):
                            </p>
                            <div style={{ background: 'rgba(0,0,0,0.5)', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '12px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-primary)' }}>
                                sudo tcpdump -i en0 -w mac_dump.pcap
                            </div>
                            <div style={{ marginTop: '16px', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                *Requires Administrator Privileges
                            </div>
                        </div>

                    </div>
                </section>

            </main>

            <footer style={{ background: '#050505', borderTop: '1px solid rgba(255,255,255,0.05)', padding: '60px 48px', position: 'relative', zIndex: 10 }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '40px' }}>
                    <div style={{ maxWidth: '300px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                            <img src="/logo.png" alt="Footer Logo" style={{ height: '28px', objectFit: 'contain' }} />
                            <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>PCAP Analysis System</span>
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: 1.6 }}>
                            Secure, on-premise packet capture analysis functionality processing raw network traffic reliably.
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: '80px' }}>
                        <div>
                            <h4 style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 700, marginBottom: '20px' }}>Capabilities</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                <span style={{ cursor: 'pointer' }}>Network Intelligence</span>
                                <span style={{ cursor: 'pointer' }}>Threat Detection</span>
                                <span style={{ cursor: 'pointer' }}>Compliance & Reporting</span>
                            </div>
                        </div>
                        <div>
                            <h4 style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 700, marginBottom: '20px' }}>Legal</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                <span style={{ cursor: 'pointer' }}>Privacy Policy</span>
                                <span style={{ cursor: 'pointer' }}>Terms of Service</span>
                                <span style={{ cursor: 'pointer' }}>Acceptable Use</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ maxWidth: '1400px', margin: '40px auto 0', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                    <span>© 2026 PCAP Analysis System. All systems operational.</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-green)', boxShadow: '0 0 10px var(--accent-green)' }}></div>
                        Core API Status: OK
                    </div>
                </div>
            </footer>

            <style>{`
                .hover-glow:hover {
                    box-shadow: 0 0 30px rgba(0, 240, 255, 0.05);
                    transform: translateY(-5px);
                    border-color: rgba(0, 240, 255, 0.2) !important;
                }
            `}</style>
        </div>
    );
}
