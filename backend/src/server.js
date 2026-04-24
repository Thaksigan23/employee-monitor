require("dotenv").config({ path: "./.env" });

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const app = require("./app");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const activityRoutes = require("./routes/activity.routes");
const analyticsRoutes = require("./routes/analytics.routes");
const taskRoutes = require("./routes/task.routes");
const chatRoutes = require("./routes/chat.routes");
const leaveRoutes = require("./routes/leave.routes");
const announcementRoutes = require("./routes/announcement.routes");
const auditRoutes = require("./routes/audit.routes");
const shiftRoutes = require("./routes/shift.routes");
const blockedAppRoutes = require("./routes/blockedapp.routes");
const screenshotRoutes = require("./routes/screenshot.routes");
const securityRoutes = require("./routes/security.routes");

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:5173" }));
app.use(express.json());

// Serve static files from uploads directory
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/api/activity", activityRoutes);
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/shifts", shiftRoutes);
app.use("/api/blocked-apps", blockedAppRoutes);
app.use("/api/screenshots", screenshotRoutes);
app.use("/api/security", securityRoutes);

connectDB();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
