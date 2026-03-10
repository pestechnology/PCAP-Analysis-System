FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    tshark \
    tcpdump \
    wireshark-common \
    suricata \
    suricata-update \
    && rm -rf /var/lib/apt/lists/*

# Install Suricata rules
RUN suricata-update

# Copy entire project into container
COPY . /app

# Install backend requirements
RUN pip install --no-cache-dir -r backend/requirements.txt

# Add project root to python path
ENV PYTHONPATH=/app

# IMPORTANT: main is inside backend folder
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]