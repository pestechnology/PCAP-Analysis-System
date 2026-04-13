# © Copyright 2026 PES University.
#
# Authors:
#   Mohit Pal - mp65742@gmail.com
#   Swetha P - swethap@pes.edu
#
# Contributors:
#   PurpleSynapz
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# SPDX-License-Identifier: Apache-2.0

"""
Covers:
  - Link-layer type / data-link type detection (Ethernet, Wi-Fi, Loopback, etc.)
  - ARP analysis  (request/reply ratio, top requesters, duplicate IP detection)
  - VLAN tagging  (VLAN IDs in use, frame counts, double-tagged/QinQ detection)
  - STP           (root bridge, topology change events, BPDU counts)
  - SCTP          (port distribution, top associations, multi-homing detection)

Design principles:
  - Single tshark pass for L2/SCTP stats — no existing code touched.
  - All returned keys are new; merging into the main result dict is additive.
  - Every tshark call has an independent try/except so one failure never
    breaks the rest of the analysis.
  - Returns sensible empty structures on any failure so the frontend
    always receives well-typed data.
"""



import subprocess
from collections import Counter, defaultdict


# ============================================================
# LINK-LAYER TYPE
# ============================================================

ENCAP_TYPES = {
    "0":   "Unknown",
    "1":   "Ethernet",
    "6":   "Token Ring",
    "8":   "SLIP",
    "9":   "PPP",
    "10":  "FDDI",
    "12":  "Raw IP",
    "14":  "RFC 1483 ATM",
    "19":  "Linux ATM Classical IP",
    "23":  "PPP over Ethernet",
    "50":  "Cisco HDLC",
    "51":  "PPP over Serial",
    "98":  "AX.25",
    "99":  "GPRS LLC",
    "100": "Linux LAPD",
    "101": "MTP2",
    "102": "MTP3",
    "103": "SCCP",
    "104": "Null/Loopback",
    "105": "IEEE 802.11 (Wi-Fi)",
    "106": "IEEE 802.11 + Radio",
    "107": "IEEE 802.11 + AVS",
    "108": "Linux Cooked Capture",
    "109": "Apple LocalTalk",
    "112": "Cisco HDLC",
    "113": "Linux Cooked Capture v1",
    "117": "OpenBSD pflog",
    "119": "Cisco IOS",
    "127": "IEEE 802.11 + Radiotap",
    "143": "DOCSIS",
    "147": "MTP2 with pseudo-header",
    "148": "PPP with direction",
    "162": "IEEE 802.16 MAC Common Part Sublayer",
    "165": "USB (Linux)",
    "166": "Bluetooth H4",
    "169": "IEEE 802.15.4",
    "177": "WTAP_ENCAP_USER0",
    "187": "MiNT",
    "188": "Bluetooth HCI H4 with phdr",
    "189": "AX.25 with KISS",
    "192": "MPLS",
    "195": "TZSP",
    "203": "Juniper Ethernet",
    "209": "ERF Ethernet",
    "220": "Bluetooth Linux Monitor",
    "224": "NetAna ",
    "227": "nflog",
    "228": "Netlink",
    "229": "USB w/USB header (Linux)",
    "249": "DECT",
    "252": "CAN 2.0b",
    "253": "ZWAVE-R1-R2",
    "254": "IPv4",
    "255": "IPv6",
}


def get_link_layer_type(file_path: str) -> dict:

    result = {
        "primary": "Unknown",
        "all": [],
        "raw_codes": [],
    }

    # --- capinfos ---
    try:
        out = subprocess.run(
            ["capinfos", "-t", file_path],
            capture_output=True, text=True, timeout=30
        )
        for line in out.stdout.splitlines():
            line = line.strip()
            if line.lower().startswith("data link type"):
                # e.g.  "Data link type:   Ethernet"
                dl_type = line.split(":", 1)[1].strip()
                if dl_type:
                    result["primary"] = dl_type
                    result["all"] = [dl_type]
                    return result
    except Exception:
        pass

    # --- tshark first-200-packets ---
    try:
        out = subprocess.run(
            [
                "tshark", "-r", file_path,
                "-c", "200",
                "-T", "fields",
                "-e", "frame.encap_type",
            ],
            capture_output=True, text=True, timeout=30
        )
        codes: Counter = Counter()
        for line in out.stdout.splitlines():
            v = line.strip()
            if v:
                codes[v] += 1

        if codes:
            unique_codes = [c for c, _ in codes.most_common()]
            result["raw_codes"] = [int(c) for c in unique_codes if c.isdigit()]
            result["all"] = [ENCAP_TYPES.get(c, f"Type {c}") for c in unique_codes]
            result["primary"] = result["all"][0] if result["all"] else "Unknown"
    except Exception:
        pass

    return result


# ============================================================
# ARP ANALYSIS
# ============================================================

