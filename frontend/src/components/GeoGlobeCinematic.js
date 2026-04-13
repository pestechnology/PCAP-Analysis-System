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
import React, { useRef, useState, useMemo } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { OrbitControls, Stars, Html } from "@react-three/drei";
import * as THREE from "three";
import countries from "world-countries";

/* ================================
   Country Coordinates Map
================================ */
const countryCoordinates = {};
countries.forEach((c) => {
    if (c.name?.common && c.latlng?.length === 2) {
        countryCoordinates[c.name.common] = c.latlng;
    }
});

/* HQ Location (e.g., Data Center / SOC HQ setup) */
const HQ_COORDS = [37.7749, -122.4194]; // San Francisco
const EARTH_RADIUS = 2;

/* ================================
   Lat/Lon → 3D Position
================================ */
function latLongToVector3(lat, lon, radius = EARTH_RADIUS + 0.05) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);

    return new THREE.Vector3(
        -(radius * Math.sin(phi) * Math.cos(theta)),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
    );
}

/* ================================
   Connection Arcs & Pulses
================================ */
function getSplineFromCoords(startVec, endVec, altitude = 0.15) {
    const distance = startVec.distanceTo(endVec);
    const midPoint = startVec.clone().lerp(endVec, 0.5);
    // Lower altitude multiplier for a tighter, more direct arc
    midPoint.normalize().multiplyScalar(EARTH_RADIUS + distance * altitude);
    return new THREE.QuadraticBezierCurve3(startVec, midPoint, endVec);
}

function PulseLight({ curve, color }) {
    const meshRef = useRef();
    const [progress] = useState(() => Math.random());
    
    useFrame((state, delta) => {
        if (!meshRef.current) return;
        // Faster, cleaner pulse speed
        meshRef.current.userData.progress = (meshRef.current.userData.progress || progress) + delta * 0.6;
        if (meshRef.current.userData.progress > 1) {
            meshRef.current.userData.progress = 0;
        }
        
        const p = curve.getPointAt(meshRef.current.userData.progress);
        meshRef.current.position.copy(p);

        // Optional: make the pulse look like a traveling beam by orienting it along the path
        if (meshRef.current.userData.progress + 0.01 <= 1) {
            const nextP = curve.getPointAt(meshRef.current.userData.progress + 0.01);
            meshRef.current.lookAt(nextP);
        }
    });

    return (
        <mesh ref={meshRef}>
            {/* Elongated packet shape (cylinder or scaled sphere) */}
            <sphereGeometry args={[0.012, 8, 8]} />
            <meshBasicMaterial color={color} />
            <mesh scale={[1, 1, 3]}>
                <sphereGeometry args={[0.015, 8, 8]} />
                <meshBasicMaterial color={color} transparent opacity={0.6} />
            </mesh>
        </mesh>
    );
}

/* ================================
   Camera Focus Controller
================================ */
function CameraFocus({ targetPosition, autoRotate, controlsRef }) {
    const { camera } = useThree();
    const hasFocused = useRef(false);
    const lastTarget = useRef(null);

    useFrame(() => {
        if (!targetPosition) return;

        if (!lastTarget.current || !lastTarget.current.equals(targetPosition)) {
            hasFocused.current = false;
            lastTarget.current = targetPosition.clone();
        }

        const dir = targetPosition.clone().normalize();
        const desiredPosition = dir.multiplyScalar(5.5);

        if (!hasFocused.current) {
            camera.position.lerp(desiredPosition, 0.08);
            if (camera.position.distanceTo(desiredPosition) < 0.01) {
                hasFocused.current = true;
            }
        }

        camera.lookAt(0, 0, 0);

        if (autoRotate && hasFocused.current) {
            camera.position.applyAxisAngle(
                new THREE.Vector3(0, 1, 0),
                0.003
            );
            camera.lookAt(0, 0, 0);
        }

        if (controlsRef.current) {
            controlsRef.current.update();
        }
    });

    return null;
}

/* ================================
   Earth
================================ */
function Earth() {
    const texture = useLoader(THREE.TextureLoader, "/textures/earth_day.jpg");

    return (
        <mesh>
            <sphereGeometry args={[EARTH_RADIUS, 128, 128]} />
            <meshStandardMaterial map={texture} roughness={0.8} metalness={0.1} />
        </mesh>
    );
}

