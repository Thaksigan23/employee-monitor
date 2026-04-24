const express = require("express");
const {
  addBlockedApp,
  getBlockedApps,
  deleteBlockedApp,
  scanViolations,
  getViolations,
  acknowledgeViolation,
} = require("../controllers/blockedapp.controller");
const protect = require("../middleware/auth");
const admin = require("../middleware/admin");

const router = express.Router();

router.get("/", protect, getBlockedApps);
router.post("/", protect, admin, addBlockedApp);
router.delete("/:id", protect, admin, deleteBlockedApp);
router.post("/scan", protect, admin, scanViolations);
router.get("/violations", protect, getViolations);
router.put("/violations/:id/acknowledge", protect, acknowledgeViolation);

module.exports = router;
