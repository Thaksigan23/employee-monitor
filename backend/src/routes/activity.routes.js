const express = require("express");
const router = express.Router();
const Activity = require("../models/Activity");
const authMiddleware = require("../middleware/auth");

// Protected route
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { status, windowTitle, isPrivate } = req.body;

    const activity = await Activity.create({
      user: req.user.id,  // 🔥 USER FROM TOKEN
      status,
      windowTitle,
      isPrivate,
    });

    res.json(activity);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;