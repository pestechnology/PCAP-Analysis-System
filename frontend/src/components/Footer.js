export default function Footer() {
    return (
        <footer className="app-footer">

            <div className="footer-left">
                <span className="footer-brand">
                    PCAP Analysis
                </span>

            </div>

            <div className="footer-center">
                <span>
                    Designed for SOC & Network Operations Teams
                </span>
            </div>

            <div className="footer-right">
                <span>
                    © {new Date().getFullYear()} | Mohit Pal & AI
                </span>
            </div>

        </footer>
    );
}
