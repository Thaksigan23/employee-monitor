require("dotenv").config({ path: "./.env" });
const app = require("./app");  // 🔥 Make sure path is correct
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth.routes");
const PORT = process.env.PORT || 5000;
const userRoutes = require("./routes/user.routes");
console.log("JWT_SECRET =", process.env.JWT_SECRET);
// Connect to MongoDB
connectDB();
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});