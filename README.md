# PCAP Analysis System

A network traffic analysis platform designed to process PCAP files, detect suspicious activity, enrich threat intelligence, and visualize results through an interactive dashboard.

This system was developed as part of a cybersecurity research and industry collaboration project focused on **advanced network monitoring, behavioral analysis, and threat detection**.

---

# Table of Contents

- Overview
- System Architecture
- Project Structure
- Features
- Technologies Used
- Installation Instructions
- Docker Deployment
- Running the Application
- Threat Detection Pipeline
- Suricata Integration
- GeoIP Integration

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

The system follows a layered architecture that separates data ingestion, analysis, detection, intelligence enrichment, and visualization.

```
Input Layer
------------------------------
PCAP File Upload
PCAP Capture Directory


        │
        ▼


Analysis Controller Layer
-------------------------------------------------
PCAP Ingestion Engine
Packet Parsing Engine
Chunk Splitting Module
Workload Planning Engine
Parallel Processing Manager


        │
        ▼


Core Analysis Engine
-------------------------------------------------
Flow Engine
Detection Engine
Analysis Engine
Statistics Builder
Traffic Analyzer


        │
        ▼


Threat Detection & IDS Layer
-------------------------------------------------
HTTP Threat Detection
Suricata IDS Integration
Domain Intelligence Engine


        │
        ▼


Threat Intelligence Layer
-------------------------------------------------
Domain Lookup
Threat Intelligence Feeds
IP Reputation Analysis
GeoIP Mapping


        │
        ▼


Data Processing Layer
-------------------------------------------------
Temporary Processing Cache
Shared Data Store
Analysis Metrics


        │
        ▼


Visualization Layer
-------------------------------------------------
React Dashboard
Network Traffic Statistics
Threat Intelligence Panel
GeoIP Map Visualization
```

---

# Project Structure

```
pcap_analysis_system
│
├── backend
│   │
│   ├── core
│   │   ├── analysis_recommender.py
│   │   ├── chunk_splitter.py
│   │   ├── detection_engine.py
│   │   ├── flow_engine.py
│   │   ├── hardware_profiler.py
│   │   ├── ingestion.py
│   │   ├── parallel_engine.py
│   │   ├── pipeline.py
│   │   ├── scaling_manager.py
│   │   └── workload_planner.py
│   │
│   ├── geoip
│   │   └── GeoLite2-City.mmdb
│   │
│   ├── ids
│   │   ├── http_threat_detector.py
│   │   └── suricata_engine.py
│   │
│   ├── services
│   │   └── threat_intel.py
│   │
│   ├── threat_intel
│   │   ├── domain_engine.py
│   │   ├── domain_lookup.py
│   │   └── feed_manager.py
│   │
│   ├── utils
│   │   ├── file_validation.py
│   │   └── system_info.py
│   │
│   ├── analysis_engine.py
│   ├── analyzer.py
│   ├── geo.py
│   ├── host_agent.py
│   ├── main.py
│   ├── parsing.py
│   ├── simple_tcp_server.py
│   ├── statistics.py
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend
│
├── shared_data
│
├── suricata
│   ├── Dockerfile
│   └── suricata.yaml
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

### PCAP Processing

The system ingests PCAP files and extracts relevant packet metadata including:

- Source IP
- Destination IP
- Ports
- Protocol
- Packet timestamps
- Flow characteristics

### Flow Analysis

TCP flows are reconstructed to detect abnormal traffic behavior.

### Threat Detection

The detection engine identifies suspicious patterns such as:

- malicious HTTP communication
- abnormal TCP behavior
- suspicious domains

### Threat Intelligence Enrichment

External threat intelligence sources are used to enrich IP and domain information.

### Suricata IDS Integration

The system integrates Suricata to detect known attack signatures using IDS rules.

### GeoIP Mapping

IP addresses are mapped to geographical locations using the MaxMind GeoLite2 database.

### Dashboard Visualization

The frontend dashboard provides:

- network traffic statistics
- geolocation map
- detected threats
- packet analysis panels

---

# Technologies Used

### Backend

- Python
- Flask
- Scapy
- PyShark

### Frontend

- React
- JavaScript
- CSS

### Threat Detection

- Suricata IDS

### Containerization

- Docker
- Docker Compose

### Threat Intelligence

- Custom threat feed ingestion
- Domain intelligence engine

### Geolocation

- MaxMind GeoLite2

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

The system can be deployed using Docker.

Build containers

```
docker compose build
```

Start containers

```
docker compose up
```

This will start:

- Backend analysis service
- Suricata IDS container
- Frontend dashboard

---

# Running the Application

After deployment:

Frontend

```
http://localhost:3000
```

Backend API

```
http://localhost:5000
```

Upload a PCAP file through the dashboard to begin analysis.

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

# Suricata Integration

The platform integrates Suricata as an IDS engine.

Suricata analyzes network traffic and detects attack signatures using rules.

The Suricata container runs alongside the backend service and sends detection results to the analysis pipeline.

---

# GeoIP Integration

The system uses the MaxMind GeoLite2 City database to determine geographic locations of IP addresses.

Download the database from:

```
https://dev.maxmind.com/geoip/geolite2-free-geolocation-data
```

Place the file inside:

```
backend/geoip/GeoLite2-City.mmdb
```

---
