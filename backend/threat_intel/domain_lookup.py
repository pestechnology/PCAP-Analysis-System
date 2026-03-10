import re
from .feed_manager import load_feed

malicious_domains = load_feed()

def normalize(domain):
    domain = domain.lower().strip()
    domain = re.sub(r"^www\.", "", domain)
    return domain

def check_domain(domain):
    domain = normalize(domain)

    if domain in malicious_domains:
        return "malicious"

    return "clean"