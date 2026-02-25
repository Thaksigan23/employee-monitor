from pynput import keyboard
import time

_last_input_time = time.time()
_click_count = 0

def on_move(x, y):
    global _last_input_time
    _last_input_time = time.time()

def on_click(x, y, button, pressed):
    global _last_input_time, _click_count
    if pressed:
        _click_count += 1
        _last_input_time = time.time()

def on_press(key):
    global _last_input_time
    _last_input_time = time.time()

def start_listeners():
    # Disable mouse listener due to Windows pynput bug
    keyboard.Listener(on_press=on_press).start()

def get_activity_status():
    global _click_count
    now = time.time()
    active = (now - _last_input_time) < 60  # active in last 60 sec
    clicks = _click_count
    _click_count = 0  # reset after reading
    return active, clicks