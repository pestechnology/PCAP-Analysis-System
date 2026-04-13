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
import React from 'react';
import { ShieldAlert, Activity, Server, ActivitySquare } from 'lucide-react';

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
            </div>
        </div>
    );
}
