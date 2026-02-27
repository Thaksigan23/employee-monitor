import requests
from auth import load_token

API_URL = "http://localhost:5000/api/activity"


def send_activity(payload):
    auth_data = load_token()

    if not auth_data:
        print("❌ No token found. Please login first.")
        return

    token = auth_data["token"]

    try:
        response = requests.post(
            API_URL,
            json=payload,
            headers={
                "Authorization": f"Bearer {token}"
            }
        )

        if response.status_code != 200:
            print("❌ Failed to send:", response.text)

    except Exception as e:
        print("❌ Connection error:", e)