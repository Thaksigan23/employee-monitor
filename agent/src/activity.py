from pynput import mouse, keyboard
import threading
import time

# Shared state
_state = {
    "mouse_moved": False,
    "mouse_clicked": False,
    "key_pressed": False,
}

_lock = threading.Lock()


# ---- Mouse handlers ----
def on_move(x, y):
    with _lock:
        _state["mouse_moved"] = True


def on_click(x, y, button, pressed):
    if pressed:
        with _lock:
            _state["mouse_clicked"] = True
            _state["mouse_moved"] = True


# ---- Keyboard handler ----
def on_press(key):
    with _lock:
        _state["key_pressed"] = True


# ---- Start listeners ----
def start_listeners():
    try:
        mouse.Listener(on_move=on_move, on_click=on_click).start()
    except Exception as e:
        print("⚠️ Mouse listener failed to start:", e)

    try:
        keyboard.Listener(on_press=on_press).start()
    except Exception as e:
        print("⚠️ Keyboard listener failed to start:", e)


# ---- Snapshot API ----
def get_activity_snapshot():
    """
    Returns and resets activity flags.
    """
    with _lock:
        snapshot = {
            "mouse_moved": _state["mouse_moved"],
            "mouse_clicked": _state["mouse_clicked"],
            "key_pressed": _state["key_pressed"],
        }

        # Reset after reading
        _state["mouse_moved"] = False
        _state["mouse_clicked"] = False
        _state["key_pressed"] = False

    return snapshot