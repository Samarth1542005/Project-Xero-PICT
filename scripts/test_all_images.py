import os
import requests
import json
import time

API_URL = "http://localhost:8000/detect/image"

TEST_CASES = [
    {
        "expected_label": "fake",
        "path": r"C:\Users\Atharv\Downloads\test1.jpeg"
    },
    {
        "expected_label": "fake",
        "path": r"C:\Users\Atharv\Downloads\test2.jpg.jpeg"
    },
    {
        "expected_label": "real",
        "path": r"C:\Users\Atharv\Downloads\Atharv.jpeg"
    },
    {
        "expected_label": "real",
        "path": r"C:\Users\Atharv\Downloads\samarth.jpeg"
    },
    {
        "expected_label": "real",
        "path": r"C:\Users\Atharv\Downloads\test5.jpg"
    },
    {
        "expected_label": "fake",
        "path": r"C:\Users\Atharv\Downloads\elon.jpg"
    },
    {
        "expected_label": "fake",
        "path": r"C:\Users\Atharv\Downloads\test6_video.mp4"
    },
    {
        "expected_label": "fake",
        "path": r"C:\Users\Atharv\Downloads\test7_video.mp4"
    },
    {
        "expected_label": "real",
        "path": r"C:\Users\Atharv\Downloads\test8_video.mp4"
    }
]

def main():
    print("="*60)
    print("🚀 AUTOMATED PIPELINE TEST: PROJECT XERO PICT")
    print("="*60 + "\n")

    for case in TEST_CASES:
        path = case["path"]
        expected = case["expected_label"].upper()
        
        print(f"Testing File: {os.path.basename(path)}")
        print(f"Expected O/P: [{expected}]")
        
        if not os.path.exists(path):
            print("❌ Error: File not found exactly at that path. Skipping...\n")
            continue
            
        try:
            is_video = path.lower().endswith('.mp4')
            endpoint = "http://localhost:8000/detect/video" if is_video else "http://localhost:8000/detect/image"
            mime_type = 'video/mp4' if is_video else 'image/jpeg'
            
            with open(path, 'rb') as f:
                files = {'file': (os.path.basename(path), f, mime_type)}
                response = requests.post(endpoint, files=files)
            
            if response.status_code == 200:
                data = response.json()
                verdict = data.get("verdict", {})
                label = verdict.get("label", "Unknown").upper()
                confidence = verdict.get("percentage", "N/A")
                
                print(f"AI O/P:       [{label}] with {confidence} confidence.")
                
            else:
                print(f"❌ Server Error: HTTP {response.status_code}")
                # Print only first 150 chars of error to avoid massive crash dumps
                print(response.text[:150])
                
        except requests.exceptions.ConnectionError:
            print("❌ Connection Error: Is the FastAPI backend running on port 8000?")
        except Exception as e:
            print(f"❌ Unexpected Error: {str(e)}")
            
        print("-" * 60)

if __name__ == "__main__":
    main()
