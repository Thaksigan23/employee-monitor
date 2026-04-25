require("dotenv").config({ path: "./.env" });

const http = require("http");
const { Server } = require("socket.io");
const express = require("express");
const path = require("path");
const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";

// Create HTTP server + Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: CORS_ORIGIN.split(",").map((o) => o.trim()),
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Make io accessible in controllers via app
app.set("io", io);

// Socket.IO auth middleware
const jwt = require("jsonwebtoken");
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("No token"));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
    socket.user = decoded;
    next();
  } catch {
    next(new Error("Invalid token"));
  }
});

// Connected users map: userId -> socketId
const connectedUsers = new Map();

io.on("connection", (socket) => {
  const userId = socket.user?.id || socket.user?._id;
  if (userId) {
    connectedUsers.set(String(userId), socket.id);
    // Broadcast online users
    io.emit("online_users", Array.from(connectedUsers.keys()));
    console.log(`✅ Socket connected: ${userId}`);
  }

  // Join personal room
  socket.join(`user:${userId}`);

  // Handle new message
  socket.on("send_message", async (data) => {
    try {
      const Message = require("./models/Message");
      const { receiverId, text } = data;
      if (!receiverId || !text?.trim()) return;

      const message = await Message.create({
        sender: userId,
        receiver: receiverId,
        text: text.trim(),
      });

      const populated = await message.populate([
        { path: "sender", select: "email role" },
        { path: "receiver", select: "email role" },
      ]);

      // Send to receiver's room
      io.to(`user:${receiverId}`).emit("new_message", populated);
      // Confirm to sender
      socket.emit("message_sent", populated);
    } catch (err) {
      socket.emit("error", { message: err.message });
    }
  });

  // Handle typing indicator
  socket.on("typing", ({ receiverId, isTyping }) => {
    io.to(`user:${receiverId}`).emit("user_typing", {
      senderId: String(userId),
      isTyping,
    });
  });

  socket.on("disconnect", () => {
    connectedUsers.delete(String(userId));
    io.emit("online_users", Array.from(connectedUsers.keys()));
    console.log(`❌ Socket disconnected: ${userId}`);
  });
});

// Make connectedUsers accessible globally
app.set("connectedUsers", connectedUsers);

// Mount all routes
app.use("/api/activity", require("./routes/activity.routes"));
app.use("/api/users", require("./routes/user.routes"));
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/analytics", require("./routes/analytics.routes"));
app.use("/api/tasks", require("./routes/task.routes"));
app.use("/api/chat", require("./routes/chat.routes"));
app.use("/api/leaves", require("./routes/leave.routes"));
app.use("/api/announcements", require("./routes/announcement.routes"));
app.use("/api/audit", require("./routes/audit.routes"));
app.use("/api/shifts", require("./routes/shift.routes"));
app.use("/api/blocked-apps", require("./routes/blockedapp.routes"));
app.use("/api/screenshots", require("./routes/screenshot.routes"));
app.use("/api/security", require("./routes/security.routes"));

// Serve uploads
const path2 = require("path");
app.use("/uploads", express.static(path2.join(__dirname, "../uploads")));

connectDB();

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} (with Socket.IO)`);
});
