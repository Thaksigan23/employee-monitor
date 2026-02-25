import time
from activity import start_listeners, get_activity_status
from window import get_active_window_title
from privacy import mask_if_private
from anti_jiggler import check_suspicious
from api import send_activity

EMPLOYEE_ID = "emp001"

def main():
    print("🟢 Agent started...")
    start_listeners()

    while True:
        active, clicks = get_activity_status()

        title = get_active_window_title()
        title, is_private = mask_if_private(title)

        suspicious = check_suspicious(clicks)

        if suspicious:
            status = "Suspicious"
        else:
            status = "Active" if active else "Idle"

        payload = {
            "employeeId": EMPLOYEE_ID,
            "status": status,
            "windowTitle": title,
            "isPrivate": is_private
        }

        print("Sending:", payload)
        send_activity(payload)

        time.sleep(60)  # wait 60 seconds

if __name__ == "__main__":
    main()