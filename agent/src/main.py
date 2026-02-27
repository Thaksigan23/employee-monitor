import time
from datetime import datetime, timedelta

from auth import login, load_token
from activity import start_listeners, get_activity_snapshot
from window import get_active_window_title
from privacy import mask_if_private
from api import send_activity


# ---- Tunable thresholds ----
IDLE_THRESHOLD_MINUTES = 5
SUSPICIOUS_THRESHOLD_MINUTES = 10
POLL_INTERVAL_SECONDS = 60


def main():
    # 🔐 Ensure logged in first
    auth_data = load_token()

    if not auth_data:
        auth_data = login()
        if not auth_data:
            print("❌ Cannot start agent without login.")
            return

    user = auth_data["user"]
    print(f"👤 Logged in as: {user['email']}")
    print("🟢 Agent started...")

    start_listeners()

    now = datetime.now()
    last_real_input_time = now
    last_click_time = now
    last_key_time = now
    last_window_change_time = now
    last_window_title = ""

    while True:
        snapshot = get_activity_snapshot()
        now = datetime.now()

        # Update times based on activity
        if snapshot["mouse_moved"] or snapshot["mouse_clicked"] or snapshot["key_pressed"]:
            last_real_input_time = now

        if snapshot["mouse_clicked"]:
            last_click_time = now

        if snapshot["key_pressed"]:
            last_key_time = now

        # Get active window
        title = get_active_window_title()
        title, is_private = mask_if_private(title)

        if title != last_window_title:
            last_window_title = title
            last_window_change_time = now

        # ---- Decide status ----
        idle_time = now - last_real_input_time
        since_click = now - last_click_time
        since_key = now - last_key_time
        since_window_change = now - last_window_change_time

        status = "Active"

        if idle_time > timedelta(minutes=IDLE_THRESHOLD_MINUTES):
            status = "Idle"
        else:
            # Suspicious: no interaction for long time
            if (
                since_click > timedelta(minutes=SUSPICIOUS_THRESHOLD_MINUTES)
                and since_key > timedelta(minutes=SUSPICIOUS_THRESHOLD_MINUTES)
                and since_window_change > timedelta(minutes=SUSPICIOUS_THRESHOLD_MINUTES)
            ):
                status = "Suspicious"

        # ✅ IMPORTANT: No employeeId anymore
        payload = {
            "status": status,
            "windowTitle": title,
            "isPrivate": is_private,
        }

        print("Sending:", payload)
        send_activity(payload)

        time.sleep(POLL_INTERVAL_SECONDS)


if __name__ == "__main__":
    main()