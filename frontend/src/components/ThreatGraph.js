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
import { Share2 } from 'lucide-react';

export default function ThreatGraph({ data }) {
    // Generate graph nodes and links from pcap data
    const graphData = useMemo(() => {
        const nodes = [];
        const links = [];
        const addedNodes = new Set();
        
        const addNode = (id, name, category, val) => {
            if (!addedNodes.has(id)) {
                nodes.push({
                    id,
                    name,
                    category,
                    symbolSize: val,
                    value: val
                });
                addedNodes.add(id);
            }
        };

        // Add Local network node as center
        addNode('local', 'Local Network', 0, 40);

        // Talkers logic
        if (data.top_senders && data.top_senders.length > 0) {
            data.top_senders.slice(0, 10).forEach(sender => {
                const isMalicious = sender.vt_score && sender.vt_score > 0;
                addNode(sender.ip, sender.ip, isMalicious ? 2 : 1, isMalicious ? 30 : 20);
                links.push({
                    source: sender.ip,
                    target: 'local',
                    lineStyle: {
                        color: isMalicious ? '#FF003C' : '#00F0FF',
                        width: isMalicious ? 3 : 1
                    }
                });
            });
        }

        // Add domains
        if (data.domains && data.domains.length > 0) {
            data.domains.slice(0, 8).forEach(d => {
                addNode(d.domain, d.domain, 3, 15);
                links.push({
                    source: 'local',
                    target: d.domain,
                    lineStyle: { color: '#B200FF', curveness: 0.2 }
                });
            });
        }

        return { nodes, links };
    }, [data]);

    const options = {
        backgroundColor: 'transparent',
        tooltip: {
            formatter: '{b}'
        },
        legend: [{
            data: ['Core', 'External Host', 'Threat', 'Domain'],
            textStyle: { color: '#A0ACC0', fontFamily: 'Inter' },
            bottom: 0
        }],
        series: [
            {
                type: 'graph',
                layout: 'force',
                animation: true,
                label: {
                    show: true,
                    position: 'right',
                    formatter: '{b}',
                    color: '#F0F4FA',
                    fontFamily: 'JetBrains Mono',
                    fontSize: 10
                },
                draggable: true,
                data: graphData.nodes,
                categories: [
                    { name: 'Core', itemStyle: { color: '#0A84FF' } },
                    { name: 'External Host', itemStyle: { color: '#00F0FF' } },
                    { name: 'Threat', itemStyle: { color: '#FF003C', shadowBlur: 10, shadowColor: '#FF003C' } },
                    { name: 'Domain', itemStyle: { color: '#B200FF' } },
                ],
                force: {
                    repulsion: 300,
                    edgeLength: [50, 150],
                    gravity: 0.1
                },
                edges: graphData.links,
                lineStyle: {
                    curveness: 0.1,
                    opacity: 0.6
                },
                emphasis: {
                    focus: 'adjacency',
                    lineStyle: { width: 4 }
                }
            }
        ]
    };

    return (
        <div className="card" style={{ height: '500px' }}>
            <h3 className="card-title">
                <Share2 size={18} />
                Entity Threat Graph
            </h3>
            <div style={{ flex: 1, position: 'relative' }}>
                <ReactECharts 
                    option={options} 
                    style={{ height: '100%', width: '100%', position: 'absolute', top: 0, left: 0 }} 
                />
            </div>
        </div>
    );
}
