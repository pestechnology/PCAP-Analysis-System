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

import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { Network } from 'lucide-react';

export default function PacketFlowVisualization({ data }) {
    
    // Simulate streaming flow lines
    const flowOptions = useMemo(() => {
        const lineData = [];
        const scatterData = [];

        // Center Node
        scatterData.push({ name: 'Internal Router', value: [50, 50], symbolSize: 40, itemStyle: { color: '#0A84FF' } });

        const processFlow = (ipList, isThreat, startX) => {
            if (!ipList) return;
            ipList.slice(0, 5).forEach((item, idx) => {
                const yPos = 20 + (idx * 15);
                scatterData.push({
                    name: item.ip || item,
                    value: [startX, yPos],
                    symbolSize: isThreat ? 25 : 15,
                    itemStyle: { color: isThreat ? '#FF003C' : '#00F0FF' }
                });

                lineData.push({
                    coords: [
                        [startX, yPos],
                        [50, 50] // Center
                    ],
                    lineStyle: {
                        color: isThreat ? '#FF003C' : '#00F0FF',
                        curveness: 0.2
                    }
                });
            });
        };

        processFlow(data.top_senders, false, 10);
        
        // Find malicious nodes
        const threats = data.top_senders?.filter(s => s.vt_score > 0) || [];
        processFlow(threats.length > 0 ? threats : data.top_receivers, threats.length > 0, 90);

        return {
            backgroundColor: 'transparent',
            grid: { left: 0, right: 0, top: 0, bottom: 0 },
            xAxis: { show: false, min: 0, max: 100 },
            yAxis: { show: false, min: 0, max: 100 },
            series: [
                {
                    type: 'lines',
                    coordinateSystem: 'cartesian2d',
                    effect: {
                        show: true,
                        period: 4,
                        trailLength: 0.2,
                        symbolSize: 6,
                        symbol: 'arrow',
                        color: '#fff'
                    },
                    lineStyle: { width: 1, opacity: 0.4 },
                    data: lineData
                },
                {
                    type: 'scatter',
                    coordinateSystem: 'cartesian2d',
                    symbol: 'circle',
                    label: {
                        show: true,
                        position: 'bottom',
                        formatter: '{b}',
                        fontFamily: 'JetBrains Mono',
                        fontSize: 10,
                        color: '#A0ACC0'
                    },
                    data: scatterData
                }
            ]
        };
    }, [data]);

    return (
        <div className="card" style={{ height: '400px' }}>
            <h3 className="card-title">
                <Network size={18} />
                Live Packet Flow
            </h3>
            <div style={{ flex: 1, position: 'relative' }}>
                <ReactECharts
                    option={flowOptions}
                    style={{ height: '100%', width: '100%', position: 'absolute', top: 0, left: 0 }}
                />
            </div>
        </div>
    );
}
