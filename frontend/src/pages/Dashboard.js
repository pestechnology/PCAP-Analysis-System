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

import React from "react";
import SummaryCards from "../components/SummaryCards";
import CaptureMetadata from "../components/CaptureMetadata";
import CaptureHealth from "../components/CaptureHealth";
import PacketSizeHistogram from "../components/PacketSizeHistogram";
import LayerTwoCard from "../components/LayerTwoCard";
import SCTPCard from "../components/SCTPCard";

export default function Dashboard({ data }) {

    if (!data) return null;

    return (
        <>
            <h2 className="section-heading">Capture Summary</h2>

            <div className="section-group">
                <CaptureMetadata metadata={data.capture_metadata} />
            </div>

            <div className="section-group" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", alignItems: "stretch" }}>
                <SummaryCards data={data} />
                <LayerTwoCard data={data} />
            </div>

            {data.sctp_analysis?.total_sctp_packets > 0 && (
                <>
                    <h2 className="section-heading">Advanced Protocol Intelligence</h2>
                    <div className="section-group">
                        <SCTPCard data={data} />
                    </div>
                </>
            )}

            <br /><br /><br />
            <h2 className="section-heading">Capture Health</h2>

            <div className="section-group">
                <CaptureHealth
                    valid={data.valid_packets}
                    malformed={data.malformed_packets}
                    fragmented={data.fragmented_packets}
                    jumbo={data.jumbo_frames}
                    retransmissions={data.tcp}
                />
            </div>

            <h2 className="section-heading">Traffic Distribution</h2>

            <div className="section-group">
                <PacketSizeHistogram
                    histogram={data.packet_size_histogram}
                />
            </div>
        </>
    );
}
