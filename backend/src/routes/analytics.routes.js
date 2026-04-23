const express = require("express");
const { getTimesheets, getAppUsage } = require("../controllers/analytics.controller");
const protect = require("../middleware/auth");

const router = express.Router();

// Protected route: Users can get their own timesheets, Admins get all
router.get("/timesheets", protect, getTimesheets);
router.get("/app-usage", protect, getAppUsage);

module.exports = router;
