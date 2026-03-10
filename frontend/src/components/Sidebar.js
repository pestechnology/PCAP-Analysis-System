import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
    BarChart2,
    Layers,
    Shield,
    FileText
} from "lucide-react";

export default function Sidebar() {

    const [collapsed, setCollapsed] = useState(false);

    return (
        <div className={`sidebar ${collapsed ? "collapsed" : ""}`}>

            <div className="sidebar-header">

                <button
                    className="collapse-btn"
                    onClick={() => setCollapsed(prev => !prev)}
                >
                    ☰
                </button>

                {!collapsed && (
                    <div className="logo">PCAP Analysis</div>
                )}
            </div>

            <nav className="sidebar-menu">

                <NavLink to="/" end className="sidebar-item">
                    <BarChart2 size={18} />
                    {!collapsed && <span className="sidebar-text">Dashboard</span>}
                </NavLink>

                <NavLink to="/protocols" className="sidebar-item">
                    <Layers size={18} />
                    {!collapsed && <span className="sidebar-text">Protocols</span>}
                </NavLink>

                <NavLink to="/intelligence" className="sidebar-item">
                    <Shield size={18} />
                    {!collapsed && <span className="sidebar-text">Intelligence</span>}
                </NavLink>

                <NavLink to="/content" className="sidebar-item">
                    <FileText size={18} />
                    {!collapsed && <span className="sidebar-text">Content</span>}
                </NavLink>

            </nav>

            <div className="sidebar-version">
                {!collapsed && <span>Version 1.0.0</span>}
            </div>

        </div>
    );
}