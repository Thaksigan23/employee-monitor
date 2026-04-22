const express = require("express");
const router = express.Router();
const Activity = require("../models/Activity");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
/* ===========================
   GET Activities (Dashboard)
=========================== */
router.get("/", auth, async (req, res) => {
  try {
    const { userId, start, end } = req.query;

    let filter = {};

    // 🔐 Role-based filtering
    if (req.user.role !== "admin") {
      filter.user = req.user._id;   // FIXED
    } else if (userId) {
      filter.user = userId;
    }

    // 📅 Date filtering
    if (start || end) {
      filter.createdAt = {};

      if (start) {
        filter.createdAt.$gte = new Date(start);
      }

      if (end) {
        filter.createdAt.$lte = new Date(end);
      }
    }

    const activities = await Activity.find(filter)
      .sort({ createdAt: -1 })
      .populate("user", "email role");

    res.json(activities);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


/* ===========================
   POST Activity (Agent)
=========================== */
router.post("/", auth, async (req, res) => {
  try {
    const { status, windowTitle, isPrivate } = req.body;

    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }

    const activity = await Activity.create({
      user: req.user._id,   // 🔥 VERY IMPORTANT FIX
      status,
      windowTitle,
      isPrivate,
    });

    res.json(activity);

  } catch (error) {
    console.error("Activity error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 🔥 DELETE activities (Admin only)
router.delete("/", auth, admin, async (req, res) => {
  try {
    const { userId } = req.query;

    let filter = {};

    if (userId) {
      filter.user = userId;
    }

    const result = await Activity.deleteMany(filter);

    res.json({
      message: "Activity logs cleared",
      deleted: result.deletedCount,
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;