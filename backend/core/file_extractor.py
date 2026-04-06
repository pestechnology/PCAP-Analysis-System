import subprocess
import os
import shutil
import tempfile
import uuid

def extract_files_metadata(file_path):
    """
    Extracts files from PCAP (HTTP, SMB) to a temporary directory,
    records their metadata, and deletes them immediately.
    """
    extracted_files = []
    temp_dir = tempfile.mkdtemp(prefix="pcap_extract_")
    
    protocols = ["http", "smb", "dicom", "tftp"]
    
    try:
        for proto in protocols:
            cmd = [
                "tshark",
                "-r", file_path,
                "-q",
                "--export-objects", f"{proto},{temp_dir}"
            ]

            subprocess.run(
                cmd, 
                stdout=subprocess.DEVNULL, 
                stderr=subprocess.DEVNULL,
                timeout=300
            )
            
            # Check for extracted files
            if os.path.exists(temp_dir):
                for filename in os.listdir(temp_dir):
                    filepath = os.path.join(temp_dir, filename)
                    if os.path.isfile(filepath):
                        size_bytes = os.path.getsize(filepath)
                        # Skip empty files
                        if size_bytes > 0:
                            extracted_files.append({
                                "filename": filename,
                                "size_bytes": size_bytes,
                                "protocol": proto.upper()
                            })
                        # Delete file immediately
                        os.remove(filepath)
                        
    except Exception as e:
        print(f"File extraction failed: {e}")
    finally:
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir, ignore_errors=True)
            
    unique_files = []
    seen = set()
    for f in extracted_files:
        key = (f["filename"], f["size_bytes"])
        if key not in seen:
            seen.add(key)
            unique_files.append(f)
            
    unique_files.sort(key=lambda x: x["size_bytes"], reverse=True)
    
    return unique_files[:100]
