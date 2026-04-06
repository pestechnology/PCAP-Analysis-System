import sys
import orjson
from backend.main import get_http_stream

def test():
    # Attempt to call get_http_stream directly
    try:
        res = get_http_stream("test_job_id", "0")
        print("Success:", res)
    except Exception as e:
        print("Expected failure (no test_job_id):", e)
        
if __name__ == "__main__":
    test()
