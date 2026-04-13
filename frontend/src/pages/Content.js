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
import DomainsCard from "../components/DomainsCard";
import UrlsCard from "../components/UrlsCard";
import MacVendorCard from "../components/MacVendorCard";
import HttpThreatsCard from "../components/HttpThreatsCard";
import FilesCard from "../components/FilesCard";
import CredentialsCard from "../components/CredentialsCard";

export default function Content({ data }) {

    return (
        <>
            <h2 className="section-heading">Content & Extraction</h2>

            <div className="section-group grid" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
                <DomainsCard domains={data.domains} />
                <UrlsCard urls={data.urls || (data.http_transactions ? data.http_transactions.map(t => t.url) : [])} />
                <MacVendorCard vendors={data.mac_vendors} />
                <HttpThreatsCard threats={data.http_threats} />
                <FilesCard files={data.extracted_files} />
                <CredentialsCard credentials={data.extracted_credentials} />
            </div>
        </>
    );
}
