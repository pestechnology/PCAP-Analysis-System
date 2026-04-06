import React, { useState } from 'react';
import { AlertTriangle, Globe, Lock, Code, FileDown, Server, Clock } from 'lucide-react';

export default function AttackTimeline({ data }) {
    // Generate synthetic timeline events based on the actual PCAP data summary.
    // In a real backend this would be an array of chronological events.
    const [events] = useState(() => {
        const generatedEvents = [];
        let timeOffset = 0;
        
        // Add domains (DNS)
        if (data.domains && data.domains.length > 0) {
            data.domains.slice(0, 5).forEach((d) => {
                generatedEvents.push({
                    id: `dns-${timeOffset}`,
                    time: `+${timeOffset}ms`,
                    type: 'DNS Query',
                    detail: `Resolved domain: ${d.domain}`,
                    severity: 'safe',
                    icon: <Globe size={16} />
                });
                timeOffset += Math.floor(Math.random() * 50) + 10;
            });
        }

        // Add TLS Connections
        if (data.tls && data.tls.length > 0) {
            data.tls.slice(0, 3).forEach((t) => {
                generatedEvents.push({
                    id: `tls-${timeOffset}`,
                    time: `+${timeOffset}ms`,
                    type: 'TLS Handshake',
                    detail: `Encrypted connection to ${t.server_name || 'unknown host'}`,
                    severity: 'safe',
                    icon: <Lock size={16} />
                });
                timeOffset += Math.floor(Math.random() * 100) + 20;
            });
        }

        // Add HTTP / Extractions
        if (data.http_requests && data.http_requests.length > 0) {
            data.http_requests.slice(0, 3).forEach((req) => {
                generatedEvents.push({
                    id: `http-${timeOffset}`,
                    time: `+${timeOffset}ms`,
                    type: 'HTTP Request',
                    detail: `${req.method} ${req.uri}`,
                    severity: req.uri.includes('login') ? 'warning' : 'safe',
                    icon: <Code size={16} />
                });
                timeOffset += Math.floor(Math.random() * 80) + 5;
            });
        }

        // Add threat alerts (Suricata)
        if (data.suricata_alerts && data.suricata_alerts.length > 0) {
            data.suricata_alerts.slice(0, 5).forEach((alert) => {
                generatedEvents.push({
                    id: `alert-${timeOffset}`,
                    time: `+${timeOffset}ms`,
                    type: 'IDS Alert',
                    detail: alert.signature,
                    severity: alert.severity <= 2 ? 'danger' : 'warning',
                    icon: <AlertTriangle size={16} />
                });
                timeOffset += Math.floor(Math.random() * 30) + 5;
            });
        }

        // Add files
        if (data.extracted_files && data.extracted_files.length > 0) {
            data.extracted_files.slice(0, 2).forEach((file) => {
                generatedEvents.push({
                    id: `file-${timeOffset}`,
                    time: `+${timeOffset}ms`,
                    type: 'File Extraction',
                    detail: `Downloaded: ${file.filename} (${file.mime_type})`,
                    severity: 'warning',
                    icon: <FileDown size={16} />
                });
                timeOffset += Math.floor(Math.random() * 200) + 50;
            });
        }
        
        if (generatedEvents.length === 0) {
            generatedEvents.push({
                id: 'init-0',
                time: '0ms',
                type: 'Capture Initialized',
                detail: 'Began packet analysis tracking',
                severity: 'safe',
                icon: <Server size={16} />
            });
        }

        return generatedEvents.sort((a,b) => parseInt(a.time.replace(/\D/g, '')) - parseInt(b.time.replace(/\D/g, '')));
    });

    return (
        <div className="card timeline-card" style={{ gridColumn: '1 / -1' }}>
            <div className="card-title" style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0, paddingBottom: "14px", borderBottom: "1px solid var(--border-subtle)", marginBottom: "16px" }}>
                <Clock size={16} color="var(--accent-green)" style={{ marginTop: "-2px" }} />
                <span style={{ fontSize: "13px", letterSpacing: "1px", lineHeight: 1 }}>ATTACK PROGRESSION TIMELINE</span>
            </div>

            <div className="timeline-container">
                {events.map((event, index) => (
                    <div key={event.id} className={`timeline-event severity-${event.severity}`}>
                        <div className="timeline-time">{event.time}</div>
                        <div className="timeline-node">
                            <div className="timeline-icon">{event.icon}</div>
                            {index !== events.length - 1 && <div className="timeline-line"></div>}
                        </div>
                        <div className="timeline-content">
                            <div className="timeline-type">{event.type}</div>
                            <div className="timeline-detail">{event.detail}</div>
                        </div>
                    </div>
                ))}
            </div>

            <style>{`
                .timeline-card {
                    max-height: 500px;
                    overflow-y: auto;
                }
                .timeline-container {
                    display: flex;
                    flex-direction: column;
                    padding-top: 10px;
                }
                .timeline-event {
                    display: flex;
                    gap: 16px;
                    min-height: 70px;
                }
                .timeline-time {
                    font-family: var(--font-mono);
                    font-size: 11px;
                    color: var(--text-muted);
                    width: 60px;
                    text-align: right;
                    padding-top: 6px;
                }
                .timeline-node {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    position: relative;
                }
                .timeline-icon {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: var(--bg-surface);
                    border: 2px solid var(--bg-panel);
                    z-index: 2;
                    color: var(--text-secondary);
                }
                .timeline-line {
                    position: absolute;
                    top: 32px;
                    bottom: 0;
                    width: 2px;
                    background: var(--border-highlight);
                    z-index: 1;
                }
                .timeline-content {
                    flex: 1;
                    background: var(--bg-surface);
                    padding: 12px 16px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                    border: 1px solid var(--border-subtle);
                    transition: transform 0.2s, box-shadow 0.2s;
                }
                .timeline-event:hover .timeline-content {
                    transform: translateX(4px);
                }
                .timeline-type {
                    font-size: 13px;
                    font-weight: 600;
                    margin-bottom: 4px;
                    color: var(--text-primary);
                }
                .timeline-detail {
                    font-family: var(--font-mono);
                    font-size: 12px;
                    color: var(--text-secondary);
                    word-break: break-all;
                }

                /* Severities */
                .severity-danger .timeline-icon {
                    background: rgba(255, 0, 60, 0.2);
                    color: var(--accent-red);
                    border-color: rgba(255, 0, 60, 0.4);
                    box-shadow: var(--glow-red);
                }
                .severity-danger .timeline-content {
                    border-color: rgba(255, 0, 60, 0.3);
                }
                
                .severity-warning .timeline-icon {
                    background: rgba(255, 153, 0, 0.2);
                    color: var(--accent-orange);
                    border-color: rgba(255, 153, 0, 0.4);
                }
                .severity-warning .timeline-content {
                    border-color: rgba(255, 153, 0, 0.3);
                }
                
                .severity-safe .timeline-icon {
                    background: rgba(0, 240, 255, 0.1);
                    color: var(--accent-cyan);
                    border-color: var(--border-highlight);
                }
            `}</style>
        </div>
    );
}
