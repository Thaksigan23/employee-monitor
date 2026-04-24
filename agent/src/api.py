import os
import requests
from auth import load_token
from dotenv import load_dotenv

load_dotenv()

BASE_URL = os.environ.get("API_BASE_URL", "http://localhost:5000/api")
API_URL = f"{BASE_URL}/activity"
TASKS_URL = f"{BASE_URL}/tasks"


def _get_token():
    auth_data = load_token()
    if not auth_data:
        return None
    return auth_data["token"]


def send_activity(payload):
    token = _get_token()

    if not token:
        print("❌ No token found. Please login first.")
        return

    try:
        response = requests.post(
            API_URL,
            json=payload,
            headers={
                "Authorization": f"Bearer {token}"
            }
        )

        if response.status_code != 200 and response.status_code != 201:
            print("❌ Failed to send:", response.text)

    except Exception as e:
        print("❌ Connection error:", e)


def check_pending_tasks():
    """Fetch unread tasks assigned by admin."""
    token = _get_token()
    if not token:
        return []

    try:
        response = requests.get(
            f"{TASKS_URL}/pending",
            headers={
                "Authorization": f"Bearer {token}"
            }
        )

        if response.status_code == 200:
            return response.json()
        return []

    except Exception:
        return []


def acknowledge_task(task_id):
    """Mark a task as read so it doesn't pop up again."""
    token = _get_token()
    if not token:
        return

    try:
        requests.put(
            f"{TASKS_URL}/{task_id}/acknowledge",
            headers={
                "Authorization": f"Bearer {token}"
            }
        )
    except Exception:
        pass


# ---- Chat integration ----
CHAT_URL = f"{BASE_URL}/chat"

# Track the last message ID we've seen so we don't re-notify
_last_seen_msg_id = None


def check_new_messages():
    """Check for unread chat messages and return them."""
    global _last_seen_msg_id
    token = _get_token()
    if not token:
        return []

    try:
        # Get chat list to see if there are unread messages
        response = requests.get(
            f"{CHAT_URL}/list",
            headers={"Authorization": f"Bearer {token}"}
        )

        if response.status_code != 200:
            return []

        chat_list = response.json()
        new_messages = []

        for chat in chat_list:
            if chat.get("unreadCount", 0) > 0:
                partner = chat.get("user", {})
                last_msg = chat.get("lastMessage", {})
                if last_msg:
                    msg_id = f"{partner.get('_id')}_{last_msg.get('createdAt')}"
                    if msg_id != _last_seen_msg_id:
                        _last_seen_msg_id = msg_id
                        new_messages.append({
                            "from": partner.get("email", "Unknown"),
                            "text": last_msg.get("text", ""),
                            "unread": chat["unreadCount"],
                        })

        return new_messages

    except Exception:
        return []


# ---- Announcements integration ----
ANNOUNCEMENTS_URL = f"{BASE_URL}/announcements"


def check_announcements():
    """Fetch unread announcements."""
    token = _get_token()
    if not token:
        return []

    try:
        response = requests.get(
            f"{ANNOUNCEMENTS_URL}/unread",
            headers={"Authorization": f"Bearer {token}"}
        )

        if response.status_code == 200:
            return response.json()
        return []

    except Exception:
        return []


def mark_announcement_read(announcement_id):
    """Mark an announcement as read."""
    token = _get_token()
    if not token:
        return

    try:
        requests.put(
            f"{ANNOUNCEMENTS_URL}/{announcement_id}/read",
            headers={"Authorization": f"Bearer {token}"}
        )
    except Exception:
        pass


# ---- Security and Screenshots ----
def send_security_alert(alert_type, details):
    token = _get_token()
    if not token: return
    try:
        requests.post(
            f"{BASE_URL}/security",
            json={"type": alert_type, "details": details},
            headers={"Authorization": f"Bearer {token}"}
        )
    except Exception:
        pass

def send_screenshot(image_bytes, window_title):
    token = _get_token()
    if not token: return
    try:
        files = {'image': ('screenshot.jpg', image_bytes, 'image/jpeg')}
        data = {'windowTitle': windowTitle}
        requests.post(
            f"{BASE_URL}/screenshots",
            files=files,
            data=data,
            headers={"Authorization": f"Bearer {token}"}
        )
    except Exception:
        pass