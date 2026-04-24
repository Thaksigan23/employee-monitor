const express = require("express");
const protect = require("../middleware/auth");
const admin = require("../middleware/admin");
const { createAlert, getAlerts, resolveAlert } = require("../controllers/security.controller");

const router = express.Router();

router.post("/", protect, createAlert);
router.get("/", protect, getAlerts);
router.put("/:id/resolve", protect, admin, resolveAlert);

module.exports = router;
