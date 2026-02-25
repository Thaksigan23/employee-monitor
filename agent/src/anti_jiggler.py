import time

_history = []

def check_suspicious(clicks: int):
    now = time.time()
    _history.append((now, clicks))

    # keep last 10 minutes
    ten_min_ago = now - 600
    recent = [(t, c) for (t, c) in _history if t >= ten_min_ago]

    # replace history
    _history.clear()
    _history.extend(recent)

    total_clicks = sum(c for (_, c) in recent)

    if total_clicks == 0 and len(recent) >= 10:
        return True
    return False