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
import ProtocolPieChart from "../components/ProtocolPieChart";
import ProtocolTimelineChart from "../components/ProtocolTimelineChart";

export default function Protocols({ data }) {

    return (
        <>
            <h2 className="section-heading">Protocol Distribution</h2>

            <div className="section-group grid" >
                <ProtocolPieChart distribution={data.protocol_distribution} />
            </div >

            <h2 className="section-heading">Protocol Activity Over Time</h2>

            <div style={{ marginBottom: "30px" }}>
                <ProtocolTimelineChart timeline={data.protocol_timeline} />
            </div>
        </>
    );
}
