# Employee Monitor System

## Overview
Employee Monitor is a secure workforce monitoring system with:

- Authenticated desktop agent
- Real-time activity tracking
- Role-based dashboard
- Suspicious activity detection
- JWT authentication
- MongoDB data storage

## Tech Stack

Backend:
- Node.js
- Express
- MongoDB
- JWT

Frontend:
- React (Vite)
- TailwindCSS
- Recharts

Agent:
- Python
- pynput
- Active window tracking

---

## Setup Instructions

### 1. Backend

cd backend
npm install

Create .env file:

PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/employee-monitor
JWT_SECRET=your_secret_here

npm run dev

---

### 2. Frontend

cd frontend
npm install
npm run dev

---

### 3. Agent

cd agent
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python main.py
