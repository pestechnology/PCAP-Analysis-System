import os
import shutil
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from backend.services.threat_intel import check_ip_reputation
from backend.utils.system_info import get_host_system_info
from backend.core.analysis_recommender import AnalysisRecommender
from backend.analysis_engine import analyze_parallel, analysis_progress
from backend.utils.file_validation import validate_pcap_file

try:
    from core.pipeline import AnalysisPipeline
    USE_PIPELINE = True
except ImportError:
    USE_PIPELINE = False


VT_API_KEY = os.getenv("VT_API_KEY", "YOUR_API_KEY")

app = FastAPI(title="PCAP Analysis Tool")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/system-info")
def system_info():
    return get_host_system_info()

@app.post("/recommend-analysis")
async def recommend_analysis(file: UploadFile = File(...)):

    temp_path = f"temp_{file.filename}"

    with open(temp_path, "wb") as buffer:
        buffer.write(await file.read())

    try:
        validate_pcap_file(temp_path, file.filename)
    except ValueError as e:
        os.remove(temp_path)
        raise HTTPException(status_code=400, detail=str(e))

    recommender = AnalysisRecommender(temp_path)
    recommendation = recommender.recommend()

    recommendation["file_path"] = temp_path

    return recommendation

@app.post("/analyze-recommended")
async def analyze_recommended(file_path: str, chunk_packets: int = None):

    job_id, results = analyze_parallel(file_path, chunk_packets)

    return {
        "job_id": job_id,
        **results
    }

@app.get("/analysis-progress/{job_id}")
def get_progress(job_id: str):
    return analysis_progress.get(job_id, {})

# ===============================
# PCAP ANALYSIS ENDPOINT
# ===============================
@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):

    file_path = f"/tmp/{file.filename}"

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        validate_pcap_file(file_path, file.filename)
    except ValueError as e:
        os.remove(file_path)
        return {"error": str(e)}

    job_id, results = analyze_parallel(file_path)

    return {
        "job_id": job_id,
        **results
    }

# ===============================
# IP ENRICHMENT (VirusTotal)
# ===============================
@app.get("/enrich/ip/{ip}")
def enrich_ip(ip: str):
    return check_ip_reputation(ip)