def analyze_arp(file_path: str) -> dict:

    empty = {
        "total_arp_packets": 0,
        "arp_requests": 0,
        "arp_replies": 0,
        "request_reply_ratio": 0.0,
        "top_requesters": [],
        "ip_mac_map": {},
        "gratuitous_arp_count": 0,
        "potential_spoofing": [],
    }

    try:
        out = subprocess.run(
            [
                "tshark", "-r", file_path,
                "-Y", "arp",
                "-T", "fields",
                "-E", "separator=|",
                "-e", "arp.opcode",
                "-e", "arp.src.proto_ipv4",
                "-e", "arp.dst.proto_ipv4",
                "-e", "arp.src.hw_mac",
                "-e", "arp.dst.hw_mac",
            ],
            capture_output=True, text=True, timeout=120
        )

        total = 0
        requests = 0
        replies = 0
        gratuitous = 0
        requesters: Counter = Counter()
        ip_mac_map: dict = defaultdict(set)

        for line in out.stdout.splitlines():
            parts = line.strip().split("|")
            if len(parts) < 4:
                continue
            opcode, src_ip, dst_ip, src_mac = (parts + [""] * 5)[:5]
            opcode = opcode.strip()
            src_ip  = src_ip.strip()
            dst_ip  = dst_ip.strip()
            src_mac = src_mac.strip().lower()

            total += 1

            if opcode == "1":   # ARP Request
                requests += 1
                if src_ip:
                    requesters[src_ip] += 1
                if src_ip and dst_ip and src_ip == dst_ip:
                    gratuitous += 1
            elif opcode == "2":  # ARP Reply
                replies += 1

            if src_ip and src_mac:
                ip_mac_map[src_ip].add(src_mac)

        rr_ratio = round(requests / replies, 2) if replies > 0 else float(requests)

        spoofing = [
            {"ip": ip, "macs": sorted(macs)}
            for ip, macs in ip_mac_map.items()
            if len(macs) > 1
        ]

        return {
            "total_arp_packets": total,
            "arp_requests": requests,
            "arp_replies": replies,
            "request_reply_ratio": rr_ratio,
            "top_requesters": requesters.most_common(20),
            "ip_mac_map": {ip: sorted(macs) for ip, macs in ip_mac_map.items()},
            "gratuitous_arp_count": gratuitous,
            "potential_spoofing": spoofing,
        }

    except Exception as e:
        print("[ARP ERROR]", e)
        return empty


# ============================================================
# VLAN ANALYSIS
# ============================================================

def analyze_vlan(file_path: str) -> dict:
    empty = {
        "total_tagged_frames": 0,
        "total_untagged_frames": 0,
        "unique_vlan_count": 0,
        "vlan_distribution": [],
        "double_tagged_frames": 0,
        "top_vlans": [],
    }

    try:
        out = subprocess.run(
            [
                "tshark", "-r", file_path,
                "-Y", "vlan",
                "-T", "fields",
                "-E", "separator=|",
                "-e", "vlan.id",
                "-e", "vlan.priority",
            ],
            capture_output=True, text=True, timeout=120
        )

        total_tagged = 0
        double_tagged = 0
        vlan_counter: Counter = Counter()

        for line in out.stdout.splitlines():
            parts = line.strip().split("|")
            if not parts:
                continue
            vlan_id_field = parts[0].strip()
            if not vlan_id_field:
                continue

            total_tagged += 1

            ids = [v.strip() for v in vlan_id_field.split(",") if v.strip()]
            if len(ids) > 1:
                double_tagged += 1

            for vid in ids:
                try:
                    vlan_counter[int(vid)] += 1
                except ValueError:
                    pass

        dist = sorted(vlan_counter.items())
        top = vlan_counter.most_common(10)

        return {
            "total_tagged_frames": total_tagged,
            "total_untagged_frames": 0,
            "unique_vlan_count": len(vlan_counter),
            "vlan_distribution": [[vid, cnt] for vid, cnt in dist],
            "double_tagged_frames": double_tagged,
            "top_vlans": [[vid, cnt] for vid, cnt in top],
        }

    except Exception as e:
        print("[VLAN ERROR]", e)
        return empty


# ============================================================
# STP ANALYSIS
# ============================================================

