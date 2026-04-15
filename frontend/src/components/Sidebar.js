/*
 * © Copyright 2026 PES University.
 *
 * Authors:
 *   Mohit Pal - mp65742@gmail.com
 *   Dr. Swetha P - swethap@pes.edu
 *   Dr. Prasad B Honnavalli - prasadhb@pes.edu
 *
 * Contributors:
 *   PurpleSynapz - info@purplesynapz.com
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
    BarChart2,
    Layers,
    Shield,
    FileText,
    Home as HomeIcon,
    ScanSearch
} from "lucide-react";

export default function Sidebar() {

    const [collapsed, setCollapsed] = useState(false);
    const location = useLocation();

    const isActiveCheck = (path) => {
        if (path === "/") return location.pathname === "/";
        return location.pathname.startsWith(path);
    };

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

                <NavLink to="/" className={`sidebar-item ${isActiveCheck("/") ? "active" : ""}`} style={{ marginBottom: '10px' }}>
                    <HomeIcon size={18} />
                    {!collapsed && <span className="sidebar-text">Home</span>}
                </NavLink>

                <NavLink to="/dashboard" className={`sidebar-item ${isActiveCheck("/dashboard") ? "active" : ""}`}>
                    <BarChart2 size={18} />
                    {!collapsed && <span className="sidebar-text">Dashboard</span>}
                </NavLink>

                <NavLink to="/protocols" className={`sidebar-item ${isActiveCheck("/protocols") || isActiveCheck("/packet") || isActiveCheck("/protocol") ? "active" : ""}`}>
                    <Layers size={18} />
                    {!collapsed && <span className="sidebar-text">Protocols</span>}
                </NavLink>

                <NavLink to="/intelligence" className={`sidebar-item ${isActiveCheck("/intelligence") ? "active" : ""}`}>
                    <Shield size={18} />
                    {!collapsed && <span className="sidebar-text">Intelligence</span>}
                </NavLink>

                <NavLink to="/content" className={`sidebar-item ${isActiveCheck("/content") ? "active" : ""}`}>
                    <FileText size={18} />
                    {!collapsed && <span className="sidebar-text">Content</span>}
                </NavLink>

                <NavLink to="/forensic" className={`sidebar-item ${isActiveCheck("/forensic") ? "active" : ""}`}>
                    <ScanSearch size={18} />
                    {!collapsed && <span className="sidebar-text">Forensic Score</span>}
                </NavLink>

            </nav>

            <div className="sidebar-version">
                {!collapsed && <span>Version 1.0.0</span>}
            </div>

        </div>
    );
}