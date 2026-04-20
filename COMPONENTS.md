# Component Documentation

This document provides a concise description of every module and component in the PCAP Analysis System. It is intended to help contributors understand the responsibility of each file without having to read through the full source code first.

---

## Table of Contents

- [Backend](#backend)
  - [Entry Points](#entry-points)
  - [Core Analysis Engine (`backend/core/`)](#core-analysis-engine-backendcore)
  - [IDS Layer (`backend/ids/`)](#ids-layer-backendids)
  - [Services (`backend/services/`)](#services-backendservices)
  - [Utilities (`backend/utils/`)](#utilities-backendutils)
- [Frontend](#frontend)
  - [Application Shell](#application-shell)
  - [Pages (`frontend/src/pages/`)](#pages-frontendsrcpages)
  - [Components (`frontend/src/components/`)](#components-frontendsrccomponents)
  - [API Layer (`frontend/src/api.js`)](#api-layer-frontendsrcapijs)

---

## Backend

### Entry Points

#### `backend/main.py`
The FastAPI application root. Registers all HTTP routes and wires the backend together.

Key responsibilities:
- **CORS configuration** – allows the React frontend at `localhost:3000`.
- **Chunked upload flow** – three-endpoint pipeline (`/upload/init`, `/upload/chunk`, `/upload/complete`) that reassembles multi-gigabyte PCAPs in `/tmp` without loading them into memory.
- **Async analysis dispatch** – `/analyze-async` hands off a job to a `ThreadPoolExecutor`, returns a `job_id` immediately, and lets the frontend poll `/analysis-progress/{job_id}`.
- **Synchronous fallback** – `/analyze` for small, one-shot analysis calls.
- **Result serving** – `/analysis-result/{job_id}` reads a pre-written JSON file from disk and returns it via `ORJSONResponse`.
- **Report export** – `/api/export-report` delegates to `report_builder` and streams a PDF or CSV back to the browser.
- **PCAP splitting** – `/split-pcap` breaks oversized files using `chunk_splitter`, `/download-split/{filename}` lets the user retrieve each piece.
- **IP enrichment** – `/enrich/ip/{ip}` proxies a request to the VirusTotal service.
- **HTTP stream replay** – `/api/http-stream/{job_id}/{stream_index}` uses `tshark -z follow,tcp,ascii` to reconstruct a specific TCP conversation on demand.

#### `backend/analysis_engine.py`
The parallel analysis orchestrator. Called by `main.py` once a file is ready.

What it does in order:
1. Splits the capture into packet-count-bounded chunks using `editcap`.
2. Dispatches each chunk to `extract_stats_streaming` across a `ProcessPoolExecutor` (one process per CPU core minus one).
3. Merges partial results back into a single dict via `merge_results` — counters are added, top-N lists are re-ranked, and the protocol timeline is compacted if it grows beyond 5,000 buckets.
4. Runs sequential passes for TCP analysis, behavioral anomaly detection, Suricata IDS, TLS metadata, credential extraction, file extraction, HTTP transaction extraction, domain threat intelligence, Layer 2/SCTP analysis, UDP analysis, and final capture metadata.
5. Calls `forensic_scorer.compute_fcs` to produce the HACFCS score.
6. Writes the complete result to `/tmp/{job_id}_result.json` via `orjson` so `main.py` can serve it without re-running analysis.

The `merge_results` function handles the tricky part: combining `Counter`-based dictionaries, merging geo dicts (last write wins per IP), de-duplicating domain/URL lists, and adaptively compacting the timeline by halving bucket resolution when data volume is too high.

#### `backend/statistics.py`
The streaming packet parser and the host for several secondary analysis functions.

- **`extract_stats_streaming(file_path)`** — main workhorse called per chunk. Runs a single `tshark` pass extracting ~25 fields per packet (frame size, timestamps, Ethernet MACs, IP src/dst, TCP/UDP ports, ICMP fields, DNS queries, HTTP host/URI). Accumulates protocol counts, IP distribution, top senders/receivers, packet-size histogram, GeoIP country traffic, and MAC vendor data (via `manuf`). Returns a dict that `merge_results` knows how to combine.
- **`run_tcp_analysis(file_path)`** — tshark pass focused on TCP analysis flags (`retransmission`, `fast_retransmission`, `out_of_order`, `partial_ack`). Returns counts and a severity label (`normal / medium / high`).
- **`analyze_tcp_behavior_advanced(file_path)`** — per-source-IP behavioral scoring. Tracks SYN flood patterns (high SYN count + low handshake completion), port scanning (>50 unique destination ports), excessive RSTs, C2 beaconing (stable inter-packet timing, concentrated single destination, low entropy), repeated or rare JA3 fingerprints, and DDoS target detection (heavy SYN concentration at a single destination IP). Flags IPs with a score ≥ 40.
- **`extract_tls_metadata(file_path)`** — tshark pass over TLS handshake packets. Collects TLS version distribution, cipher suites, SNI domains, JA3 fingerprints, and X.509 certificate issuer/subject fields.
- **`classify_ip(ip)`** — classifies an IP as Private, Multicast, Loopback, Reserved, or Public using the standard `ipaddress` module.
- **`resolve_vendor(mac_full)`** — maps a full MAC address to a human-readable manufacturer name using `manuf`; falls back to the raw OUI prefix if the lookup returns a trivial result.

#### `backend/parsing.py`
Thin Scapy-based parser used by the legacy `AnalysisPipeline` path. Converts raw Scapy `Packet` objects into a list of `dict` records with standard fields. Not used in the primary async analysis path (`analyze_parallel`), which relies on `tshark` via `statistics.py`.

#### `backend/analyzer.py`
A minimal entry-point stub used for early-development CLI testing. Not part of the production API flow.

---

### Core Analysis Engine (`backend/core/`)

#### `backend/core/forensic_scorer.py`
The **Hardware-Adaptive Cross-Layer Forensic Confidence Scoring (HACFCS)** engine. This is the inventive core of the system.

`compute_fcs(analysis_result, hardware_context)` inspects the aggregated analysis output and detects signals across every OSI layer:
- **L2** — ARP spoofing candidates (one IP mapped to multiple MACs), excessive gratuitous ARP (>5 packets), VLAN QinQ double-tagging, STP topology change events.
- **L3/L4** — Suricata high-severity alerts (severity 1 or 2), standard alerts, malicious/suspicious domain hits from threat intelligence.
- **L3** — IPs originating from high-risk country codes (KP, IR, SY, CU, SD, RU, BY, MM).
- **L7** — Plaintext credential sessions (FTP, HTTP, SMTP, IMAP, SNMP, TELNET), NTLM/SMB hash captures, suspicious HTTP pattern alerts from Suricata, embedded executable files in traffic (`.exe`, `.dll`, `.ps1`, `.sh`, `.elf`, etc.).

Each detected signal carries a pre-defined evidence weight (range: 1.2 – 3.0). The raw score is normalized against the maximum possible total to produce a 0–100 FCS, then classified into `LOW / MEDIUM / HIGH / CRITICAL` triage tiers. The hardware context (CPU cores, RAM) is recorded alongside the score for reproducibility.

#### `backend/core/layer2_analysis.py`
All Layer 2 (Data Link) analysis. Uses a dedicated tshark pass per sub-domain rather than a combined query to keep failure isolation clean — one failing tshark call never aborts the rest.

- **`get_link_layer_type(file_path)`** — queries `capinfos` first; falls back to reading `frame.encap_type` from the first 200 packets. Maps numeric encapsulation codes to human-readable names (Ethernet, Wi-Fi, Linux Cooked Capture, etc.).
- **`analyze_arp(file_path)`** — extracts ARP opcode, source/destination IP, and MAC address. Counts requests vs replies, identifies gratuitous ARP (src IP == dst IP in a request), builds an IP→MAC mapping, and flags IPs that appear with more than one MAC as potential ARP spoofing candidates.
- **`analyze_vlan(file_path)`** — reads the `vlan.id` field; frames with two VLAN IDs in a single field are counted as double-tagged (QinQ / 802.1ad).
- **`analyze_stp(file_path)`** — extracts STP BPDU fields. Tracks root bridge election (most-common root MAC), topology change flag counts, and the number of unique participating bridges.
- **`analyze_sctp(file_path)`** — extracts SCTP source/destination ports, verification tags, and chunk types. Detects multi-homed associations (same verification tag seen from multiple source IPs).
- **`run_layer2_analysis(file_path)`** — combines all four functions and returns a single merged dict.

#### `backend/core/credential_extractor.py`
Extracts plaintext and hash-based authentication credentials from a PCAP using three complementary strategies run in sequence.

- **Strategy 1** – `tshark -z credentials`: high-level credential summary. Handles the unusual FTP-specific format where the "username" column actually holds the command (`USER`/`PASS`).
- **Strategy 2** – `tshark -T fields` with a broad filter covering FTP, HTTP Basic Auth, NTLM/SMB, PostgreSQL, LDAP, Kerberos, MSSQL, SNMP, SIP, IMAP, and SMTP. Extracts protocol-specific username and password fields directly.
- **Strategy 3** – A focused FTP-only pass that reads `ftp.request.command` and `ftp.request.arg` to pair `USER` and `PASS` commands across separate TCP packets via `tcp.stream`.

All three strategies write into a shared session dictionary keyed by `(protocol, stream, ip_pair)`. A second-pass deduplication sweep selects the most-complete version of each session (non-empty username preferred over "Unknown", etc.) and returns the final list.

#### `backend/core/file_extractor.py`
Extracts files embedded in network traffic. Uses `tshark --export-objects` for HTTP, SMB, DICOM, and TFTP protocols. Each file is written to a `tempfile` directory, its metadata (filename, size, protocol) is recorded, and the actual bytes are immediately deleted. Returns a deduplicated list of up to 100 files sorted by size descending.

#### `backend/core/http_extractor.py`
Extracts HTTP request metadata. Runs a tshark filter on `http.request` packets and captures the TCP stream index, client/server IPs and ports, HTTP method, host, and URI. De-duplicates by stream index (only the first request per stream is kept) to avoid flooding the UI with repeated polling traffic. Returns up to 50 transactions. The stream index is retained so the UI can request full payload reconstruction on demand via `/api/http-stream`.

#### `backend/core/report_builder.py`
Generates downloadable forensic reports. Two exported functions:

- **`build_csv(data, pcap_filename)`** — produces a multi-section UTF-8 CSV. Sections cover report metadata, capture metadata, traffic summary, packet size histogram, IP/protocol distribution, protocol timeline, TCP analysis, Layer 2 (ARP/VLAN/STP), SCTP, TLS/SSL insights, HTTP threats, behavioral anomalies, UDP analysis, Suricata alerts, DNS queries, domain threat intelligence, extracted URLs, HTTP transactions, extracted files, credentials, geographic IP data, country traffic, top senders/receivers, and MAC vendor identification.
- **`build_pdf(data, pcap_filename)`** — produces a styled A4 PDF using ReportLab. Includes a cover header, corporate color scheme (dark navy headers, alternating row shading), severity-colored alert rows (red for HIGH, orange for MEDIUM), and a universal footer with generation timestamp and page number. All 18 data sections from the CSV are represented.

Helper functions: `_fmt_ts` normalises a variety of timestamp formats to human-readable UTC strings; `_sev_label` maps Suricata integer severity codes to text labels; `_dedup_alerts` extracts and chronologically deduplicates alerts across all flagged entities.

#### `backend/core/udp_analysis.py`
Behavioral analysis specific to UDP traffic. Reads each UDP packet (timestamp, src/dst IP, destination port, frame length) through a streaming generator. Scores each source IP across four dimensions:
- **High packet rate** — >100 packets per second sustained.
- **Port scanning** — destination port spread >25 unique ports.
- **Amplification/reflection** — average packet size >500 bytes with dispersed destination set.
- **Suspicious ports** — use of DNS (53), NTP (123), SSDP (1900), or Memcached (11211).
- Additionally correlates with Suricata UDP alerts from the live EVE log.

IPs scoring ≥ 40 are `flagged`; 20–39 are `suspicious`. Returns summary metrics, top UDP sources (by packet count), port distribution, priority targets (top 5 flagged/suspicious IPs with risk badges), and an overall status string (`clean / suspicious / malicious`).

#### `backend/core/analysis_recommender.py`
Reads the PCAP file size and the host's available RAM/CPU to recommend analysis parameters before a job starts. Returns a `mode` (`streaming` for files under 100 MB, `chunk` otherwise), an estimated `chunk_packets` size (derived from 40% of available RAM at ~1,000 bytes/packet), a `recommended_workers` count, and an `estimated_chunks` count. Used by the `/recommend-analysis` endpoint.

#### `backend/core/chunk_splitter.py`
Splits an oversized PCAP into sub-600 MB chunks using `tcpdump -C`. Accepts an optional `custom_prefix` that is sanitised before being used as the output filename prefix. Returns a list of file paths for the generated chunks.

#### `backend/core/pipeline.py`
Legacy Python-class-based pipeline (`AnalysisPipeline`). Loads packets via `PCAPIngestion`, parses them with `parsing.py`, builds flows via `FlowEngine`, runs detections via `DetectionEngine`, enriches public IPs via VirusTotal, and queries `ScalingManager` for hardware context. This class predates the current `analyze_parallel` approach and is kept for reference; it is only activated when the import from `core.pipeline` succeeds (i.e., in environments where the module path resolves).

#### `backend/core/ingestion.py`
Thin wrapper around Scapy's `rdpcap`. Used by the legacy pipeline to load a full PCAP into memory as a packet list. The streaming `tshark`-based path in `statistics.py` supersedes this for production use.

#### `backend/core/flow_engine.py`
Reconstructs TCP/UDP flows from a parsed packet list (legacy pipeline only). Groups packets by 5-tuple (src IP, dst IP, src port, dst port, protocol) to build conversation records.

#### `backend/core/detection_engine.py`
Simple rule-based anomaly detector for the legacy pipeline. Scans reconstructed flows for known suspicious patterns (port reuse, unusual packet counts). Not used in the `analyze_parallel` production path.

#### `backend/core/parallel_engine.py`
Helper used by the legacy pipeline to fan out analysis tasks. Superseded by the `ProcessPoolExecutor` logic inside `analysis_engine.py`.

#### `backend/core/scaling_manager.py`
Reads disk usage and psutil stats to compute how large a PCAP the current hardware can handle and what chunk size to recommend. Used by the legacy `AnalysisPipeline`.

#### `backend/core/workload_planner.py`
Converts `ScalingManager` output into worker count and chunk-packet recommendations for the legacy pipeline.

#### `backend/core/hardware_profiler.py`
Reads CPU count and available RAM using `psutil`. Produces a simple hardware snapshot dict used by the legacy pipeline.

---

### IDS Layer (`backend/ids/`)

#### `backend/ids/suricata_engine.py`
Runs Suricata in offline PCAP-reading mode (-r), directing log output to a unique `/tmp/suri_{uuid}/` directory. Parses the resulting `eve.json`, extracting every `event_type == "alert"` record. Normalises alerts into a per-source-IP structure — each entry holds an alert list, total count, and the highest (lowest integer) severity seen for that IP. Returns the list sorted by severity ascending then alert count descending (most critical first).

#### `backend/ids/http_threat_detector.py`
Filters the flat Suricata alert list produced by `suricata_engine.py` down to HTTP-related entries. A simple keyword match against the alert signature and category fields (`http`, `web`, `uri`, `trojan`, `c2`, `malware`, `user-agent`) determines whether an alert qualifies. Returns a reduced list with the fields needed by the `ForensicScoreCard` and report builder.

---

### Services (`backend/services/`)

#### `backend/services/threat_intel.py`
VirusTotal API client with an in-memory cache (60-minute TTL). Exposes three functions:
- `check_ip_reputation(ip)` — `GET /ip_addresses/{ip}`
- `check_domain_reputation(domain)` — `GET /domains/{domain}`
- `check_url_reputation(url)` — submits a URL for analysis then polls the result

All three normalise the raw VirusTotal `last_analysis_stats` into a flat dict: `{ malicious, suspicious, harmless, undetected, score (0–100), risk_level (low/medium/high) }`.

The `backend/threat_intel/` directory (separate from `services/`) contains:
- **`domain_engine.py`** — evaluates a list of DNS queries and TLS SNI domains against a local threat feed and returns verdict dicts (`malicious / suspicious / high_risk / clean`).
- **`domain_lookup.py`** — performs the actual line-by-line match against the `domain_feed.txt` blocklist file.
- **`feed_manager.py`** — loads and caches the domain blocklist from `threat_intel/domain_feed.txt`.

---

### Utilities (`backend/utils/`)

#### `backend/utils/file_validation.py`
Gate-checks every uploaded file before analysis begins. Verifies the extension is in the allowed set (`.pcap`, `.pcapng`, `.cap`, `.dump`, `.pcap.gz`, `.pcapng.gz`) and independently runs `capinfos` on the file bytes to confirm the magic bytes match a real packet capture. Raises `ValueError` with a descriptive message so `main.py` can return a clean `400` response.

#### `backend/utils/system_info.py`
Collects host hardware metadata using `platform`, `psutil`, and `socket`: OS name, architecture, processor, hostname, logical CPU count, total RAM (GB), available RAM (GB), and total disk space (GB). This information is served by `/system-info` and is also passed to `forensic_scorer.py` as the hardware context recorded alongside each FCS result.

---

## Frontend

### Application Shell

#### `frontend/src/App.js`
Root React component. Manages a single top-level `data` state object that holds the entire analysis result once a PCAP is processed. On mount, fetches host hardware info from the local host-agent (`localhost:9001/host-info`) and pre-fills `data.host_system`.

Defines two route trees using React Router:
- `/` — renders the `Home` landing page standalone (no sidebar).
- All other paths (`/dashboard`, `/protocols`, `/intelligence`, `/content`, `/forensic`, `/packets/:protocol`, `/packet/:id`) are wrapped by `MainLayout`, which always renders the `Sidebar`, the upload bar with `DownloadReportButton`, a host environment panel, and an `Outlet` for the active page.

#### `frontend/src/api.js`
All `fetch` calls to the backend, exported as named async functions. Groups of functions:
- **Analysis**: `startAnalysis`, `pollProgress`, `fetchResult`, `analyzePCAP` (sync fallback).
- **Chunked upload**: `initUpload`, `sendChunk`, `finalizeUpload`.
- **Reports**: `downloadReport` — posts analysis data as JSON, receives a binary blob, attaches it to a hidden `<a>` element, and triggers a browser download. Reads the `Content-Disposition` header to derive the suggested filename.
- **PCAP splitting**: `splitPCAP`, `getSplitDownloadUrl`.
- **Chunk download**: `fetchChunks`, `getChunkDownloadUrl`.

`fetchResult` includes a three-retry back-off loop to handle the brief window between a job completing and the JSON file being fully flushed to disk.

#### `frontend/src/utils/reportService.js`
A thin utility re-exporting the `downloadReport` function from `api.js`. Exists as a stable import alias so components can reference `reportService` without knowing the internal API file path.

---

### Pages (`frontend/src/pages/`)

#### `Home.js`
The public-facing landing page (`/`). Presents the product overview, upload interface, and a "How to capture a PCAP" guide section. Once a file is analyzed from this page, it calls `setData` passed from `App.js` and navigates the user to `/dashboard`.

#### `Dashboard.js`
The main post-analysis overview (`/dashboard`). Renders `SummaryCards` (total packets, duration, PPS, file size), the packet size histogram, protocol distribution pie chart, IP distribution breakdown, top senders/receivers, MAC vendor data, and the `CaptureMetadata` strip. Most sub-components are passed a slice of the `data` prop.

#### `Protocols.js`
Protocol deep-dive page (`/protocols`). Hosts the protocol activity timeline chart, the `CaptureHealth` TCP assessment card, the TLS metadata card, the SCTP card, and the UDP analysis card. The layout groups transport-layer and application-layer protocol analysis together.

#### `Intelligence.js`
Threat intelligence and geolocation page (`/intelligence`). Contains the `GeoGlobeCinematic` 3D globe, the `CountryTrafficCard`, the `IPCard` (threat intel per IP on demand), the `ThreatGraph`, the `ThreatCarousel`, the `AttackTimeline`, and domain/URL cards. This is the most data-dense page; many sub-components have their own internal fetch calls (e.g., `IPCard` calls `/enrich/ip/{ip}` when the user selects an IP).

#### `Content.js`
Extracted artefact page (`/content`). Displays extracted files (`FilesCard`), captured credentials (`CredentialsCard`), HTTP transactions (`HttpTransactionsCard`), domains observed (`DomainsCard`), and URLs extracted (`UrlsCard`). Each card receives its slice of `data` and handles its own empty-state rendering.

#### `Forensic.js`
Dedicated HACFCS page (`/forensic`). A single-card layout that renders `ForensicScoreCard` with the full `data.forensic_score` object. Designed to be print-friendly and isolated from the rest of the dashboard so the score and evidence table can be clearly reviewed by a SOC analyst.

#### `PacketExplorer.js`
Per-protocol packet browser (`/packets/:protocol` and `/protocol/:protocol`). Reads the `protocol` URL param and fetches relevant packets from the analysis result, presenting them in a scrollable, filterable table. Clicking a row navigates to `PacketDetailPage`.

#### `PacketDetailPage.js`
Single packet detail view (`/packet/:id`). Displays all available fields for a specific packet in a structured layout. For HTTP packets, optionally fetches and renders the full TCP stream via `/api/http-stream/{job_id}/{stream_index}`.

---

### Components (`frontend/src/components/`)

#### `Upload.js`
File upload and analysis trigger. Handles:
- **File selection with extension validation** — only `.pcap`, `.pcapng`, `.cap`, `.dump`, `.pcap.gz`, `.pcapng.gz` are accepted.
- **Oversized file interception** — files above 650 MB are caught before upload and the `Enterprise Safety Gateway` modal is shown instead, offering automated splitting or manual handling.
- **Small-file path** (`< 100 MB`) — calls `startAnalysis`, polls `/analysis-progress`, then fetches the result.
- **Large-file path** (`≥ 100 MB`) — calls `initUpload → sendChunk (×N) → finalizeUpload`, then polls progress.
- **Progress overlay** — a full-screen semi-transparent overlay with a stage label and an animated progress bar while analysis is running.
- **Analysis mode display** — shows "Streaming Mode" for files under 50 MB, "Chunk Optimized Mode" for larger ones.

#### `ForensicScoreCard.js`
Renders the HACFCS result. Shows a radial score dial (0–100), a triage priority badge (`LOW / MEDIUM / HIGH / CRITICAL`) with colour coding, a signal count, and a sortable evidence table listing every detected signal with its OSI layer, label, evidence weight, and detail text. Includes a hardware context panel showing the CPU/RAM profile at time of analysis.

#### `DownloadReportButton.js`
Split-button control for report export. Allows the user to choose between PDF and CSV format via a dropdown. Calls `downloadReport` from `api.js`, shows an in-button spinner while the server generates the file, and handles errors with an inline alert. Only rendered when `data.total_packets > 0`.

#### `GeoGlobeCinematic.js`
3D animated globe built with Three.js. Renders a textured Earth sphere, positions glowing dots for each IP in `geo_data`, and draws arc lines between the top sender/receiver pairs. Camera auto-rotates; hovering a dot shows a tooltip with the IP, country, and city. Falls back gracefully when WebGL is not available.

#### `AttackTimeline.js`
Timeline chart (ECharts scatter plot) of Suricata alert events over time. X-axis is the alert timestamp, Y-axis groups by entity IP. Colour encodes severity. Useful for seeing the chronological pattern of detected attacks across a capture session.

#### `ThreatGraph.js`
Network graph (ECharts graph layout) showing relationships between source IPs and the alerts they triggered. Nodes are sized by alert count; edges connect IPs to their alert signatures. Helps analysts visually identify the most active threat sources.

#### `ThreatCarousel.js`
Scrollable card carousel of Suricata flagged entities. Each card shows the entity IP, alert count, highest severity, and a list of individual alert signatures. Designed for quick triage — the most critical entities appear first.

#### `IPCard.js`
On-demand IP reputation panel. The user selects an IP from a list of top senders; the component calls `/enrich/ip/{ip}` and displays the VirusTotal score, risk level, and detection breakdown (malicious / suspicious / harmless / undetected counts). Shows a loading indicator while the API call is in flight.

#### `IPChart.js`
Bar chart (ECharts) of the top-N IP addresses by packet count. Separate views for senders and receivers, switchable via tab. Clicking a bar populates `IPCard` with that IP for reputation lookup.

#### `ProtocolPieChart.js`
Donut chart (ECharts) showing the protocol distribution (TCP, UDP, DNS, HTTP, etc.) by packet count. Hovering a segment shows the count; clicking isolates that protocol in the legend.

#### `ProtocolTimelineChart.js`
Stacked area chart (ECharts) of protocol activity over capture time. The X-axis is binned by second, and each protocol is a differently coloured layer. Useful for spotting burst periods or sudden shifts in protocol mix.

#### `PacketFlowVisualization.js`
Animated Sankey-style diagram showing traffic flow from source IPs through protocols to destination IPs. Gives a high-level structural view of the capture's communication patterns.

#### `PacketSizeHistogram.js`
Bar chart of the packet size distribution using the six pre-defined bins (`0–200`, `201–400`, `401–800`, `801–1200`, `1201–1500`, `1500+` bytes). Helps identify captures that are disproportionately composed of tiny or jumbo frames.

#### `CaptureHealth.js`
TCP health assessment card. Reads `data.tcp` to display total TCP packets, retransmission counts (timeout, fast, partial), out-of-order packets, and the overall retransmission rate as a percentage. A colour-coded severity badge (`normal / medium / high`) summarises the network quality interpretation.

#### `CaptureMetadata.js`
Compact metadata strip at the top of the Dashboard. Shows PCAP format, file size, capture duration, start/end timestamps, snapshot length, and link-layer type from `data.capture_metadata`.

#### `SummaryCards.js`
Row of four KPI tiles: total packets, capture duration, packets per second, and file size. These are the first numbers a user sees after uploading a file.

#### `LayerTwoCard.js`
Tabbed card covering all Layer 2 analysis results: ARP statistics (request/reply ratio, top requesters, spoofing candidates), VLAN frame counts and distribution, STP BPDU counts and root bridge information, and SCTP summary.

#### `SCTPCard.js`
Dedicated display for SCTP analysis results. Shows total packets, unique associations, multi-homing indicators, top source/destination ports, and chunk type distribution.

#### `UDPAnalysisCard.js`
The most detailed single card in the UI. Renders the full UDP behavioral analysis: summary metrics, flagged and suspicious entity tables (IP, score, reason flags), top UDP sources ranked by packet count, port distribution chart, priority target list with risk badges, and the Suricata correlated alert count breakdown (HIGH / MEDIUM / LOW).

#### `TLSMetadataCard.js`
Tabbed display for TLS/SSL metadata: TLS version distribution, cipher suites in use, SNI domains seen, JA3 fingerprints, certificate issuers, and certificate subjects. Each tab renders a sorted list with counts.

#### `HttpThreatsCard.js`
Table of HTTP-level Suricata alerts filtered by `http_threat_detector.py`. Columns: threat type, source IP, destination IP, severity, and signature. Highlights high-severity rows.

#### `HttpTransactionsCard.js`
Paginated table of HTTP transactions extracted from the capture. Columns: stream index, client IP/port, server IP/port, method, full URL. Includes an expandable stream viewer that fetches and displays the raw TCP conversation for a selected stream via `/api/http-stream`.

#### `CredentialsCard.js`
Table of extracted authentication sessions. Columns: protocol, client IP, server IP, username, and password snippet. Uses distinct row colours for plaintext-protocol credentials (FTP, HTTP) vs hash-based ones (SMB, Kerberos). Empty-state renders a "No credentials detected" message.

#### `FilesCard.js`
List of files extracted from HTTP/SMB/DICOM/TFTP traffic. Shows filename, size in bytes, and originating protocol. Warns the user that executable files represent an elevated risk.

#### `DomainsCard.js`
Simple list of unique DNS domain names observed in the capture, drawn from `data.domains`.

#### `UrlsCard.js`
List of unique HTTP URLs reconstructed from `http.host` + `http.request.uri` fields, taken from `data.urls`.

#### `MacVendorCard.js`
List of MAC address manufacturers (OUI-resolved) and their packet counts. Helps identify the hardware vendors active on the captured network.

#### `CountryTrafficCard.js`
Ranked list of countries by packet volume (top-N from `data.country_traffic`). Each row shows the country name and count. Complements the `GeoGlobeCinematic` globe with a tabular breakdown.

#### `IPPercentageCard.js`
Small breakdown card showing the share of traffic by IP class (Private, Public, Multicast, Loopback, Reserved) as percentages.

#### `Sidebar.js`
Fixed left-hand navigation rail. Links to all six dashboard sections (`/dashboard`, `/protocols`, `/intelligence`, `/content`, `/forensic`, and the landing `/`). The active route is highlighted. Also shows the application logo and version badge.

#### `TopNavigation.js`
Top horizontal bar used in some page layouts for secondary navigation (e.g., protocol sub-tabs). Renders a row of pills that update the active view within a page without changing the route.

#### `Capabilities.js`
Static marketing/info card shown on the `Home` page listing the platform's core capabilities (deep packet inspection, IDS integration, forensic scoring, etc.).

#### `Footer.js`
Site-wide footer rendered inside `MainLayout`. Shows the project copyright notice, license identifier (Apache 2.0), and links to the GitHub repository.

---

*This document was generated from a first-principles review of the actual source code. If you change a module's behaviour, please update the relevant section here.*
