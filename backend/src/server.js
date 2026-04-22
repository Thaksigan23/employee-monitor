require("dotenv").config({ path: "./.env" });

const app = require("./app");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const activityRoutes = require("./routes/activity.routes");

const PORT = process.env.PORT || 5000;

app.use("/api/activity", activityRoutes);
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);

connectDB();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
