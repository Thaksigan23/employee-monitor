const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(morgan("dev"));

app.use("/api/activity", require("./routes/activity.routes"));

app.get("/", (req, res) => {
  res.send("Employee Monitor API is running");
});

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

module.exports = app;
