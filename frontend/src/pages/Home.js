import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Globe, Activity, Zap, Server, Lock, ChevronRight, CheckCircle2, FileArchive, Key, Database } from 'lucide-react';
import Upload from '../components/Upload';
import '../index.css';

export default function Home({ setData }) {
    const navigate = useNavigate();

    return (
        <div className="app-wrapper" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-primary)' }}>
            
            {/* INVISIBLE NOISE OVERLAY FOR TEXTURE */}
            <div style={{
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\"0 0 200 200\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cfilter id=\"noiseFilter\"%3E%3CfeTurbulence type=\"fractalNoise\" baseFrequency=\"0.65\" numOctaves=\"3\" stitchTiles=\"stitch\"/%3E%3C/filter%3E%3Crect width=\"100%25\" height=\"100%25\" filter=\"url(%23noiseFilter)\" opacity=\"0.05\"/%3E%3C/svg%3E")',
                pointerEvents: 'none',
                zIndex: 0
            }}></div>

            {/* NAV BAR */}
            <nav style={{ padding: '24px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', position: 'relative', zIndex: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img src="/logo.png" alt="PCAP Analysis Logo" style={{ height: '32px', objectFit: 'contain' }} />
                    <span style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '1px', color: 'var(--text-primary)' }}>
                        PCAP Analysis System
                    </span>
                </div>
                <div style={{ display: 'flex', gap: '32px', fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                    <a href="#about" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={e=>e.target.style.color='var(--accent-cyan)'} onMouseOut={e=>e.target.style.color='var(--text-secondary)'}>Architecture</a>
                    <a href="#capabilities" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={e=>e.target.style.color='var(--accent-cyan)'} onMouseOut={e=>e.target.style.color='var(--text-secondary)'}>Capabilities</a>
                    <a href="#upload-zone" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={e=>e.target.style.color='var(--accent-cyan)'} onMouseOut={e=>e.target.style.color='var(--text-secondary)'}>Analyze</a>
                </div>
            </nav>

            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 10, paddingBottom: '100px' }}>
                
                {/* HERO SECTION */}
                <section style={{ maxWidth: '1400px', width: '100%', padding: '0 48px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
                    
                    <div style={{ display: 'flex', justifyContent: 'center', position: 'relative', width: '100%', marginTop: '30px' }}>
                        <img 
                            src="/pcap_dashboard_ui.png" 
                            alt="PCAP Traffic Analysis Interface" 
                            style={{ 
                                width: '100%',
                                maxWidth: '800px', 
                                maxHeight: '35vh',
                                objectFit: 'contain',
                                borderRadius: '12px',
                                border: '1px solid rgba(0, 240, 255, 0.2)',
                                boxShadow: '0 20px 40px rgba(0,0,0,0.6), 0 0 20px rgba(0, 240, 255, 0.05)',
                                animation: 'float 8s ease-in-out infinite' 
                            }} 
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textAlign: 'center', marginTop: '10px' }}>
                        
                        <h1 style={{ fontSize: '42px', fontWeight: 800, lineHeight: 1.1, color: 'var(--text-primary)' }}>
                            PCAP Analysis System
                        </h1>
                        
                        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.5, maxWidth: '750px', fontWeight: 400 }}>
                            Upload raw packet capture files for deep packet inspection. Our platform processes network traffic, extracts geographic routing endpoints, evaluates IDS rules, and provides comprehensive protocol diagnostics.
                        </p>

                        <div id="upload-zone" style={{ marginTop: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px 20px', width: '100%', maxWidth: '500px', backdropFilter: 'blur(10px)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', textAlign: 'left' }}>
                            <div style={{ marginBottom: '12px', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Lock size={16} color="var(--accent-cyan)" /> SECURE UPLOAD GATEWAY
                            </div>
                            <Upload 
                                onResult={(result) => {
                                    setData(prev => ({
                                        ...prev,
                                        ...result,
                                        host_system: prev.host_system
                                    }));
                                    navigate('/dashboard');
                                }}
                            />
                        </div>

                    </div>
                </section>

                {/* WHAT & WHY SECTION */}
                <section id="about" style={{ width: '100%', background: 'rgba(255,255,255,0.01)', borderTop: '1px solid rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.03)', padding: '100px 48px' }}>
                    <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', gap: '80px', alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                            <h2 style={{ fontSize: '36px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '24px' }}>
                                How the System Works
                            </h2>
                            <p style={{ fontSize: '16px', color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '20px', textAlign: 'justify' }}>
                                Inspecting massive packet captures manually through traditional network analyzers can be overwhelming and time-consuming. Finding specific anomalous behavior vectors requires filtering millions of unrelated packets.
                            </p>
                            <p style={{ fontSize: '16px', color: 'var(--text-secondary)', lineHeight: 1.8, textAlign: 'justify' }}>
                                The PCAP Analysis System streamlines this workflow by automatically parsing network layers, aggregating metadata, and organizing connections into actionable tables. It enables security analysts to swiftly identify unauthorized protocols, misconfigured data streams, and malicious payloads directly from the browser.
                            </p>
                            
                            <div style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {['Comprehensive Packet Filtering', 'Domain and Payload Extraction', 'Structured Geographical Mapping'].map((text, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '15px', color: 'var(--text-primary)', fontWeight: 500 }}>
                                        <CheckCircle2 size={20} color="var(--accent-cyan)" /> {text}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div style={{ flex: 1, position: 'relative', height: '400px', background: 'rgba(0,0,0,0.2)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ position: 'relative', zIndex: 1, background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', padding: '30px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px', width: '70%' }}>
                                <h4 style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '16px', marginBottom: '8px' }}>Data Parsing Sequence</h4>
                                <div style={{ height: '8px', width: '40%', background: 'var(--accent-cyan)', borderRadius: '4px' }}></div>
                                <div style={{ height: '8px', width: '80%', background: 'rgba(255, 255, 255, 0.2)', borderRadius: '4px' }}></div>
                                <div style={{ height: '8px', width: '60%', background: 'rgba(255, 255, 255, 0.2)', borderRadius: '4px' }}></div>
                                <div style={{ height: '8px', width: '90%', background: 'rgba(255, 255, 255, 0.2)', borderRadius: '4px' }}></div>
                                <div style={{ height: '8px', width: '30%', background: 'rgba(255, 255, 255, 0.2)', borderRadius: '4px' }}></div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* SYSTEM CAPABILITIES ENHANCED GRID */}
                <section id="capabilities" style={{ maxWidth: '1400px', width: '100%', padding: '100px 48px' }}>
                    <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                        <h2 style={{ fontSize: '36px', fontWeight: 800, color: 'var(--text-primary)' }}>System Capabilities</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '16px', marginTop: '16px', maxWidth: '600px', margin: '16px auto 0' }}>Comprehensive packet processing designed exclusively for security and operations professionals.</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                        
                        {[
                            { icon: <Activity size={28} color="var(--accent-cyan)" />, title: "Deep Packet Parsing", desc: "Isolates and inspects individual packet payloads, stripping metadata for absolute protocol visibility." },
                            { icon: <Globe size={28} color="var(--accent-purple)" />, title: "Geospatial Routing", desc: "Resolves terminal nodes via GeoIP to map syndication clusters and hostile nation-state infra." },
                            { icon: <ShieldAlert size={28} color="var(--accent-red)" />, title: "Suricata IDS Core", desc: "Maps traffic against high-fidelity threat intelligence signatures spanning trojans, rootkits, and C2." },
                            { icon: <Server size={28} color="var(--accent-green)" />, title: "Micro-Flow Diagnostics", desc: "Reconstructs TCP streams to analyze broken handshakes, retransmission rates, and buffer timeouts." },
                            { icon: <Lock size={28} color="var(--accent-yellow)" />, title: "Cryptographic Metadata", desc: "Extracts TLS/SSL handshakes, cipher suites, and underlying unencrypted domains without MiTM." },
                            { icon: <Zap size={28} color="var(--accent-orange)" />, title: "MAC Vendor Resolution", desc: "Breaks down physical hardware infrastructure routing the traffic locally over Layer 2 networks." },
                            { icon: <FileArchive size={28} color="var(--accent-blue)" />, title: "File Extraction", desc: "Carves executables, documents, and media artifacts directly from unencrypted SMB, HTTP, and FTP streams." },
                            { icon: <Key size={28} color="var(--accent-red)" />, title: "Credential Inference", desc: "Automatically identifies and lists plain-text authentication attempts across legacy or misconfigured protocols." },
                            { icon: <Database size={28} color="var(--accent-cyan)" />, title: "HTTP Forensics", desc: "Assembles raw HTTP transactions into human-readable request and response combinations for web-layer threat hunting." },
                        ].map((feature, idx) => (
                            <div key={idx} className="card hover-glow" style={{ padding: '32px', background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', transition: 'all 0.3s ease' }}>
                                <div style={{ marginBottom: '20px', background: 'rgba(0,0,0,0.3)', width: '56px', height: '56px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    {feature.icon}
                                </div>
                                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px', color: 'var(--text-primary)' }}>
                                    {feature.title}
                                </h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.7' }}>
                                    {feature.desc}
                                </p>
                            </div>
                        ))}

                    </div>
                </section>

                {/* CAPTURE GUIDE SECTION */}
                <section id="capture-guide" style={{ maxWidth: '1400px', width: '100%', padding: '40px 48px 100px' }}>
                    <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                        <h2 style={{ fontSize: '36px', fontWeight: 800, color: 'var(--text-primary)' }}>Working with PCAP Files</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '16px', marginTop: '16px', maxWidth: '600px', margin: '16px auto 0' }}>Generate high-fidelity packet captures using native tooling on any platform.</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                        
                        {/* WINDOWS */}
                        <div className="card hover-glow" style={{ padding: '32px', background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', transition: 'all 0.3s ease' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--accent-cyan)'}}></div> Windows Capture
                            </h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.7', marginBottom: '16px' }}>
                                Generate `.pcap` files using professional graphical tools like <strong style={{color:"var(--text-primary)"}}>Wireshark</strong>.
                            </p>
                            <ol style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.7', paddingLeft: '20px', marginBottom: '24px' }}>
                                <li style={{ marginBottom: '8px' }}>Select your active <strong style={{color:"var(--text-primary)"}}>Network Adapter</strong> from the interface list.</li>
                                <li style={{ marginBottom: '8px' }}>Click the <strong style={{color:"var(--text-primary)"}}>Shark Icon</strong> to initiate real-time capture.</li>
                                <li>Save the file in `.pcap` or `.pcapng` format.</li>
                            </ol>
                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
                                <a href="https://www.wireshark.org/docs/" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-cyan)', fontSize: '13px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    Official Wireshark Guide <ChevronRight size={14} />
                                </a>
                            </div>
                        </div>

                        {/* UNIX */}
                        <div className="card hover-glow" style={{ padding: '32px', background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', transition: 'all 0.3s ease' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: 'var(--accent-orange)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--accent-orange)'}}></div> Linux / Unix Terminal
                            </h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.7', marginBottom: '16px' }}>
                                Use the <strong style={{color:"var(--text-primary)"}}>tcpdump</strong> command-line utility to quickly and efficiently capture network traffic directly to a file.
                            </p>
                            <div style={{ background: 'rgba(0,0,0,0.5)', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '12px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--accent-orange)' }}>
                                sudo tcpdump -i eth0 -w dump.pcap
                            </div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.5', marginBottom: '16px' }}>
                                Ensure the resulting file has correct read permissions for processing:
                            </p>
                            <div style={{ background: 'rgba(0,0,0,0.5)', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '12px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-primary)' }}>
                                chmod 644 dump.pcap
                            </div>
                            <div style={{ marginTop: '16px', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                Pro Tip: Use -v for verbose output
                            </div>
                        </div>

                        {/* MACOS */}
                        <div className="card hover-glow" style={{ padding: '32px', background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', transition: 'all 0.3s ease' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--accent-purple)'}}></div> macOS Devices
                            </h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.7', marginBottom: '16px' }}>
                                macOS ships with a native <strong style={{color:"var(--text-primary)"}}>tcpdump</strong> binary. Alternatively, use Homebrew to install standard CLI tooling.
                            </p>
                            <div style={{ background: 'rgba(0,0,0,0.5)', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '12px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--accent-purple)' }}>
                                brew install wireshark
                            </div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.5', marginBottom: '16px' }}>
                                Capture on the default Wi-Fi interface (en0):
                            </p>
                            <div style={{ background: 'rgba(0,0,0,0.5)', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '12px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-primary)' }}>
                                sudo tcpdump -i en0 -w mac_dump.pcap
                            </div>
                            <div style={{ marginTop: '16px', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                *Requires Administrator Privileges
                            </div>
                        </div>

                    </div>
                </section>
                
            </main>

            {/* ENTERPRISE FOOTER */}
            <footer style={{ background: '#050505', borderTop: '1px solid rgba(255,255,255,0.05)', padding: '60px 48px', position: 'relative', zIndex: 10 }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '40px' }}>
                    <div style={{ maxWidth: '300px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                            <img src="/logo.png" alt="Footer Logo" style={{ height: '28px', objectFit: 'contain' }} />
                            <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>PCAP Analysis System</span>
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: 1.6 }}>
                            Secure, on-premise packet capture analysis functionality processing raw network traffic reliably.
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: '80px' }}>
                        <div>
                            <h4 style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 700, marginBottom: '20px' }}>Capabilities</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                <span style={{ cursor: 'pointer' }}>Packet Parsing</span>
                                <span style={{ cursor: 'pointer' }}>Heuristics Logic</span>
                                <span style={{ cursor: 'pointer' }}>Threat Context</span>
                            </div>
                        </div>
                        <div>
                            <h4 style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 700, marginBottom: '20px' }}>Legal</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                <span style={{ cursor: 'pointer' }}>Privacy Policy</span>
                                <span style={{ cursor: 'pointer' }}>Terms of Service</span>
                                <span style={{ cursor: 'pointer' }}>Acceptable Use</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div style={{ maxWidth: '1400px', margin: '40px auto 0', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                    <span>© 2026 PCAP Analysis System. All systems operational.</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-green)', boxShadow: '0 0 10px var(--accent-green)' }}></div>
                        Core API Status: OK
                    </div>
                </div>
            </footer>

            <style>{`
                .hover-glow:hover {
                    box-shadow: 0 0 30px rgba(0, 240, 255, 0.05);
                    transform: translateY(-5px);
                    border-color: rgba(0, 240, 255, 0.2) !important;
                }
            `}</style>
        </div>
    );
}
