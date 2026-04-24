import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Activity from "./pages/Activity";
import Settings from "./pages/Settings";
import Timesheets from "./pages/Timesheets";
import Chat from "./pages/Chat";
import Leaves from "./pages/Leaves";
import Announcements from "./pages/Announcements";
import AuditLogs from "./pages/AuditLogs";
import Shifts from "./pages/Shifts";
import BlockedApps from "./pages/BlockedApps";
import Leaderboard from "./pages/Leaderboard";
import Reports from "./pages/Reports";
import Screenshots from "./pages/Screenshots";
import Security from "./pages/Security";
import Layout from "./components/Layout";

function RequireAuth({ children }) {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function RequireAdmin({ children }) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  if (user.role !== "admin") return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login onLogin={() => window.location.href = "/dashboard"} />} />
        <Route path="/register" element={<Register onRegister={() => window.location.href = "/dashboard"} />} />

        <Route path="/dashboard" element={<RequireAuth><Layout><Dashboard /></Layout></RequireAuth>} />
        <Route path="/activity" element={<RequireAuth><Layout><Activity /></Layout></RequireAuth>} />
        <Route path="/screenshots" element={<RequireAuth><Layout><Screenshots /></Layout></RequireAuth>} />
        <Route path="/settings" element={<RequireAuth><Layout><Settings /></Layout></RequireAuth>} />
        <Route path="/timesheets" element={<RequireAuth><Layout><Timesheets /></Layout></RequireAuth>} />
        <Route path="/chat" element={<RequireAuth><Layout><Chat /></Layout></RequireAuth>} />
        <Route path="/leaves" element={<RequireAuth><Layout><Leaves /></Layout></RequireAuth>} />
        <Route path="/announcements" element={<RequireAuth><Layout><Announcements /></Layout></RequireAuth>} />
        <Route path="/shifts" element={<RequireAuth><Layout><Shifts /></Layout></RequireAuth>} />
        <Route path="/leaderboard" element={<RequireAuth><Layout><Leaderboard /></Layout></RequireAuth>} />
        <Route path="/reports" element={<RequireAuth><Layout><Reports /></Layout></RequireAuth>} />

        <Route path="/users" element={<RequireAuth><RequireAdmin><Layout><Users /></Layout></RequireAdmin></RequireAuth>} />
        <Route path="/audit" element={<RequireAuth><RequireAdmin><Layout><AuditLogs /></Layout></RequireAdmin></RequireAuth>} />
        <Route path="/blocked-apps" element={<RequireAuth><RequireAdmin><Layout><BlockedApps /></Layout></RequireAdmin></RequireAuth>} />
        <Route path="/security" element={<RequireAuth><RequireAdmin><Layout><Security /></Layout></RequireAdmin></RequireAuth>} />
      </Routes>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<AppRoutes />);