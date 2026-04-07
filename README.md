# PCAP ANALYSIS SYSTEM

A network traffic analysis platform designed to process PCAP files, detect suspicious activity, enrich threat intelligence, and visualize results through an interactive dashboard.

This system was developed as part of a cybersecurity research and industry collaboration project focused on **advanced network monitoring, behavioral analysis, and threat detection**.

> [!IMPORTANT]
> **Professional Use & Authorization Disclaimer**  
> This tool is intended for professional security analysis and research purposes only. It must be used exclusively by authorized individuals on networks and data for which they have explicit permission to monitor and analyze. Unauthorized use of this tool against systems without consent may be illegal and unethical.

---

# Table of Contents

- Overview
- System Architecture
- Project Structure
- Features
- Technologies Used
- Hardware Requirements
- Installation Instructions
- Docker Deployment
- Running the Application
- Threat Detection Pipeline
- GeoIP & Intelligence Integration
- VirusTotal API Configuration

---

# Overview

The PCAP Analysis System enables security analysts and researchers to analyze packet capture files and identify suspicious network behavior.

The system extracts network metadata, performs behavioral analysis, enriches threat intelligence using external feeds, and visualizes findings using a modern web interface.

The platform provides the following capabilities:

- PCAP ingestion and parsing
- TCP flow and protocol analysis
- Detection of suspicious HTTP activity
- Domain intelligence enrichment
- IDS integration using Suricata
- IP geolocation mapping
- Parallel processing of network traffic
- Interactive dashboard visualization

---

# System Architecture

### Architectural Decomposition

#### 1. Ingestion & API Layer
The frontend provides a secure, chunked upload gateway that allows for the ingestion of multi-gigabyte PCAP files by splitting them into manageable chunks. The FastAPI backend (`port 8000`) handles these sessions asynchronously, ensuring the UI remains responsive even during heavy parsing.

#### 2. Orchestration & Scaling Layer
To handle large datasets, the system uses a **Parallel Multi-core Engine**. The `WorkloadPlanner` analyzes the system's hardware capabilities (CPU/RAM) and divides the PCAP analysis task across multiple cores. The `Pipeline` manager ensures that individual chunk results are correctly aggregated.

#### 3. Core Analysis Engine (Deep Packet Inspection)
This layer performs granular inspection of the packet data:
*   **Flow Reconstruction:** Rebuilds TCP streams and tracks UDP conversations.
*   **DPI Modules:** Dedicated extractors for HTTP transactions, authentication credentials, and embedded files (PDFs, EXEs, etc.).
*   **Protocol Analysis:** Specialized analysis for DNS, UDP, and Layer 2 (MAC/OUI) characteristics.

#### 4. Threat Detection & IDS
The system combines signature-based and behavioral detection:
*   **Suricata Integration:** Leverages the industry-standard Suricata engine (integrated within the backend container) for high-fidelity IDS alerts.
*   **Behavioral Detection:** Custom modules for identifying suspicious HTTP patterns and protocol anomalies.

#### 5. Intelligence Enrichment
Raw data is enriched with global threat telemetry:
*   **IP/Domain Reputation:** Real-time lookups against VirusTotal and custom domain feeds.
*   **Geolocation:** Mapping of source/destination IPs to physical locations using MaxMind GeoLite2.

#### 6. Persistence & Visualization
Results are persisted in the `Shared Analysis Store` and served to the React dashboard. The dashboard provides interactive visualizations including protocol timelines, geographical heatmaps, and comprehensive threat reports exportable as PDF or CSV.

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
│   │   ├── hardware_profiler.py
│   │   ├── http_extractor.py
│   │   ├── ingestion.py
│   │   ├── layer2_analysis.py
│   │   ├── parallel_engine.py
│   │   ├── pipeline.py
│   │   ├── report_builder.py
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
│   ├── main.py
│   ├── analyzer.py
│   ├── geo.py
│   ├── statistics.py
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── .env (ignored)
│   └── oui.txt
│
├── frontend
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

# Features

### PCAP Ingestion & Processing
- **Large File Support:** Robust chunked upload gateway for multi-GB captures.
- **Deep Packet Inspection (DPI):** Granular metadata extraction including Source/Dest IPs, Ports, Protocols, and Timestamps.
- **Automated Resource Management:** Hardware profiling ensures analysis job parameters are optimized for host CPU and RAM.

### Advanced Forensic Analysis
- **Flow Reconstruction:** Rebuilds complete TCP streams and tracks UDP conversations.
- **Deep DPI Extractors:** Automated extraction of HTTP transactions, credentials/auth data, and embedded files.
- **Layer 2 Analysis:** MAC address vendor identification (OUI) and protocol layering.

### Threat Detection & IDS
- **Hybrid Detection:** Combines signature-based analysis (Suricata) with behavioral anomaly detection.
- **Malaicious Activity Identificaiton:** Detects suspicious HTTP communications, abnormal TCP behaviors, and malicious domain interactions.

### Intelligence & Visualization
- **Threat Intel Enrichment:** Real-time IP reputation lookups via VirusTotal and custom domain feeds.
- **GeoIP Heatmapping:** Interactive 3D/2D mapping of network traffic origin and destination.
- **Comprehensive Reporting:** Automated generation of detailed PDF and CSV reports for security audits.
- **Interactive SOC Dashboard:** Real-time visualizations powered by Three.js and ECharts.

---

# Technologies Used

### Backend
- **Python 3.11+**
- **FastAPI:** High-performance asynchronous API framework.
- **Scapy & TShark:** Powerful packet manipulation and dissection.
- **Suricata:** Industry-standard IDS engine.
- **ReportLab:** Automated PDF report generation.
- **SQLAlchemy:** Secure data persistence and user management.

### Frontend
- **React 19:** Modern, component-based UI.
- **TailwindCSS v4:** High-density enterprise styling.
- **Three.js & ECharts:** Advanced 3D visualizations and interactive charts.
- **Lucide React:** Professional vector iconography.

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
git clone https://github.com/MohitPal0212/pcap_analysis_system.git
cd pcap_analysis_system
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

### Frontend Dashboard
Access the interactive SOC interface:
```
http://localhost:3000
```

### Backend API (Swagger UI)
Interact directly with the analysis endpoints:
```
http://localhost:8000/docs
```

---

# Threat Detection Pipeline

The detection pipeline follows these stages:

1. PCAP ingestion
2. Packet parsing
3. Flow reconstruction
4. Traffic analysis
5. Threat detection
6. Intelligence enrichment
7. Visualization

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

## Step 4: Restart the Application

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

## License

This project is licensed under the MIT License.
