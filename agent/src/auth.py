import os
import requests
import json
import tkinter as tk
from tkinter import simpledialog, messagebox
from dotenv import load_dotenv

load_dotenv()

BASE_URL = os.environ.get("API_BASE_URL", "http://localhost:5000/api")
API_URL = f"{BASE_URL}/auth/login"
TOKEN_FILE = "agent_token.json"


def save_token(token, user):
    with open(TOKEN_FILE, "w") as f:
        json.dump({"token": token, "user": user}, f)


def load_token():
    if os.path.exists(TOKEN_FILE):
        with open(TOKEN_FILE, "r") as f:
            return json.load(f)
    return None


def get_credentials_gui():
    root = tk.Tk()
    root.withdraw() # Hide the main empty window
    
    email = simpledialog.askstring("Agent Login", "Enter Employee Email:", parent=root)
    if not email:
        return None, None
        
    password = simpledialog.askstring("Agent Login", "Enter Password:", parent=root, show='*')
    if not password:
        return None, None
        
    return email, password


def login():
    # 1. Check if IT admin set credentials silently via Environment Variables
    email = os.environ.get("AGENT_EMAIL")
    password = os.environ.get("AGENT_PASSWORD")
    
    # 2. If no environment variables, popup a neat Graphical Interface
    if not email or not password:
        print("🔐 Opening visual login window...")
        email, password = get_credentials_gui()
        
        if not email or not password:
            print("❌ Login cancelled by user.")
            return None

    try:
        response = requests.post(API_URL, json={
            "email": email,
            "password": password
        })

        if response.status_code != 200:
            error_msg = response.json().get("error", "Unknown error")
            print("❌ Login failed:", error_msg)
            
            # Show graphical error
            root = tk.Tk()
            root.withdraw()
            messagebox.showerror("Login Failed", f"Could not connect: {error_msg}")
            return None

        data = response.json()
        save_token(data["token"], data["user"])

        print("✅ Login successful")
        
        # Show graphical success
        if not os.environ.get("AGENT_EMAIL"):
            root = tk.Tk()
            root.withdraw()
            messagebox.showinfo("Success", "Agent linked successfully! Monitoring started silently.")
            
        return data
        
    except Exception as e:
        print("❌ Network error:", e)
        root = tk.Tk()
        root.withdraw()
        messagebox.showerror("Network Error", "Could not reach the server. Is the backend running?")
        return None