import requests
import os
from datetime import datetime, timedelta

# ======================================================
# CONFIG
# ======================================================

VT_API_KEY = os.getenv("VT_API_KEY")
VT_BASE_URL = "https://www.virustotal.com/api/v3"

# Simple in-memory cache
CACHE_TTL_MINUTES = 60
_reputation_cache = {}


# ======================================================
# HELPER: Cache Handling
# ======================================================

def _get_cached(key):
    if key in _reputation_cache:
        entry = _reputation_cache[key]
        if datetime.utcnow() < entry["expiry"]:
            return entry["data"]
        else:
            del _reputation_cache[key]
    return None


def _set_cache(key, data):
    _reputation_cache[key] = {
        "data": data,
        "expiry": datetime.utcnow() + timedelta(minutes=CACHE_TTL_MINUTES)
    }


# ======================================================
# NORMALIZATION
# ======================================================

def _normalize_vt_response(stats):
    malicious = stats.get("malicious", 0)
    suspicious = stats.get("suspicious", 0)
    harmless = stats.get("harmless", 0)
    undetected = stats.get("undetected", 0)

    total = malicious + suspicious + harmless + undetected

    if total == 0:
        score = 0
    else:
        score = round((malicious + suspicious) / total * 100)

    if malicious > 0:
        risk_level = "high"
    elif suspicious > 0:
        risk_level = "medium"
    else:
        risk_level = "low"

    return {
        "malicious": malicious,
        "suspicious": suspicious,
        "harmless": harmless,
        "undetected": undetected,
        "score": score,
        "risk_level": risk_level
    }


# ======================================================
# IP Reputation
# ======================================================

def check_ip_reputation(ip):

    cache_key = f"ip:{ip}"
    cached = _get_cached(cache_key)
    if cached:
        return cached

    if not VT_API_KEY:
        return {"error": "VT_API_KEY not configured"}

    headers = {
        "x-apikey": VT_API_KEY
    }

    response = requests.get(
        f"{VT_BASE_URL}/ip_addresses/{ip}",
        headers=headers
    )

    if response.status_code != 200:
        return {
            "error": "VirusTotal request failed",
            "status": response.status_code
        }

    data = response.json()
    stats = data["data"]["attributes"]["last_analysis_stats"]

    normalized = _normalize_vt_response(stats)

    _set_cache(cache_key, normalized)

    return normalized


# ======================================================
# Domain Reputation
# ======================================================

def check_domain_reputation(domain):

    cache_key = f"domain:{domain}"
    cached = _get_cached(cache_key)
    if cached:
        return cached

    headers = {"x-apikey": VT_API_KEY}

    response = requests.get(
        f"{VT_BASE_URL}/domains/{domain}",
        headers=headers
    )

    if response.status_code != 200:
        return {
            "error": "VirusTotal request failed",
            "status": response.status_code
        }

    data = response.json()
    stats = data["data"]["attributes"]["last_analysis_stats"]

    normalized = _normalize_vt_response(stats)

    _set_cache(cache_key, normalized)

    return normalized


# ======================================================
# URL Reputation
# ======================================================

def check_url_reputation(url):

    cache_key = f"url:{url}"
    cached = _get_cached(cache_key)
    if cached:
        return cached

    headers = {"x-apikey": VT_API_KEY}

    # URLs must be encoded
    response = requests.post(
        f"{VT_BASE_URL}/urls",
        headers=headers,
        data={"url": url}
    )

    if response.status_code not in (200, 201):
        return {
            "error": "VirusTotal request failed",
            "status": response.status_code
        }

    url_id = response.json()["data"]["id"]

    # Retrieve analysis result
    result = requests.get(
        f"{VT_BASE_URL}/analyses/{url_id}",
        headers=headers
    )

    if result.status_code != 200:
        return {
            "error": "Failed retrieving analysis result"
        }

    stats = result.json()["data"]["attributes"]["stats"]

    normalized = _normalize_vt_response(stats)

    _set_cache(cache_key, normalized)

    return normalized
