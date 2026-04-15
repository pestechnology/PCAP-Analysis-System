# © Copyright 2026 PES University.
#
# Authors:
#   Mohit Pal - mp65742@gmail.com
#   Dr. Swetha P - swethap@pes.edu
#   Dr. Prasad B Honnavalli - prasadhb@pes.edu
#
# Contributors:
#   PurpleSynapz - info@purplesynapz.com
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# SPDX-License-Identifier: Apache-2.0

"""
Cross-Layer Signal Fusion Engine — Forensic Confidence Scoring (FCS)

This module is the core of the Hardware-Adaptive Cross-Layer Forensic
Confidence Scoring (HACFCS) invention. It receives the aggregated output
of all parallel analysis workers (spanning OSI Layers 2 through 7) along
with the hardware context under which the analysis was conducted, and
produces a single, normalized Forensic Confidence Score (FCS) per analysis
session.

The FCS is computed by:
  1. Detecting the presence of anomaly signals across all OSI layers.
  2. Mapping each detected signal to a predefined evidence weight coefficient.
  3. Summing the weights and normalizing against the maximum possible score.
  4. Classifying the result into a triage priority tier.

This constitutes the inventive core of the patent claim: no existing PCAP
analysis tool correlates signals from Layer 2 hardware anomalies through
Layer 7 application-layer exposures into a single, reproducible confidence
metric tied to a specific hardware analysis context.
"""

# ============================================================
# EVIDENCE WEIGHT TABLE
# Each entry maps a detectable signal to its evidence weight
# coefficient. Higher values indicate stronger forensic evidence
# of malicious or anomalous activity.
# ============================================================

EVIDENCE_WEIGHTS = {
    # Layer 2 — Data Link
    "arp_spoofing":           {"layer": "L2",    "weight": 1.5, "label": "ARP Spoofing Candidate"},
    "gratuitous_arp":         {"layer": "L2",    "weight": 1.2, "label": "Excessive Gratuitous ARP"},
    "vlan_double_tag":        {"layer": "L2",    "weight": 1.2, "label": "VLAN Double-Tagging (QinQ)"},
    "stp_topology_change":    {"layer": "L2",    "weight": 1.4, "label": "STP Topology Change Event"},

    # Layer 3 / Layer 4 — Network / Transport
    "suricata_high_alert":    {"layer": "L3/L4", "weight": 3.0, "label": "Suricata High-Severity IDS Alert"},
    "suricata_std_alert":     {"layer": "L3/L4", "weight": 2.0, "label": "Suricata Standard IDS Alert"},
    "domain_threat_hit":      {"layer": "L3/L7", "weight": 2.5, "label": "Malicious Domain / Threat Intel Hit"},
    "high_risk_geoip":        {"layer": "L3",    "weight": 1.3, "label": "High-Risk GeoIP Origin"},

    # Layer 7 — Application
    "plaintext_credential":   {"layer": "L7",    "weight": 2.5, "label": "Plaintext Credential Exposure"},
    "ntlm_credential":        {"layer": "L7",    "weight": 1.8, "label": "NTLM / SMB Credential Hash"},
    "suspicious_http":        {"layer": "L7",    "weight": 1.5, "label": "Suspicious HTTP Pattern"},
    "embedded_executable":    {"layer": "L7",    "weight": 2.0, "label": "Executable File in Traffic"},
}

MAX_POSSIBLE_SCORE = round(sum(v["weight"] for v in EVIDENCE_WEIGHTS.values()), 2)

# GeoIP country codes considered high-risk for threat intel context
HIGH_RISK_COUNTRIES = {
    "KP", "IR", "SY", "CU", "SD", "RU", "BY", "MM",
}

# Plaintext credential protocols (credentials exposed in clear text)
PLAINTEXT_PROTOCOLS = {"FTP", "HTTP", "SMTP", "IMAP", "SNMP", "TELNET"}

# NTLM/hash-based credential protocols
HASH_PROTOCOLS = {"SMB", "NTLM", "KERBEROS", "MSSQL"}

