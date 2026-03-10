import DomainsCard from "../components/DomainsCard";
import UrlsCard from "../components/UrlsCard";
import MacVendorCard from "../components/MacVendorCard";
import HttpThreatsCard from "../components/HttpThreatsCard";

export default function Content({ data }) {

    return (
        <>
            <h2 className="section-heading">Content & Extraction</h2>

            <div className="section-group grid">
                <DomainsCard domains={data.domains} />
                <UrlsCard urls={data.urls} />
                <MacVendorCard vendors={data.mac_vendors} />
                <HttpThreatsCard threats={data.http_threats} />
            </div>
        </>
    );
}
