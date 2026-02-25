const app = require("./app");
const connectDB = require("./config/db");
require("dotenv").config();
const authRoutes = require("./routes/auth.routes");
const PORT = process.env.PORT || 5000;
const userRoutes = require("./routes/user.routes");

// Connect to MongoDB
connectDB();
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});