import time
import threading
import psutil
from api import send_security_alert

USB_POLL_INTERVAL = 5 # Check every 5 seconds

# Track connected devices
connected_disks = set()

def get_removable_drives():
    """Returns a set of device names (e.g. 'D:\', 'E:\') that are removable."""
    drives = set()
    try:
        partitions = psutil.disk_partitions(all=False)
        for p in partitions:
            # On Windows, 'removable' indicates a USB drive
            if 'removable' in p.opts.lower() or p.fstype == 'FAT32' or p.fstype == 'exFAT':
                drives.add(p.device)
    except Exception as e:
        pass
    return drives

def usb_worker():
    global connected_disks
    
    # Initial load so we don't alert for USBs already plugged in on startup
    connected_disks = get_removable_drives()
    
    while True:
        current_disks = get_removable_drives()
        
        # Find new insertions
        new_disks = current_disks - connected_disks
        for disk in new_disks:
            print(f"🔌 ALERT: USB Device inserted at {disk}")
            send_security_alert("USB_INSERTION", f"Unauthorized USB Storage Device inserted at {disk}")
            
        connected_disks = current_disks
        time.sleep(USB_POLL_INTERVAL)

def start_usb_monitor():
    """Starts the background thread for USB detection."""
    thread = threading.Thread(target=usb_worker, daemon=True)
    thread.start()
    print("🔌 USB monitor started.")
