import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, Outlet, Navigate } from "react-router-dom";
import Upload from "./components/Upload";
import Dashboard from "./pages/Dashboard";
import Protocols from "./pages/Protocols";
import Intelligence from "./pages/Intelligence";
import Content from "./pages/Content";
import Footer from "./components/Footer";
import Packets from "./pages/PacketExplorer";
import PacketDetailPage from "./pages/PacketDetailPage";
import Sidebar from "./components/Sidebar";
import Home from "./pages/Home";
import DownloadReportButton from "./components/DownloadReportButton";

function MainLayout({ data, setData }) {
    return (
        <div className="app-layout">
            <Sidebar />
            <div className="main-content">
                <div className="header">
                    <div className="header-left">
                        <h1>PCAP Analysis System</h1>
                        <p>Packet capture analysis for SOC and network operations teams</p>
                        <div className="upload-row">
                            <Upload
                                currentFilename={data.current_filename}
                                currentMode={data.current_mode}
                                onResult={(result) =>
                                    setData(prev => ({
                                        ...prev,
                                        ...result,
                                        host_system: prev.host_system
                                    }))
                                }
                            />
                        </div>
                        {/* Export Report row — only rendered when data is available */}
                        {data.total_packets > 0 && (
                            <div className="export-bar">
                                <span className="export-bar-label">Export Report</span>
                                <DownloadReportButton data={data} />
                            </div>
                        )}
                    </div>

                    <div className="host-panel">
                        <div className="host-header">Host Environment</div>
                        <div className="host-stats">
                            <div className="stat"><span>OS</span><strong>{data.host_system?.os}</strong></div>
                            <div className="stat"><span>Architecture</span><strong>{data.host_system?.architecture}</strong></div>
                            <div className="stat"><span>CPU Cores</span><strong>{data.host_system?.cpu_cores}</strong></div>
                            <div className="stat"><span>Total RAM</span><strong>{data.host_system?.total_ram_gb} GB</strong></div>
                            <div className="stat"><span>Available RAM</span><strong>{data.host_system?.available_ram_gb} GB</strong></div>
                            <div className="stat"><span>Disk</span><strong>{data.host_system?.total_disk_gb} GB</strong></div>
                        </div>
                    </div>
                </div>

                <div className="page-wrapper">
                    <Outlet />
                </div>
                <Footer />
            </div>
        </div>
    );
}

export default function App() {

    const defaultData = {
        current_filename: "",
        current_mode: "",
        capture_metadata: { pcap_format: "—", file_size_bytes: 0, capture_duration_seconds: 0, snapshot_length: 0, capture_start_time: "—", capture_end_time: "—" },
        host_system: { os: "", architecture: "", processor: "", hostname: "", cpu_cores: 0, total_ram_gb: 0, available_ram_gb: 0, total_disk_gb: 0 },
        total_packets: 0, valid_packets: 0, malformed_packets: 0, fragmented_packets: 0, jumbo_frames: 0, packets_per_second: 0, geo_data: {}, ip_percentages: {}, country_traffic: [], mac_vendors: [], domains: [], urls: [],
        extracted_files: [], extracted_credentials: [],
        packet_size: { min: 0, max: 0, avg: 0 },
        packet_size_histogram: { "0-200": 0, "201-400": 0, "401-800": 0, "801-1200": 0, "1201-1500": 0, "1500+": 0 },
        top_senders: [], top_receivers: [], ip_distribution: {}, protocol_distribution: {}, protocol_timeline: {},
        tcp: { total_tcp_packets: 0, timeout_retransmissions: 0, fast_retransmissions: 0, partial_retransmissions: 0, out_of_order: 0, retransmission_rate: 0, severity: "normal", note: "" }
    };

    const [data, setData] = useState(defaultData);

    useEffect(() => {
        fetch("http://127.0.0.1:9001/host-info")
            .then(res => {
                if (!res.ok) throw new Error("Network response not ok");
                return res.json();
            })
            .then(systemInfo => {
                setData(prev => ({ ...prev, host_system: systemInfo }));
            })
            .catch(err => {
                console.error("Host agent error:", err);
            });
    }, []);

    return (
        <Router>
            <Routes>
                {/* Landing Page ONLY */}
                <Route path="/" element={<Home setData={setData} />} />

                {/* Dashboard Layout Wrapper */}
                <Route element={<MainLayout data={data} setData={setData} />}>
                    {/* Redirect root of layout if needed, or define discrete URLs */}
                    <Route path="/app" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<Dashboard data={data} />} />
                    <Route path="/protocols" element={<Protocols data={data} />} />
                    <Route path="/intelligence" element={<Intelligence data={data} />} />
                    <Route path="/content" element={<Content data={data} />} />
                    <Route path="/packets/:protocol" element={<Packets data={data} />} />
                    <Route path="/protocol/:protocol" element={<Packets data={data} />} />
                    <Route path="/packet/:id" element={<PacketDetailPage />} />
                </Route>
            </Routes>
        </Router>
    );
}