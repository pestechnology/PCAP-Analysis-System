export default function ExtractionCard({ domains, urls }) {
    return (
        <div className="card">
            <div className="card-title">Extracted Domains & URLs</div>

            <div style={{ marginBottom: "12px" }}>
                <strong>Domains:</strong>
                <ul>
                    {domains.map((d, i) => (
                        <li key={i}>{d}</li>
                    ))}
                </ul>
            </div>

            <div>
                <strong>URLs:</strong>
                <ul>
                    {urls.map((u, i) => (
                        <li key={i}>{u}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