def analyze_stp(file_path: str) -> dict:
    empty = {
        "total_bpdus": 0,
        "root_bridge": None,
        "topology_changes": 0,
        "topology_change_notifications": 0,
        "unique_bridges": 0,
        "bridge_bpdu_counts": [],
    }

    try:
        out = subprocess.run(
            [
                "tshark", "-r", file_path,
                "-Y", "stp",
                "-T", "fields",
                "-E", "separator=|",
                "-e", "stp.root.hw",
                "-e", "stp.root.priority",
                "-e", "stp.bridge.hw",
                "-e", "stp.bridge.priority",
                "-e", "stp.flags.tc",
                "-e", "stp.flags.tcn",
            ],
            capture_output=True, text=True, timeout=60
        )

        total = 0
        tc_count = 0
        tcn_count = 0
        root_candidates: Counter = Counter()
        bridge_counter: Counter = Counter()

        for line in out.stdout.splitlines():
            parts = (line.strip().split("|") + [""] * 6)[:6]
            root_mac, root_pri, bridge_mac, bridge_pri, tc_flag, tcn_flag = parts

            root_mac   = root_mac.strip()
            root_pri   = root_pri.strip()
            bridge_mac = bridge_mac.strip()
            tc_flag    = tc_flag.strip()
            tcn_flag   = tcn_flag.strip()

            total += 1

            if root_mac:
                root_candidates[(root_mac, root_pri)] += 1

            if bridge_mac:
                bridge_counter[bridge_mac] += 1

            if tc_flag == "1":
                tc_count += 1
            if tcn_flag == "1":
                tcn_count += 1

        root_bridge = None
        if root_candidates:
            top_root, _ = root_candidates.most_common(1)[0]
            root_mac, root_pri = top_root
            try:
                root_bridge = {"mac": root_mac, "priority": int(root_pri)}
            except Exception:
                root_bridge = {"mac": root_mac, "priority": None}

        return {
            "total_bpdus": total,
            "root_bridge": root_bridge,
            "topology_changes": tc_count,
            "topology_change_notifications": tcn_count,
            "unique_bridges": len(bridge_counter),
            "bridge_bpdu_counts": [[m, c] for m, c in bridge_counter.most_common(20)],
        }

    except Exception as e:
        print("[STP ERROR]", e)
        return empty


# ============================================================
# SCTP ANALYSIS
# ============================================================

def analyze_sctp(file_path: str) -> dict:

    CHUNK_TYPES = {
        "0": "DATA", "1": "INIT", "2": "INIT_ACK", "3": "SACK",
        "4": "HEARTBEAT", "5": "HEARTBEAT_ACK", "6": "ABORT",
        "7": "SHUTDOWN", "8": "SHUTDOWN_ACK", "9": "ERROR",
        "10": "COOKIE_ECHO", "11": "COOKIE_ACK", "14": "SHUTDOWN_COMPLETE",
        "192": "FORWARD_TSN", "130": "ASCONF", "128": "ASCONF_ACK",
    }

    empty = {
        "total_sctp_packets": 0,
        "unique_associations": 0,
        "top_src_ports": [],
        "top_dst_ports": [],
        "chunk_type_distribution": {},
        "multihomed_associations": 0,
    }

    try:
        out = subprocess.run(
            [
                "tshark", "-r", file_path,
                "-Y", "sctp",
                "-T", "fields",
                "-E", "separator=|",
                "-e", "sctp.srcport",
                "-e", "sctp.dstport",
                "-e", "sctp.verification_tag",
                "-e", "ip.src",
                "-e", "sctp.chunk_type",
            ],
            capture_output=True, text=True, timeout=120
        )

        total = 0
        src_ports: Counter = Counter()
        dst_ports: Counter = Counter()
        chunk_types: Counter = Counter()
        vtag_srcs: dict = defaultdict(set)

        for line in out.stdout.splitlines():
            parts = (line.strip().split("|") + [""] * 5)[:5]
            sport, dport, vtag, src_ip, chunk = parts

            sport  = sport.strip()
            dport  = dport.strip()
            vtag   = vtag.strip()
            src_ip = src_ip.strip()
            chunk  = chunk.strip()

            if not sport and not dport:
                continue

            total += 1

            if sport:
                src_ports[sport] += 1
            if dport:
                dst_ports[dport] += 1

            if vtag and src_ip:
                vtag_srcs[vtag].add(src_ip)

            if chunk:
                for ct in chunk.split(","):
                    ct = ct.strip()
                    label = CHUNK_TYPES.get(ct, f"Type_{ct}")
                    chunk_types[label] += 1

        multihomed = sum(1 for ips in vtag_srcs.values() if len(ips) > 1)

        return {
            "total_sctp_packets": total,
            "unique_associations": len(vtag_srcs),
            "top_src_ports": [[p, c] for p, c in src_ports.most_common(20)],
            "top_dst_ports": [[p, c] for p, c in dst_ports.most_common(20)],
            "chunk_type_distribution": dict(chunk_types),
            "multihomed_associations": multihomed,
        }

    except Exception as e:
        print("[SCTP ERROR]", e)
        return empty


# ============================================================
# COMBINED ENTRY POINT
# ============================================================

def run_layer2_analysis(file_path: str) -> dict:
    link_layer = get_link_layer_type(file_path)
    arp        = analyze_arp(file_path)
    vlan       = analyze_vlan(file_path)
    stp        = analyze_stp(file_path)
    sctp       = analyze_sctp(file_path)

    return {
        "link_layer": link_layer,
        "arp_analysis": arp,
        "vlan_analysis": vlan,
        "stp_analysis": stp,
        "sctp_analysis": sctp,
    }
