const express = require("express");
const { createAnnouncement, getAnnouncements, markRead, getUnread } = require("../controllers/announcement.controller");
const protect = require("../middleware/auth");

const router = express.Router();

router.post("/", protect, createAnnouncement);
router.get("/", protect, getAnnouncements);
router.get("/unread", protect, getUnread);
router.put("/:id/read", protect, markRead);

module.exports = router;
