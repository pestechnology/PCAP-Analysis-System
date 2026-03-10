import React from "react";
import SummaryCards from "../components/SummaryCards";
import CaptureMetadata from "../components/CaptureMetadata";
import CaptureHealth from "../components/CaptureHealth";
import PacketSizeHistogram from "../components/PacketSizeHistogram";

export default function Dashboard({ data }) {

    if (!data) return null;

    return (
        <>

            <h2 className="section-heading">Capture Summary</h2>

            <CaptureMetadata metadata={data.capture_metadata} />

            <SummaryCards data={data} />

            <h2 className="section-heading">Capture Health</h2>

            <CaptureHealth
                valid={data.valid_packets}
                malformed={data.malformed_packets}
                fragmented={data.fragmented_packets}
                jumbo={data.jumbo_frames}
                retransmissions={data.tcp}
            />

            <h2 className="section-heading">Traffic Distribution</h2>

            <PacketSizeHistogram
                histogram={data.packet_size_histogram}
            />
        </>
    );
}
