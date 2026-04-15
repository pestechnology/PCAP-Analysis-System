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

from .domain_lookup import check_domain

MALICIOUS_TEST_DOMAINS = {
    "paste.ee",
    "malware.test",
    "evil.test"
}



def evaluate_domains(dns_queries, tls_sni_domains):

    alerts = []

    # DNS Detection
    for record in dns_queries:

        domain = record.get("query")

        if not domain:
            continue

        domain = domain.lower().strip().rstrip(".")

        if ":" in domain:
            domain = domain.split(":")[0]

        base_domain = ".".join(domain.split(".")[-2:])

        # Local test domains
        if base_domain in MALICIOUS_TEST_DOMAINS:
            alerts.append({
                "domain": domain,
                "source": "DNS",
                "classification": "malicious"
            })
            continue

        result = check_domain(domain)

        if result == "malicious":
            alerts.append({
                "domain": domain,
                "source": "DNS",
                "classification": "malicious"
            })



    # TLS SNI Detection
    for session in tls_sni_domains:

        if isinstance(session, dict):
            sni = session.get("server_name")
        else:
            sni = session

        if not sni:
            continue

        if sni in MALICIOUS_TEST_DOMAINS:
            alerts.append({
                "domain": sni,
                "source": "TLS-SNI",
                "classification": "malicious"
            })
            continue

        result = check_domain(sni)

        if result == "malicious":
            alerts.append({
                "domain": sni,
                "source": "TLS-SNI",
                "classification": "malicious"
            })

    return alerts