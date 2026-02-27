import requests
import json
import os
from getpass import getpass

API_URL = "http://localhost:5000/api/auth/login"
TOKEN_FILE = "agent_token.json"


def save_token(token, user):
    with open(TOKEN_FILE, "w") as f:
        json.dump({"token": token, "user": user}, f)


def load_token():
    if os.path.exists(TOKEN_FILE):
        with open(TOKEN_FILE, "r") as f:
            return json.load(f)
    return None


def login():
    print("🔐 Agent Login Required")
    email = input("Email: ")
    password = getpass("Password: ")

    response = requests.post(API_URL, json={
        "email": email,
        "password": password
    })

    if response.status_code != 200:
        print("❌ Login failed:", response.json().get("error"))
        return None

    data = response.json()
    save_token(data["token"], data["user"])

    print("✅ Login successful")
    return data