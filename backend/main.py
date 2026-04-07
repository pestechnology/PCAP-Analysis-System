import os
import shutil
import asyncio
import uuid
from concurrent.futures import ThreadPoolExecutor
from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse, ORJSONResponse
from backend.services.threat_intel import check_ip_reputation
from backend.utils.system_info import get_host_system_info
from backend.core.analysis_recommender import AnalysisRecommender
from backend.analysis_engine import analyze_parallel, analysis_progress
from backend.utils.file_validation import validate_pcap_file
from backend.core.report_builder import build_csv, build_pdf
from backend.core.chunk_splitter import split_pcap_by_size

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
    return {"job_id": job_id, **results}

@app.get("/analysis-progress/{job_id}")
def get_progress(job_id: str):
    return analysis_progress.get(job_id, {})

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
    return {"job_id": job_id, **results}

_thread_pool = ThreadPoolExecutor(max_workers=4)

def _start_analysis_job(file_path, jid, advanced=False):
    from backend.analysis_engine import analysis_progress
    analysis_progress[jid] = {
        "total_chunks": 1,
        "completed_chunks": 0,
        "status": "running",
        "current_stage": "Uploading and validating capture…",
        "percent": 2
    }
    def _run(jid, path):
        try:
            analyze_parallel(path, _job_id_override=jid)
        except Exception as e:
            analysis_progress[jid]["status"] = "error"
            analysis_progress[jid]["current_stage"] = f"Analysis failed: {e}"
    loop = asyncio.get_event_loop()
    loop.run_in_executor(_thread_pool, _run, jid, file_path)

@app.post("/analyze-async")
async def analyze_async(file: UploadFile = File(...), advanced: bool = Query(False)):
    file_path = f"/tmp/{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    try:
        validate_pcap_file(file_path, file.filename)
    except ValueError as e:
        os.remove(file_path)
        raise HTTPException(status_code=400, detail=str(e))
    job_id = str(uuid.uuid4())
    _start_analysis_job(file_path, job_id, advanced)
    return {"job_id": job_id}

@app.post("/upload/init")
async def upload_init(filename: str = Query(...)):
    upload_id = str(uuid.uuid4())
    safe_name = "".join([c for c in filename if c.isalnum() or c in "._-"])
    temp_path = f"/tmp/up_{upload_id}_{safe_name}"
    with open(temp_path, "wb") as f:
        pass
    return {"upload_id": upload_id}

@app.post("/upload/chunk")
async def upload_chunk(
    upload_id: str = Query(...),
    filename: str = Query(...),
    chunk_index: int = Query(...),
    file: UploadFile = File(...)
):
    safe_name = "".join([c for c in filename if c.isalnum() or c in "._-"])
    temp_path = f"/tmp/up_{upload_id}_{safe_name}"
    if not os.path.exists(temp_path):
        raise HTTPException(status_code=404, detail="Upload session not found")
    with open(temp_path, "ab") as f:
        shutil.copyfileobj(file.file, f)
    return {"status": "ok", "chunk": chunk_index}

@app.post("/upload/complete")
async def upload_complete(
    upload_id: str = Query(...),
    filename: str = Query(...),
    advanced: bool = Query(False)
):
    safe_name = "".join([c for c in filename if c.isalnum() or c in "._-"])
    temp_path = f"/tmp/up_{upload_id}_{safe_name}"
    if not os.path.exists(temp_path):
        raise HTTPException(status_code=404, detail="Upload file not found")
    try:
        validate_pcap_file(temp_path, filename)
    except ValueError as e:
        os.remove(temp_path)
        raise HTTPException(status_code=400, detail=str(e))
    job_id = str(uuid.uuid4())
    _start_analysis_job(temp_path, job_id, advanced)
    return {"job_id": job_id}

@app.get("/analysis-chunks/{job_id}")
def get_analysis_chunks(job_id: str):
    chunks = sorted([
        f for f in os.listdir("/tmp")
        if f.startswith(f"{job_id}_chunk")
    ])
    if not chunks:
        raise HTTPException(status_code=404, detail="No chunks found for this job ID")
    return {"job_id": job_id, "chunks": chunks}

