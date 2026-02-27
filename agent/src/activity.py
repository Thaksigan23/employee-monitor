from pynput import keyboard
import threading

# -------------------------
# Shared State
# -------------------------
_state = {
    "key_pressed": False,
}

_lock = threading.Lock()
_keyboard_listener = None


# -------------------------
# Keyboard Handler
# -------------------------

def on_press(key):
    with _lock:
        _state["key_pressed"] = True


# -------------------------
# Start Listener
# -------------------------

def start_listeners():
    global _keyboard_listener

    try:
        _keyboard_listener = keyboard.Listener(on_press=on_press)
        _keyboard_listener.daemon = True
        _keyboard_listener.start()
        print("✅ Keyboard listener started")
        print("⚠️ Mouse listener disabled for Windows stability")
    except Exception as e:
        print("❌ Keyboard listener failed:", e)


# -------------------------
# Snapshot API
# -------------------------

def get_activity_snapshot():
    with _lock:
        snapshot = {
            "mouse_moved": False,     # Disabled
            "mouse_clicked": False,   # Disabled
            "key_pressed": _state["key_pressed"],
        }

        # Reset after reading
        _state["key_pressed"] = False

    return snapshot