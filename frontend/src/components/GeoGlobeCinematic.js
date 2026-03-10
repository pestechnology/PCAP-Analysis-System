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

/* ================================
   Lat/Lon → 3D Position
================================ */
function latLongToVector3(lat, lon, radius = 2.05) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);

    return new THREE.Vector3(
        -(radius * Math.sin(phi) * Math.cos(theta)),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
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
            <sphereGeometry args={[2, 128, 128]} />
            <meshStandardMaterial map={texture} />
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
        return [...countryData].sort((a, b) => b[1] - a[1]);
    }, [countryData]);

    const selectedCountry = sortedData[selectedIndex]?.[0];
    const selectedPackets = sortedData[selectedIndex]?.[1] || 0;

    const totalPackets = sortedData.reduce((s, [, p]) => s + p, 0);
    function formatTrafficShare(countryPackets, totalPackets) {
        if (!totalPackets || countryPackets === 0) {
            return "0%";
        }

        const raw = (countryPackets / totalPackets) * 100;

        // Dynamically adjust precision
        if (raw < 0.0001) return raw.toFixed(6) + "%";
        if (raw < 0.01) return raw.toFixed(4) + "%";
        if (raw < 0.1) return raw.toFixed(3) + "%";
        if (raw < 1) return raw.toFixed(2) + "%";

        return raw.toFixed(1) + "%";
    }
    const percentage = formatTrafficShare(selectedPackets, totalPackets);

    const markers = useMemo(() => {
        return sortedData
            .map(([country, packets]) => {
                const coords = countryCoordinates[country];
                if (!coords) return null;

                return {
                    country,
                    packets,
                    position: latLongToVector3(coords[0], coords[1]),
                };
            })
            .filter(Boolean);
    }, [sortedData]);

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
        <div style={{ display: "flex", height: "600px", background: "#0c1220", color: "white" }}>

            {/* LEFT PANEL */}
            <div style={{ width: "380px", padding: "40px", background: "#2c2c2e" }}>
                <h2 style={{ marginBottom: "20px" }}>Threat Intelligence</h2>
                <div style={{height: "25px" }}></div>
                <InfoCard title="Selected Country" value={selectedCountry} />
                <InfoCard title="Total Packets" value={selectedPackets} large />
                <InfoCard title="Traffic Share" value={percentage} />

                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "20px", marginBottom: "30px" }}>
                    <button onClick={prevCountry} style={navBtn}>‹</button>
                    <div>{selectedIndex + 1} / {sortedData.length}</div>
                    <button onClick={nextCountry} style={navBtn}>›</button>
                </div>
            </div>

            {/* GLOBE */}
            <div style={{ flex: 1, position: "relative" }}>

                <button
                    onClick={() => setAutoRotate(!autoRotate)}
                    style={playBtn}
                >
                    {autoRotate ? "❚❚" : "▶"}
                </button>

                <Canvas camera={{ position: [0, 0, 5.5], fov: 40 }}>
                    <ambientLight intensity={1.5} />
                    <directionalLight position={[10, 0, 0]} intensity={1.5} />
                    <directionalLight position={[-10, 0, 0]} intensity={1} />
                    <Stars radius={150} depth={80} count={6000} factor={3} />

                    <Earth />

                    {markers.map((m, i) => {
                        const isSelected = selectedCountry === m.country;

                        return (
                            <group
                                key={i}
                                position={m.position.clone().multiplyScalar(1.015)} // slight lift
                                onPointerOver={() => setHoveredCountry(m)}
                                onPointerOut={() => setHoveredCountry(null)}
                                scale={isSelected ? 1.15 : 1}
                            >

                                {/* Pin Head */}
                                <mesh position={[0, 0.03, 0]}>
                                    <sphereGeometry args={[0.025, 16, 16]} />
                                    <meshStandardMaterial
                                        color={isSelected ? "#5ac8fa" : "#47bf68"}
                                        emissive={isSelected ? "#5ac8fa" : "#47bf68"}
                                        emissiveIntensity={isSelected ? 20 : 2}
                                        toneMapped={false}
                                    />
                                </mesh>

                                {/* Pin Tip */}
                                <mesh position={[0, -0.005, 0]}>
                                    <coneGeometry args={[0.015, 0.05, 16]} />
                                    <meshStandardMaterial
                                        color={isSelected ? "#5ac8fa" : "#47bf68"}
                                        emissive={isSelected ? "#5ac8fa" : "#47bf68"}
                                        emissiveIntensity={isSelected ? 18 : 1.5}
                                        toneMapped={false}
                                    />
                                </mesh>

                                {/* Tooltip */}
                                {hoveredCountry?.country === m.country && (
                                    <Html distanceFactor={8}>
                                        <div style={tooltipStyle}>
                                            <div style={{ fontWeight: 600 }}>
                                                {m.country}
                                            </div>
                                            <div style={{ fontSize: "12px", marginTop: "4px" }}>
                                                Packets: {m.packets}
                                            </div>
                                        </div>
                                    </Html>
                                )}

                            </group>
                        );
                    })}

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
                        minDistance={3.5}
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
        <div style={{ background: "#3a3a3c", padding: "20px", borderRadius: "16px", marginBottom: "20px" }}>
            <div style={{ color: "#9ca3af" }}>{title}</div>
            <div style={{ fontSize: large ? "42px" : "24px", marginTop: "8px" }}>
                {value || "None"}
            </div>
        </div>
    );
}

const tooltipStyle = {
    background: "rgba(30,30,30,0.95)",
    padding: "8px 12px",
    borderRadius: "8px",
    color: "white",
    fontSize: "13px",
    whiteSpace: "nowrap",
    boxShadow: "0 4px 12px rgba(0,0,0,0.4)"
};

const navBtn = {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    border: "none",
    background: "#3a3a3c",
    color: "white",
    fontSize: "18px",
    cursor: "pointer",
};

const playBtn = {
    position: "absolute",
    top: "20px",
    right: "20px",
    zIndex: 10,
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    border: "none",
    background: "rgba(44,44,46,0.8)",
    color: "white",
    fontSize: "18px",
    cursor: "pointer",
};