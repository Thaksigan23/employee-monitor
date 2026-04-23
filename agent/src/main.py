import time
import threading
from datetime import datetime, timedelta

from auth import login, load_token
from activity import start_listeners, get_activity_snapshot
from window import get_active_window_title
from privacy import mask_if_private
from api import send_activity, check_pending_tasks, acknowledge_task, check_new_messages, check_announcements, mark_announcement_read


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

        # ---- Check for admin tasks ----
        try:
            tasks = check_pending_tasks()
            for task in tasks:
                sender_email = task.get("sender", {}).get("email", "Admin")
                message = task.get("message", "")
                task_id = task.get("_id")

                print(f"📩 New task from {sender_email}: {message}")

                # Show popup in a separate thread so it doesn't block monitoring
                def show_popup(s=sender_email, m=message, tid=task_id):
                    import tkinter as tk
                    from tkinter import messagebox
                    root = tk.Tk()
                    root.withdraw()
                    messagebox.showinfo(
                        "📩 New Task from Admin",
                        f"From: {s}\n\n{m}"
                    )
                    root.destroy()
                    # Mark as read after employee sees it
                    acknowledge_task(tid)

                popup_thread = threading.Thread(target=show_popup, daemon=True)
                popup_thread.start()

        except Exception as e:
            print("⚠️ Task check error:", e)

        # ---- Check for new chat messages ----
        try:
            new_msgs = check_new_messages()
            for msg in new_msgs:
                sender = msg["from"]
                text = msg["text"]
                unread = msg["unread"]

                print(f"💬 New message from {sender}: {text}")

                def show_chat_popup(s=sender, t=text, u=unread):
                    import tkinter as tk
                    from tkinter import messagebox
                    root = tk.Tk()
                    root.withdraw()
                    messagebox.showinfo(
                        f"💬 New Message ({u} unread)",
                        f"From: {s}\n\n{t}\n\nOpen the dashboard to reply."
                    )
                    root.destroy()

                popup_thread = threading.Thread(target=show_chat_popup, daemon=True)
                popup_thread.start()

        except Exception as e:
            print("⚠️ Chat check error:", e)

        # ---- Check for announcements ----
        try:
            announcements = check_announcements()
            for ann in announcements:
                title = ann.get("title", "Announcement")
                message = ann.get("message", "")
                priority = ann.get("priority", "normal")
                ann_id = ann.get("_id")
                sender = ann.get("sender", {}).get("email", "Admin")

                print(f"📢 Announcement from {sender}: {title}")

                def show_announcement(t=title, m=message, p=priority, s=sender, aid=ann_id):
                    import tkinter as tk
                    from tkinter import messagebox
                    root = tk.Tk()
                    root.withdraw()
                    icon = "🔴 URGENT" if p == "urgent" else "📢"
                    messagebox.showinfo(
                        f"{icon} Company Announcement",
                        f"{t}\n\n{m}\n\n— {s}"
                    )
                    root.destroy()
                    mark_announcement_read(aid)

                popup_thread = threading.Thread(target=show_announcement, daemon=True)
                popup_thread.start()

        except Exception as e:
            print("⚠️ Announcement check error:", e)

        time.sleep(POLL_INTERVAL_SECONDS)


if __name__ == "__main__":
    main()