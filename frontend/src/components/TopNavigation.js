import React from 'react';
import { ShieldAlert, Download, Activity, Server, ActivitySquare } from 'lucide-react';

export default function TopNavigation({ hostSystem, packetsAnalyzed }) {
    return (
        <div className="top-nav">
            <div className="top-nav-left">
                <div className="platform-logo">
                    <ShieldAlert size={20} />
                    <span>PCAP Intelligence Platform</span>
                </div>
            </div>

            <div className="top-nav-right">
                {packetsAnalyzed > 0 && (
                    <div className="status-indicator">
                        <ActivitySquare size={16} />
                        <span>{packetsAnalyzed.toLocaleString()} Packets Analyzed</span>
                    </div>
                )}
                
                <div className="status-indicator">
                    <Server size={16} />
                    <span>{hostSystem?.os || 'System'} | {hostSystem?.total_ram_gb || 0}GB RAM</span>
                </div>

                <div className="status-indicator">
                    <div className="status-dot"></div>
                    <span>System Active</span>
                </div>

                <button className="soc-report-btn">
                    <Download size={14} />
                    <span>SOC Report</span>
                </button>
            </div>
        </div>
    );
}