/* ================================
   Main Component
================================ */
export default function GeoGlobeDashboard({ countryData = [] }) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [autoRotate, setAutoRotate] = useState(false);
    const [hoveredCountry, setHoveredCountry] = useState(null);
    const controlsRef = useRef();

    const sortedData = useMemo(() => {
        return [...countryData]
            .filter(([country]) => country && country !== "Unknown")
            .sort((a, b) => b[1] - a[1]);
    }, [countryData]);

    const selectedCountry = sortedData[selectedIndex]?.[0];
    const selectedPackets = sortedData[selectedIndex]?.[1] || 0;

    const totalPackets = sortedData.reduce((s, [, p]) => s + p, 0);
    
    function formatTrafficShare(countryPackets, totalPackets) {
        if (!totalPackets || countryPackets === 0) return "0%";
        const raw = (countryPackets / totalPackets) * 100;
        if (raw < 0.0001) return raw.toFixed(6) + "%";
        if (raw < 0.01) return raw.toFixed(4) + "%";
        if (raw < 0.1) return raw.toFixed(3) + "%";
        if (raw < 1) return raw.toFixed(2) + "%";
        return raw.toFixed(1) + "%";
    }
    const percentage = formatTrafficShare(selectedPackets, totalPackets);

    // Compute max packets for color coding
    const maxPackets = sortedData.length > 0 ? sortedData[0][1] : 1;
    function getSeverityColor(packets) {
        const ratio = packets / maxPackets;
        if (ratio > 0.5) return "#FF003C"; // Critical (Red)
        if (ratio > 0.1) return "#FF9900"; // Suspicious (Orange)
        return "#00F0FF"; // Normal (Cyan)
    }

    const hqVector = useMemo(() => latLongToVector3(HQ_COORDS[0], HQ_COORDS[1]), []);

    const markers = useMemo(() => {
        return sortedData
            .map(([country, packets]) => {

                const coords = countryCoordinates[country];
                if (!coords) return null;

                return {
                    country,
                    packets,
                    position: latLongToVector3(coords[0], coords[1]),
                    color: getSeverityColor(packets)
                };
            })
            .filter(Boolean);
    }, [sortedData, maxPackets]);

    const currentMarker = markers.find(
        (m) => m.country === selectedCountry
    );

    const nextCountry = () => {
        setAutoRotate(false);
        setSelectedIndex((prev) =>
            prev < sortedData.length - 1 ? prev + 1 : prev
        );
    };

    const prevCountry = () => {
        setAutoRotate(false);
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    };

    return (
        <div style={{ display: "flex", height: "600px", background: "var(--bg-primary)", color: "var(--text-primary)", borderRadius: "12px", overflow: "hidden", border: "1px solid var(--border-subtle)" }}>

            {/* LEFT PANEL */}
            <div style={{ width: "380px", padding: "40px", background: "var(--bg-panel)", borderRight: "1px solid var(--border-subtle)", zIndex: 10 }}>
                <h2 style={{ marginBottom: "20px", fontFamily: "var(--font-heading)", textTransform: "uppercase", fontSize: "14px", letterSpacing: "0.5px", color: "var(--text-secondary)" }}>Threat Intelligence</h2>
                <div style={{height: "25px" }}></div>
                <InfoCard title="Selected Country" value={selectedCountry} />
                <InfoCard title="Total Packets" value={selectedPackets} large />
                <InfoCard title="Traffic Share" value={percentage} />

                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "20px", marginBottom: "30px", marginTop: "30px" }}>
                    <button onClick={prevCountry} style={navBtn}>‹</button>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "13px" }}>{selectedIndex + 1} / {sortedData.length}</div>
                    <button onClick={nextCountry} style={navBtn}>›</button>
                </div>
            </div>

            {/* GLOBE */}
            <div style={{ flex: 1, position: "relative" }}>

                <button
                    onClick={() => setAutoRotate(!autoRotate)}
                    style={playBtn}
                    title={autoRotate ? "Pause Auto-Rotation" : "Start Auto-Rotation"}
                >
                    {autoRotate ? "❚❚" : "▶"}
                </button>

                <Canvas camera={{ position: [0, 0, 5.5], fov: 40 }}>
                    <ambientLight intensity={1.5} />
                    <directionalLight position={[10, 0, 0]} intensity={1.5} />
                    <directionalLight position={[-10, 0, 0]} intensity={1} />
                    <Stars radius={150} depth={80} count={6000} factor={3} />

                    <Earth />

                    {/* HQ Marker removed by user request */}
                    {markers.map((m, i) => {
                        const isSelected = selectedCountry === m.country;
                        
                        return (
                            <group
                                key={i}
                                position={m.position.clone().multiplyScalar(1.005)}
                                onPointerOver={() => setHoveredCountry(m)}
                                onPointerOut={() => setHoveredCountry(null)}
                                scale={isSelected ? 1.25 : 1}
                            >

                                {/* Pin Head */}
                                <mesh position={[0, 0.03, 0]}>
                                    <sphereGeometry args={[0.02, 16, 16]} />
                                    <meshStandardMaterial
                                        color={m.color}
                                        emissive={m.color}
                                        emissiveIntensity={isSelected ? 8 : 2}
                                        toneMapped={false}
                                    />
                                </mesh>

                                {/* Tooltip */}
                                {(hoveredCountry?.country === m.country || isSelected) && (
                                    <Html distanceFactor={8}>
                                        <div style={tooltipStyle}>
                                            <div style={{ fontWeight: 600, color: m.color, fontFamily: "var(--font-heading)" }}>
                                                {m.country}
                                            </div>
                                            <div style={{ fontSize: "12px", marginTop: "4px", fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
                                                Packets: {m.packets}
                                            </div>
                                        </div>
                                    </Html>
                                )}

                            </group>
                        );
                    })}

                    {/* Connection arcs removed as per user request */}
                    <CameraFocus
                        targetPosition={currentMarker?.position}
                        autoRotate={autoRotate}
                        controlsRef={controlsRef}
                    />

                    {/* Manual Rotation + Zoom */}
                    <OrbitControls
                        ref={controlsRef}
                        enablePan={false}
                        enableZoom={true}
                        enableRotate={true}
                        minDistance={2.5}
                        maxDistance={8}
                        rotateSpeed={0.7}
                        zoomSpeed={0.8}
                        enableDamping
                        dampingFactor={0.08}
                        onStart={() => setAutoRotate(false)}
                    />
                </Canvas>
            </div>
        </div>
    );
}

