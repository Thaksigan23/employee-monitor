const express = require("express");
const {
  getTimesheets,
  getAppUsage,
  getLeaderboard,
  getTrends,
  getPerformanceReport,
} = require("../controllers/analytics.controller");
const protect = require("../middleware/auth");

const router = express.Router();

// Protected route: Users can get their own timesheets, Admins get all
router.get("/timesheets", protect, getTimesheets);
router.get("/app-usage", protect, getAppUsage);
router.get("/leaderboard", protect, getLeaderboard);
router.get("/trends", protect, getTrends);
router.get("/report", protect, getPerformanceReport);

module.exports = router;
