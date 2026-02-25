const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Routes
app.use("/api/activity", require("./routes/activity.routes"));

// Test route
app.get("/", (req, res) => {
  res.send("Employee Monitor API is running 🚀");
});

module.exports = app;