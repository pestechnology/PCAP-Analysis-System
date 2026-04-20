# PCAP ANALYSIS SYSTEM

A network traffic analysis platform designed to process PCAP files, detect suspicious activity, enrich threat intelligence, and visualize results through an interactive dashboard.

This system was developed as part of a cybersecurity research and industry collaboration project focused on **advanced network monitoring, behavioral analysis, and threat detection**.


---

# Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Project Structure](#project-structure)
- [Component Documentation](#component-documentation)
- [Features](#features)
- [Forensic Confidence Score (HACFCS)](#forensic-confidence-score-hacfcs)
- [Report Generation](#report-generation)
- [Technologies Used](#technologies-used)
- [Hardware Requirements](#hardware-requirements)
- [Installation Instructions](#installation-instructions)
- [Docker Deployment](#docker-deployment)
- [Running the Application](#running-the-application)
- [API Reference](#api-reference)
- [Threat Detection Pipeline](#threat-detection-pipeline)
- [GeoIP & Intelligence Integration](#geoip--intelligence-integration)
- [VirusTotal API Configuration](#virustotal-api-configuration)
- [Contributing](#contributing)
- [Code of Conduct](#code-of-conduct)
- [Security Policy](#security-policy)
- [Community & Support](#community--support)

---

# Overview

The PCAP Analysis System enables security analysts and researchers to analyze packet capture files and identify suspicious network behavior.

The system extracts network metadata, performs behavioral analysis, enriches threat intelligence using external feeds, and visualizes findings using a modern web interface.

The platform provides the following capabilities:

- PCAP ingestion and parsing (single files and multi-GB chunked uploads)
- TCP flow and protocol analysis
- Detection of suspicious HTTP activity
- Domain intelligence enrichment
- IDS integration using Suricata
- IP geolocation mapping
- Parallel processing of network traffic
- Cross-layer forensic confidence scoring (L2–L7)
- Interactive dashboard visualization
- Exportable SOC reports (PDF & CSV)

---

# System Architecture

### Architectural Decomposition

#### 1. Ingestion & API Layer
The frontend provides a secure, chunked upload gateway that allows for the ingestion of multi-gigabyte PCAP files by splitting them into manageable chunks. The FastAPI backend (`port 8000`) handles these sessions asynchronously, ensuring the UI remains responsive even during heavy parsing. Files above 650 MB are intercepted by the **Enterprise Safety Gateway** and must be split before analysis.

#### 2. Orchestration & Scaling Layer
To handle large datasets, the system uses a **Parallel Multi-core Engine**. The `WorkloadPlanner` analyzes the system's hardware capabilities (CPU/RAM) and divides the PCAP analysis task across multiple cores. The `Pipeline` manager ensures that individual chunk results are correctly aggregated.

#### 3. Core Analysis Engine (Deep Packet Inspection)
This layer performs granular inspection of the packet data:
*   **Flow Reconstruction:** Rebuilds TCP streams and tracks UDP conversations.
*   **DPI Modules:** Dedicated extractors for HTTP transactions, authentication credentials, and embedded files (PDFs, EXEs, etc.).
*   **Protocol Analysis:** Specialized analysis for DNS, UDP, TLS/SSL, and Layer 2 (MAC/OUI) characteristics.

#### 4. Threat Detection & IDS
The system combines signature-based and behavioral detection:
*   **Suricata Integration:** Leverages the industry-standard Suricata engine (integrated within the backend container) for high-fidelity IDS alerts.
*   **Behavioral Detection:** Custom modules for identifying suspicious HTTP patterns and protocol anomalies.

#### 5. Intelligence Enrichment
Raw data is enriched with global threat telemetry:
*   **IP/Domain Reputation:** Real-time lookups against VirusTotal and custom domain feeds.
*   **Geolocation:** Mapping of source/destination IPs to physical locations using MaxMind GeoLite2.

#### 6. Forensic Confidence Scoring
The `forensic_scorer` module (HACFCS) fuses signals detected across all OSI layers (L2–L7) into a single normalized **Forensic Confidence Score (FCS)**, classified into `LOW / MEDIUM / HIGH / CRITICAL` triage tiers. See [Forensic Confidence Score (HACFCS)](#forensic-confidence-score-hacfcs) for full details.

#### 7. Persistence & Visualization
Results are persisted as JSON on disk (per job ID) and served to the React dashboard. The dashboard provides interactive visualizations including protocol timelines, geographical heatmaps, and comprehensive threat reports exportable as PDF or CSV.

---

# Project Structure

```
pcap_analysis_system
│
├── backend
│   ├── core
│   │   ├── analysis_recommender.py
│   │   ├── chunk_splitter.py
│   │   ├── credential_extractor.py
│   │   ├── detection_engine.py
│   │   ├── file_extractor.py
│   │   ├── flow_engine.py
│   │   ├── forensic_scorer.py       ← HACFCS cross-layer FCS engine
│   │   ├── hardware_profiler.py
│   │   ├── http_extractor.py
│   │   ├── ingestion.py
│   │   ├── layer2_analysis.py
│   │   ├── parallel_engine.py
│   │   ├── pipeline.py
│   │   ├── report_builder.py        ← PDF & CSV export engine
│   │   ├── scaling_manager.py
│   │   ├── udp_analysis.py
│   │   └── workload_planner.py
│   ├── geoip
│   │   └── GeoLite2-City.mmdb
│   ├── ids
│   │   ├── http_threat_detector.py
│   │   └── suricata_engine.py
│   ├── services
│   │   └── threat_intel.py
│   ├── threat_intel
│   │   ├── domain_engine.py
│   │   ├── domain_lookup.py
│   │   └── feed_manager.py
│   ├── utils
│   │   ├── file_validation.py
│   │   └── system_info.py
│   ├── main.py                      ← FastAPI application & all endpoints
│   ├── analysis_engine.py           ← Parallel analysis orchestrator
│   ├── analyzer.py
│   ├── geo.py
│   ├── parsing.py
│   ├── statistics.py
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── .env (ignored)
│   └── oui.txt
│
├── frontend
│   └── src
│       ├── components
│       │   ├── ForensicScoreCard.js ← FCS score dial & signal evidence table
│       │   ├── DownloadReportButton.js
│       │   └── ... (30+ other components)
│       └── pages
│           ├── Forensic.js          ← Dedicated forensic score page (/forensic)
│           ├── Dashboard.js
│           ├── Intelligence.js
│           ├── Content.js
│           ├── Protocols.js
│           ├── PacketExplorer.js
│           └── PacketDetailPage.js
│
├── shared_data
│
├── suricata
│   ├── Dockerfile
│   └── suricata.yaml
│
├── threat_intel
│   └── domain_feed.txt
│
├── tmp
│
├── docker-compose.yml
│
├── README.md
└── .gitignore
```

---

# Component Documentation

Every backend module and frontend component has a plain-English description in **[COMPONENTS.md](COMPONENTS.md)**.

The document is organised to match the directory layout of the repository:

| Section | What it covers |
|---|---|
| **Backend — Entry Points** | `main.py` (API routes), `analysis_engine.py` (parallel orchestrator), `statistics.py` (streaming packet parser) |
| **Backend — Core Engine** | `forensic_scorer`, `layer2_analysis`, `credential_extractor`, `file_extractor`, `http_extractor`, `report_builder`, `udp_analysis`, and all supporting modules |
| **Backend — IDS** | `suricata_engine` (offline mode runner + EVE parser), `http_threat_detector` (HTTP-specific alert filter) |
| **Backend — Services** | VirusTotal client (`threat_intel.py`) and the domain intelligence engine |
| **Backend — Utils** | `file_validation.py` (extension + magic-byte checks), `system_info.py` (hardware snapshot) |
| **Frontend — Shell** | `App.js` (routing + global state), `api.js` (all fetch calls) |
| **Frontend — Pages** | `Home`, `Dashboard`, `Protocols`, `Intelligence`, `Content`, `Forensic`, `PacketExplorer`, `PacketDetailPage` |
| **Frontend — Components** | All 34 UI components with their data dependencies and rendering responsibilities |

If you are modifying an existing module, please keep the corresponding entry in `COMPONENTS.md` up to date.

---

# Features

### PCAP Ingestion & Processing
- **Large File Support:** Robust chunked upload gateway for multi-GB captures (init → chunk → complete flow).
- **Enterprise Safety Gateway:** Files exceeding 650 MB are automatically intercepted and must be split prior to analysis. Files in the 600–650 MB range can be analyzed directly.
- **PCAP Splitting:** On-demand splitting of oversized captures via the `/split-pcap` endpoint with optional custom filename prefix.
- **Deep Packet Inspection (DPI):** Granular metadata extraction including Source/Dest IPs, Ports, Protocols, and Timestamps.
- **Automated Resource Management:** Hardware profiling ensures analysis job parameters are optimized for host CPU and RAM.

### Advanced Forensic Analysis
- **Flow Reconstruction:** Rebuilds complete TCP streams and tracks UDP conversations.
- **Deep DPI Extractors:** Automated extraction of HTTP transactions, credentials/auth data, and embedded files.
- **Layer 2 Analysis:** ARP spoofing detection, VLAN double-tagging (QinQ), STP topology change events, MAC address vendor identification (OUI).
- **TLS/SSL Analysis:** TLS version enumeration, cipher suite inspection, SNI domain extraction, JA3 fingerprinting, and certificate issuer/subject mapping.
- **SCTP Protocol Analysis:** SCTP packet statistics, chunk type distribution, and multi-homing indicators.
- **UDP Analysis:** Top sources, port distribution, and flagged/suspicious entity detection.

### Threat Detection & IDS
- **Hybrid Detection:** Combines signature-based analysis (Suricata) with behavioral anomaly detection.
- **Malicious Activity Identification:** Detects suspicious HTTP communications, abnormal TCP behaviors, and malicious domain interactions.
- **Behavioral TCP Analysis:** Per-IP risk scoring based on port scan indicators, SYN flood patterns, and handshake failure rates.

### Intelligence & Visualization
- **Threat Intel Enrichment:** Real-time IP reputation lookups via VirusTotal and custom domain feeds.
- **GeoIP Heatmapping:** Interactive 3D/2D mapping of network traffic origin and destination.
- **Interactive SOC Dashboard:** Real-time visualizations powered by Three.js and ECharts.
- **Comprehensive Reporting:** Automated generation of detailed PDF and CSV reports for security audits covering all 18 data sections.
- **Forensic Confidence Scoring:** Dedicated `/forensic` dashboard page displaying the HACFCS score, triage tier, and a per-signal evidence breakdown table.

---

# Forensic Confidence Score (HACFCS)

The system includes a **Hardware-Adaptive Cross-Layer Forensic Confidence Scoring (HACFCS)** engine (`backend/core/forensic_scorer.py`) that correlates anomaly signals detected across OSI Layers 2–7 into a single normalized **Forensic Confidence Score (FCS)** ranging from 0–100.

Detected signals span Layer 2 (ARP spoofing, VLAN double-tagging, STP topology changes), Layer 3/4 (Suricata IDS alerts, high-risk GeoIP), and Layer 7 (plaintext credentials, NTLM hashes, suspicious HTTP, embedded executables). Each signal carries an evidence weight; the aggregated score is normalized and classified into one of four triage tiers: `LOW`, `MEDIUM`, `HIGH`, or `CRITICAL`.

The score is accessible via the dedicated **Forensic Score** page (`/forensic`) in the dashboard sidebar, which displays the score dial, triage classification, and a per-signal evidence breakdown.

---

# Report Generation

PDF and CSV reports are generated server-side and downloaded via the `/api/export-report` endpoint. Reports cover all major analysis areas including traffic overview, protocol analysis, TCP/UDP/TLS/Layer 2 analysis, Suricata alerts, threat intelligence, extracted credentials and files, and geographic IP data. Each report is stamped with a unique Report ID, UTC timestamp, and a **CONFIDENTIAL** classification marking.

---

# Technologies Used

### Backend
- **Python 3.11+**
- **FastAPI:** High-performance asynchronous API framework.
- **Scapy & TShark:** Powerful packet manipulation and dissection.
- **Suricata:** Industry-standard IDS engine.
- **ReportLab:** Automated PDF report generation.

### Frontend
- **React 19:** Modern, component-based UI.
- **TailwindCSS v4:** High-density enterprise styling.
- **Three.js & ECharts:** Advanced 3D visualizations and interactive charts.
- **Lucide React:** Professional vector iconography.
- **React Router v6:** Client-side routing with sidebar navigation.

### Infrastructure & Enrichment
- **Docker & Docker Compose:** Containerized deployment orchestration.
- **MaxMind GeoLite2:** High-accuracy geographic mapping.
- **VirusTotal API:** Real-time threat telemetry integration.

---

# Hardware Requirements

To ensure stable performance when analyzing PCAP files, the following minimum and recommended hardware specifications are suggested.

### Minimum Requirements

- CPU: Dual Core Processor (2 GHz or higher)<br />
- RAM: 8 GB<br />
- Storage: 10 GB available disk space<br />

### Operating System:
- Linux (Ubuntu 20.04 or later recommended)<br />
- macOS<br />
- Windows with WSL2 (recommended for Docker)<br />
- Docker Engine and Docker Compose installed

### Recommended Requirements
For analyzing larger PCAP files or running multiple analyses in parallel:
- CPU: Quad Core Processor (3 GHz or higher)
- RAM: 16 GB or more
- Storage: SSD with at least 20 GB available space
- GPU: Not required
- Network: Internet connection for threat intelligence lookups (VirusTotal API)

### Notes
- Large PCAP files (>650 MB) trigger the Enterprise Safety Gateway for automated partitioning.
- PCAP files between 600 MB and 650 MB can be analyzed directly but may experience slightly longer processing times depending on hardware.
- SSD storage is recommended for faster packet parsing and analysis operations.

---

# Installation Instructions

## 1 Clone the Repository

```
git clone https://github.com/pestechnology/PCAP-Analysis-System.git
cd PCAP-Analysis-System
```

---

## 2 Backend Setup

Navigate to backend directory

```
cd backend
```

Create virtual environment

```
python3 -m venv venv
```

Activate environment

Mac/Linux

```
source venv/bin/activate
```

Windows

```
venv\Scripts\activate
```

Install dependencies

```
pip install -r requirements.txt
```

---

## 2b Run the Backend Server (Uvicorn)

Once dependencies are installed and your virtual environment is active, start the FastAPI backend with:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
> **Important:** Run this command from inside the `backend/` directory, with your virtual environment activated.

---

## 3 Frontend Setup

Navigate to frontend directory

```
cd ../frontend
```

Install dependencies

```
npm install
```

Start frontend server

```
npm start
```

---

# Docker Deployment

The system's backend and analysis engine can be deployed using Docker.

**Build and Start Backend**
```bash
docker compose build
docker compose up
```

This will initialize:
- **FastAPI Analysis Service** (Port 8000)
- **Suricata IDS Engine** (Integrated within service)
- **Shared Analysis Volume** (under `./shared_data`)

*Note: The frontend is typically served separately via `npm start` for development, or a static build for production.*

---

# Running the Application

After deployment:

### Backend (Uvicorn — recommended for development)

Navigate to the `backend/` directory and run:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend Dashboard
In a separate terminal, navigate to the `frontend/` directory and run:

```bash
npm start
```

Access the interactive SOC interface:
```
http://localhost:3000
```

### Backend API (Swagger UI)
Interact directly with the analysis endpoints:
```
http://localhost:8000/docs
```

### Dashboard Navigation

The sidebar provides access to the following views:

| Route | View | Description |
|-------|------|-------------|
| `/` | Home | Landing page with upload interface |
| `/dashboard` | Dashboard | Traffic overview and summary metrics |
| `/protocols` | Protocols | Protocol distribution, TCP, UDP, TLS/SCTP |
| `/intelligence` | Intelligence | GeoIP, threat intel, domain analysis |
| `/content` | Content | Extracted files, credentials, HTTP transactions |
| `/forensic` | Forensic Score | HACFCS score, triage tier, and evidence signals |

---

# API Reference

### File Upload (Chunked)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/upload/init?filename=<name>` | Initialize a chunked upload session |
| `POST` | `/upload/chunk?upload_id=&filename=&chunk_index=` | Upload a single chunk |
| `POST` | `/upload/complete?upload_id=&filename=&advanced=` | Finalize upload and start analysis |

### Analysis

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/analyze-async` | Upload and analyze a PCAP file asynchronously |
| `GET` | `/analysis-progress/{job_id}` | Poll the live progress of an ongoing analysis job |
| `GET` | `/analysis-result/{job_id}` | Retrieve the completed analysis result (JSON) |
| `POST` | `/analyze` | Synchronous single-file analysis (small files) |

### Reports & Export

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/export-report` | Generate and download PDF or CSV report |

### PCAP Splitting

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/split-pcap?prefix=<name>` | Split an oversized PCAP into 600 MB chunks |
| `GET` | `/download-split/{filename}` | Download a generated split chunk |

### Enrichment & Utilities

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/enrich/ip/{ip}` | Real-time VirusTotal IP reputation lookup |
| `GET` | `/system-info` | Host hardware profile (CPU, RAM, OS) |
| `GET` | `/api/http-stream/{job_id}/{stream_index}` | Retrieve a reconstructed TCP/HTTP stream |

---

# Threat Detection Pipeline

The detection pipeline follows these stages:

1. PCAP ingestion & validation
2. Hardware profiling & workload planning
3. Parallel packet parsing across CPU cores
4. Flow reconstruction (TCP streams & UDP conversations)
5. Deep Packet Inspection (HTTP, credentials, files, TLS, Layer 2)
6. Suricata IDS & behavioral anomaly detection
7. Domain & IP threat intelligence enrichment
8. Cross-layer forensic confidence scoring (HACFCS)
9. Result persistence & dashboard visualization

---

# GeoIP & Intelligence Integration

The system uses the MaxMind GeoLite2 City database for location mapping. Ensure the database is placed in the correct directory:

```
backend/geoip/GeoLite2-City.mmdb
```

Download the database from [MaxMind Dev Portal](https://dev.maxmind.com/geoip/geolite2-free-geolocation-data).

---

# VirusTotal API Configuration

The threat intelligence module integrates with the **VirusTotal API** to enrich IP and domain reputation data.

To enable VirusTotal lookups, the developer must configure an API key using an environment variable.

## Step 1: Create a VirusTotal API Key

1. Visit the VirusTotal website:
   
   https://www.virustotal.com

2. Create a free account or sign in.

3. Navigate to the **API Key** section in your account settings.

4. Copy your **VirusTotal API Key**.

---

Inside the **backend directory**, create a `.env` file and add your VirusTotal credentials:

```bash
INTEL_API_KEY=your_virustotal_api_key_here
```

---

## Step 2: Restart the Application

After adding the API key, restart the backend service or Docker containers so the environment variable is loaded.

Example:

```
docker compose down
docker compose up
```

---

## Important Notes

- The `.env` file should **not be committed to Git**.
- Ensure `.env` is included in `.gitignore`.
- Without the VirusTotal API key, **threat intelligence enrichment features will not function**.

---

# Contributing

We welcome contributions from the community! Whether it's bug reports, feature requests, documentation improvements, or code contributions, all input is valued.

Please read our full **[Contributing Guidelines](CONTRIBUTING.md)** before submitting any contribution.

### Quick Start

1. **Fork** the repository and create your branch from `main`.
2. **Follow** the coding style and project structure already in place.
3. **Write clear commit messages** describing *what* and *why*.
4. **Test** your changes thoroughly before opening a pull request.
5. **Open a Pull Request** — fill in the provided template and link any related issues.

### Reporting Bugs

Open a [GitHub Issue](https://github.com/pestechnology/PCAP-Analysis-System/issues) and include:
- A clear, descriptive title
- Steps to reproduce the issue
- Expected vs. actual behavior
- PCAP sample (if applicable and shareable) and environment details

### Suggesting Features

Open a GitHub Issue with the `enhancement` label. Describe the problem being solved, the proposed solution, and any alternatives considered.

---

# Code of Conduct

This project follows the **[Contributor Covenant Code of Conduct v2.1](CODE_OF_CONDUCT.md)**.

All participants in this project — contributors, maintainers, and users — are expected to uphold a welcoming, respectful, and harassment-free environment.

**Our pledge:** We pledge to make participation in this community a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity, level of experience, nationality, personal appearance, race, religion, or sexual identity.

Instances of abusive, harassing, or otherwise unacceptable behavior may be reported to the project maintainers at **mp65742@gmail.com** or **office.isfcr@pes.edu**.

See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) for the full text.

---

# Security Policy

We take security seriously. If you discover a vulnerability in this project, **please do not open a public GitHub Issue.**

Instead, report it responsibly by following our **[Security Policy](SECURITY.md)**.

### Reporting a Vulnerability

- **Email:** mp65742@gmail.com (Subject: `[SECURITY] <brief description>`)
- **Response SLA:** We aim to acknowledge reports within **48 hours** and provide a resolution timeline within **7 days**.
- Reporters who responsibly disclose vulnerabilities will be credited in the release notes.

See [SECURITY.md](SECURITY.md) for supported versions, scope, and the full disclosure process.

---

# Community & Support

| Channel | Purpose |
|---|---|
| [GitHub Issues](https://github.com/pestechnology/PCAP-Analysis-System/issues) | Bug reports & feature requests |
| [GitHub Discussions](https://github.com/pestechnology/PCAP-Analysis-System/discussions) | General questions, ideas, and community chat |
| **Email** — office.isfcr@pes.edu | Academic & research collaboration inquiries |
| **Email** — mp65742@gmail.com | Direct maintainer contact |

> **Note:** This project is developed and maintained as part of cybersecurity research at PES University (ISFCR). Response times may vary during academic periods.

---

# © Copyright 2026 PES University.

## Authors:
 ###### Mohit Pal - mp65742@gmail.com
 ###### Dr. Swetha P - swethap@pes.edu
 ###### Dr. Prasad B Honnavalli - prasadhb@pes.edu

## Contributors:
 ###### PurpleSynapz - info@purplesynapz.com 
 Licensed under the Apache License, Version 2.0 (the "License"); 
 You may not use this file except in compliance with the License.
 You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 ###### SPDX-License-Identifier: Apache-2.0

---

For further queries related to the project/application, reach out to ISFCR, PES University - office.isfcr@pes.edu
