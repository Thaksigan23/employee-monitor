require("dotenv").config({ path: "./.env" });

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

const PORT = process.env.PORT || 5000;

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

connectDB();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
