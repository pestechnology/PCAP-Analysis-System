import ProtocolPieChart from "../components/ProtocolPieChart";
import ProtocolTimelineChart from "../components/ProtocolTimelineChart";

export default function Protocols({ data }) {

    return (
        <>

            <h2 className="section-heading">Protocol Distribution</h2>

            <div className="section-group grid">
                <ProtocolPieChart distribution={data.protocol_distribution} />
                <ProtocolTimelineChart timeline={data.protocol_timeline} />
            </div>
        </>
    );
}