@app.get("/download-chunk/{job_id}/{filename}")
def download_chunk(job_id: str, filename: str):
    if not filename.startswith(f"{job_id}_chunk"):
        raise HTTPException(status_code=403, detail="Security violation")
    path = f"/tmp/{filename}"
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Not found")
    def iterfile():
        with open(path, "rb") as f:
            yield from f
    return StreamingResponse(
        iterfile(),
        media_type="application/octet-stream",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@app.get("/analysis-result/{job_id}")
def get_analysis_result(job_id: str):
    from backend.analysis_engine import load_result_from_disk
    result = load_result_from_disk(job_id)
    if result is None:
        return JSONResponse(status_code=202, content={"status": "processing"})
    return ORJSONResponse(result)

@app.get("/api/http-stream/{job_id}/{stream_index}")
def get_http_stream(job_id: str, stream_index: str):
    import subprocess
    import orjson
    res_path = f"/tmp/{job_id}_result.json"
    if not os.path.exists(res_path):
        raise HTTPException(status_code=404, detail="Not found")
    with open(res_path, "rb") as f:
        data = orjson.loads(f.read())
    pcap_filename = data.get("_pcap_filename")
    if not pcap_filename:
        raise HTTPException(status_code=404, detail="Not found")
    pcap_path = f"/tmp/{pcap_filename}"
    if not os.path.exists(pcap_path):
        raise HTTPException(status_code=404, detail="Not found")
    cmd = [
        "tshark", "-r", pcap_path,
        "-q", "-z", f"follow,tcp,ascii,{stream_index}"
    ]
    try:
        out = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        return {"stream_index": stream_index, "data": out.stdout}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from pydantic import BaseModel
from typing import Any, Dict

class ExportRequest(BaseModel):
    format: str = "pdf"
    data: Dict[str, Any]

@app.post("/api/export-report")
def export_report(request: ExportRequest):
    data = request.data
    pcap_filename = data.get("_pcap_filename") or data.get("current_filename") or "capture.pcap"
    stem = pcap_filename.rsplit(".", 1)[0]
    try:
        if request.format == "csv":
            content = build_csv(data, pcap_filename)
            media_type = "text/csv; charset=utf-8"
            filename = f"pcap_report_{stem}.csv"
        else:
            content = build_pdf(data, pcap_filename)
            media_type = "application/pdf"
            filename = f"pcap_report_{stem}.pdf"
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed: {str(e)}")
    return StreamingResponse(
        iter([content]),
        media_type=media_type,
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Content-Length": str(len(content)),
        }
    )

@app.get("/enrich/ip/{ip}")
def enrich_ip(ip: str):
    return check_ip_reputation(ip)

@app.post("/split-pcap")
async def split_pcap_endpoint(file: UploadFile = File(...), prefix: str = Query(None)):
    split_id = str(uuid.uuid4().hex)[:8]
    ext = ".pcap"
    if file.filename.lower().endswith(".pcapng"): ext = ".pcapng"
    elif file.filename.lower().endswith(".cap"): ext = ".cap"
    
    # Sanitize custom prefix
    safe_prefix = None
    if prefix:
        safe_prefix = "".join([c for c in prefix if c.isalnum() or c in "._-"])[:50]
    
    safe_name = "".join([c for c in file.filename if c.isalnum() or c in "._-"])
    temp_path = f"/tmp/raw_{split_id}_{safe_name}"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    try:
        chunks = split_pcap_by_size(temp_path, size_limit_mb=600, custom_prefix=safe_prefix)
        final_chunks = []
        for c in chunks:
            new_path = f"{c}{ext}"
            os.rename(c, new_path)
            fname = os.path.basename(new_path)
            final_chunks.append({
                "original_filename": file.filename,
                "chunk_filename": fname,
                "download_url": f"/download-split/{fname}"
            })
        return {"status": "success", "chunks": final_chunks}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_path): os.remove(temp_path)

@app.get("/download-split/{filename:path}")
def download_split_file(filename: str):
    # Prevent path traversal by only allowing direct filenames (no slashes or dots)
    if "/" in filename or "\\" in filename or ".." in filename:
         raise HTTPException(status_code=403, detail="Security violation")
    
    # Ensure it's a known capture extension for safety
    exts = [".pcap", ".pcapng", ".cap", ".pcap.gz", ".pcapng.gz"]
    if not any(filename.lower().endswith(e) for e in exts):
         raise HTTPException(status_code=403, detail="Security violation: Invalid file type")
    path = f"/tmp/{filename}"
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Not found")
    def iterfile():
        with open(path, "rb") as f:
            yield from f
    return StreamingResponse(
        iterfile(),
        media_type="application/octet-stream",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )
