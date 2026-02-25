import requests

BACKEND_URL = "http://localhost:5000/api/activity"

def send_activity(payload: dict):
    try:
        r = requests.post(BACKEND_URL, json=payload, timeout=5)
        return r.status_code == 201
    except Exception as e:
        print("❌ Failed to send activity:", e)
        return False