import os
import io
import time
import threading
from PIL import ImageGrab
from window import get_active_window_title
from api import send_screenshot

SCREENSHOT_INTERVAL = 5 * 60 # Take a screenshot every 5 minutes

def take_screenshot():
    """Takes a screenshot, compresses it, and sends it to the server."""
    try:
        # Capture screenshot
        screenshot = ImageGrab.grab()
        
        # Compress image
        img_byte_arr = io.BytesIO()
        # Save as JPEG with reduced quality to save bandwidth
        screenshot.convert('RGB').save(img_byte_arr, format='JPEG', quality=60)
        img_byte_arr.seek(0)

        window_title = get_active_window_title()

        # Send to server
        send_screenshot(img_byte_arr.read(), window_title)
        print(f"📸 Screenshot taken and uploaded! Active Window: {window_title}")
    except Exception as e:
        print("⚠️ Failed to take screenshot:", e)

def screenshot_worker():
    while True:
        take_screenshot()
        time.sleep(SCREENSHOT_INTERVAL)

def start_screenshot_monitor():
    """Starts the background thread for periodic screenshots."""
    thread = threading.Thread(target=screenshot_worker, daemon=True)
    thread.start()
    print("📸 Screenshot monitor started.")
