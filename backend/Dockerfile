FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    tshark \
    tcpdump \
    wireshark-common \
    suricata \
    suricata-update \
    && rm -rf /var/lib/apt/lists/*

RUN suricata-update

COPY . /app

RUN pip install --no-cache-dir --timeout 300 -r backend/requirements.txt

ENV PYTHONPATH=/app

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]