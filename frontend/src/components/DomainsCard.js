export default function DomainsCard({ domains = [] }) {
    return (
        <div className="card">
            <div className="card-title">Extracted Domains</div>

            {domains.length === 0 ? (
                <div className="muted">No domains extracted</div>
            ) : (
                <div className="scroll-list">
                    {domains.map((domain, index) => (
                        <div key={index} className="scroll-item">
                            {domain}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
