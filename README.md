# 🚀 Employee Monitoring & Workforce Management Suite

A comprehensive, production-grade workforce productivity platform designed for modern remote and hybrid teams. This suite provides real-time activity tracking, performance analytics, and seamless communication between administrators and employees.

---

## 🌟 Key Features

### 🖥️ Real-time Monitoring
- **Active Window Tracking:** Monitors the application currently in focus.
- **Activity Logging:** Tracks keystrokes and mouse movements (productivity metrics).
- **Automated Screenshots:** Periodically captures employee screens for transparency.
- **Unauthorized App Detection:** Alerts when blocked or non-work-related apps are used.

### 📊 Advanced Analytics
- **Productivity Scoring:** Automated scoring based on application usage and activity levels.
- **Leaderboards:** Gamified performance tracking to boost team morale.
- **Timesheets:** Accurate tracking of work hours and shift patterns.
- **Department Analytics:** High-level overview of team performance.

### 💬 Communication & HR
- **Real-time Chat:** Instant messaging between team members and departments.
- **Announcements:** Global broadcast system for company-wide updates.
- **Leave Management:** Streamlined workflow for applying and approving leave requests.
- **Task Assignments:** Integrated task tracking with desktop notifications.

### 🔐 Security & Admin
- **Role-Based Access Control (RBAC):** Distinct views for Admins, Managers, and Employees.
- **Secure Authentication:** JWT-based login with encrypted credentials.
- **Audit Logs:** Comprehensive tracking of all administrative actions.

---

## 🛠️ Tech Stack

### Backend
- **Node.js & Express:** Robust API server.
- **MongoDB & Mongoose:** Scalable NoSQL database and ODM.
- **Socket.io:** Real-time bi-directional communication.
- **JWT:** Secure token-based authentication.
- **Multer:** Handling file uploads (screenshots).

### Frontend
- **React (Vite):** Modern, fast UI development.
- **TailwindCSS:** Sleek, responsive design system.
- **Recharts:** Interactive data visualization.
- **Socket.io-client:** Real-time dashboard updates.

### Agent (Desktop Client)
- **Python:** Lightweight background monitoring.
- **PyGetWindow & Pynput:** Window tracking and activity monitoring.
- **Requests:** Seamless API integration.
- **Psutil:** System-level process management.

---

## 📁 Project Structure

```text
employee-monitor/
├── agent/            # Python-based desktop monitoring agent
├── backend/          # Node.js Express API server
├── frontend/         # React Vite dashboard
├── render.yaml       # Deployment configuration
└── README.md         # Documentation
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas)
- Python 3.9+

### 1. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file in `/backend`:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_key
```
Start the server:
```bash
npm run dev
```

### 2. Frontend Setup
```bash
cd frontend
npm install
```
Start the development server:
```bash
npm run dev
```

### 3. Agent Setup
```bash
cd agent
python -m venv venv
source venv/bin/activate  # venv\Scripts\activate on Windows
pip install -r requirements.txt
```
Create a `.env` file in `/agent`:
```env
API_URL=http://localhost:5000/api
```
Run the agent:
```bash
python main.py
```

---

## 🔒 Security Disclaimer
This software is intended for legitimate workforce management and productivity enhancement. Ensure compliance with local labor laws and privacy regulations regarding employee monitoring before deployment.

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

---
Built with ❤️ for better team productivity.