/* ================================
   UI
================================ */

function InfoCard({ title, value, large }) {
    return (
        <div style={{ background: "var(--bg-panel-hover)", padding: "20px", borderRadius: "10px", marginBottom: "16px", border: "1px solid var(--border-subtle)" }}>
            <div style={{ color: "var(--text-secondary)", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px", fontFamily: "var(--font-heading)" }}>{title}</div>
            <div style={{ fontSize: large ? "36px" : "20px", marginTop: "10px", fontWeight: "600", color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>
                {value || "None"}
            </div>
        </div>
    );
}

const tooltipStyle = {
    background: "var(--bg-panel)",
    padding: "8px 12px",
    borderRadius: "8px",
    color: "var(--text-primary)",
    fontSize: "13px",
    whiteSpace: "nowrap",
    boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
    border: "1px solid var(--border-subtle)",
    backdropFilter: "blur(8px)",
    pointerEvents: "none"
};

const navBtn = {
    width: "36px",
    height: "36px",
    borderRadius: "8px",
    border: "1px solid var(--border-subtle)",
    background: "var(--bg-panel)",
    color: "var(--text-primary)",
    fontSize: "18px",
    cursor: "pointer",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    transition: "background 0.2s ease"
};

const playBtn = {
    position: "absolute",
    top: "20px",
    right: "20px",
    zIndex: 10,
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    border: "1px solid var(--accent-cyan)",
    background: "rgba(0, 240, 255, 0.1)",
    color: "var(--accent-cyan)",
    fontSize: "16px",
    cursor: "pointer",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    boxShadow: "0 0 16px rgba(0, 240, 255, 0.2)",
    backdropFilter: "blur(4px)",
    transition: "all 0.2s ease"
};