# Executable / binary file extensions to flag
EXECUTABLE_EXTENSIONS = {
    ".exe", ".dll", ".bat", ".cmd", ".ps1", ".vbs",
    ".sh", ".elf", ".bin", ".msi", ".apk", ".dex"
}


def compute_fcs(analysis_result: dict, hardware_context: dict) -> dict:
    """
    Cross-Layer Signal Fusion Engine.

    Parameters
    ----------
    analysis_result : dict
        The full aggregated output from analyze_parallel(), containing
        keys for arp_analysis, vlan_analysis, stp_analysis,
        abnormal_activity, extracted_credentials, extracted_files,
        http_threats, domain_threat_alerts, geo_data, etc.

    hardware_context : dict
        The hardware profile at analysis time, containing:
        cpu_cores, total_ram_gb, available_ram_gb.

    Returns
    -------
    dict
        {
          "forensic_confidence_score": float,   # 0.0 – 100.0
          "triage_priority": str,               # LOW / MEDIUM / HIGH / CRITICAL
          "raw_score": float,
          "max_possible_score": float,
          "signal_count": int,
          "detected_signals": list[dict],       # signals with layer + weight + detail
          "hardware_context": dict,
        }
    """

    detected_signals = []
    raw_score = 0.0

    def _flag(signal_key: str, detail: str):
        """Register a detected signal and accumulate its weight."""
        nonlocal raw_score
        entry = EVIDENCE_WEIGHTS[signal_key]
        detected_signals.append({
            "signal":  signal_key,
            "layer":   entry["layer"],
            "label":   entry["label"],
            "weight":  entry["weight"],
            "detail":  detail,
        })
        raw_score += entry["weight"]

    # ============================================================
    # LAYER 2 — ARP
    # ============================================================
    arp = analysis_result.get("arp_analysis", {})

    spoofing = arp.get("potential_spoofing", [])
    if spoofing:
        _flag("arp_spoofing",
              f"{len(spoofing)} IP address(es) observed with multiple MAC addresses")

    grat_count = arp.get("gratuitous_arp_count", 0)
    if grat_count > 5:
        _flag("gratuitous_arp",
              f"{grat_count} gratuitous ARP packets detected (threshold: 5)")

    # ============================================================
    # LAYER 2 — VLAN
    # ============================================================
    vlan = analysis_result.get("vlan_analysis", {})

    double_tagged = vlan.get("double_tagged_frames", 0)
    if double_tagged > 0:
        _flag("vlan_double_tag",
              f"{double_tagged} QinQ / 802.1ad double-tagged frame(s) detected")

    # ============================================================
    # LAYER 2 — STP
    # ============================================================
    stp = analysis_result.get("stp_analysis", {})

    tc = stp.get("topology_changes", 0)
    tcn = stp.get("topology_change_notifications", 0)
    if tc > 0 or tcn > 0:
        _flag("stp_topology_change",
              f"{tc} topology change(s), {tcn} topology change notification(s)")

    # ============================================================
    # LAYER 3/4 — Suricata IDS Alerts
    # ============================================================
    flagged_entities = (
        analysis_result
        .get("abnormal_activity", {})
        .get("flagged_entities", [])
    )

    high_count = 0
    std_count  = 0

    for entity in flagged_entities:
        for alert in entity.get("alerts", []):
            sev = str(alert.get("severity", "")).lower()
            if sev in ("high", "critical", "1", "2"):
                high_count += 1
            else:
                std_count += 1

    if high_count > 0:
        _flag("suricata_high_alert",
              f"{high_count} high-severity Suricata IDS alert(s) triggered")

    if std_count > 0:
        _flag("suricata_std_alert",
              f"{std_count} standard Suricata IDS alert(s) triggered")

    # ============================================================
    # LAYER 3/7 — Domain / Threat Intelligence Hits
    # ============================================================
    domain_alerts = analysis_result.get("domain_threat_alerts", [])

    malicious_domains = [
        d for d in domain_alerts
        if isinstance(d, dict) and d.get("verdict") in ("malicious", "suspicious", "high_risk")
    ]

    if not malicious_domains and isinstance(domain_alerts, dict):
        # support flat dict format
        malicious_domains = [
            {"domain": k, **v} for k, v in domain_alerts.items()
            if isinstance(v, dict) and v.get("verdict") in ("malicious", "suspicious", "high_risk")
        ]

    if malicious_domains:
        names = ", ".join(
            d.get("domain", d.get("query", "unknown"))
            for d in malicious_domains[:3]
        )
        suffix = f" (+{len(malicious_domains) - 3} more)" if len(malicious_domains) > 3 else ""
        _flag("domain_threat_hit",
              f"Malicious/suspicious domain(s): {names}{suffix}")

    # ============================================================
    # LAYER 3 — High-Risk GeoIP
    # ============================================================
    geo_data = analysis_result.get("geo_data", {})

    risky_ips = [
        ip for ip, info in geo_data.items()
        if isinstance(info, dict)
        and (info.get("country_code") or "").upper() in HIGH_RISK_COUNTRIES
    ]

    if risky_ips:
        _flag("high_risk_geoip",
              f"{len(risky_ips)} IP(s) from high-risk geographic regions "
              f"({', '.join(risky_ips[:3])})")

    # ============================================================
    # LAYER 7 — Credential Exposure
    # ============================================================
    credentials = analysis_result.get("extracted_credentials", [])

    has_plaintext = any(
        str(c.get("protocol", "")).upper() in PLAINTEXT_PROTOCOLS
        for c in credentials
    )
    has_hash = any(
        str(c.get("protocol", "")).upper() in HASH_PROTOCOLS
        for c in credentials
    )

    if has_plaintext:
        plaintext_creds = [
            c for c in credentials
            if str(c.get("protocol", "")).upper() in PLAINTEXT_PROTOCOLS
        ]
        protocols_seen = list({c.get("protocol", "?") for c in plaintext_creds})
        _flag("plaintext_credential",
              f"{len(plaintext_creds)} session(s) with plaintext credentials "
              f"({', '.join(protocols_seen[:4])})")

    if has_hash:
        _flag("ntlm_credential",
              "NTLM / SMB credential hash(es) captured in traffic")

    # ============================================================
    # LAYER 7 — HTTP Threat Patterns
    # ============================================================
    http_threats = analysis_result.get("http_threats", [])
    if http_threats:
        _flag("suspicious_http",
              f"{len(http_threats)} suspicious HTTP pattern(s) detected by IDS")

    # ============================================================
    # LAYER 7 — Embedded Executable Files
    # ============================================================
    extracted_files = analysis_result.get("extracted_files", [])
    exe_files = [
        f for f in extracted_files
        if any(
            str(f.get("filename", "")).lower().endswith(ext)
            for ext in EXECUTABLE_EXTENSIONS
        )
    ]

    if exe_files:
        names = ", ".join(f.get("filename", "unknown") for f in exe_files[:3])
        suffix = f" (+{len(exe_files) - 3} more)" if len(exe_files) > 3 else ""
        _flag("embedded_executable",
              f"Executable file(s) found in traffic: {names}{suffix}")

    # ============================================================
    # COMPUTE NORMALIZED FCS
    # ============================================================
    fcs = round(min(100.0, (raw_score / MAX_POSSIBLE_SCORE) * 100), 1) if MAX_POSSIBLE_SCORE > 0 else 0.0

    if fcs <= 30:
        triage = "LOW"
    elif fcs <= 60:
        triage = "MEDIUM"
    elif fcs <= 85:
        triage = "HIGH"
    else:
        triage = "CRITICAL"

    return {
        "forensic_confidence_score": fcs,
        "triage_priority":           triage,
        "raw_score":                 round(raw_score, 2),
        "max_possible_score":        MAX_POSSIBLE_SCORE,
        "signal_count":              len(detected_signals),
        "detected_signals":          detected_signals,
        "hardware_context":          hardware_context,
    }
