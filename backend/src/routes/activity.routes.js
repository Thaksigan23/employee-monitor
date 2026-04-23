const express = require("express");
const router = express.Router();
const Activity = require("../models/Activity");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

const VALID_STATUSES = ["Active", "Idle", "Suspicious"];

router.get("/", auth, async (req, res) => {
  try {
    const { userId, start, end } = req.query;
    const filter = {};

    if (req.user.role !== "admin") {
      filter.user = req.user._id;
    } else if (userId) {
      filter.user = userId;
    }

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

router.post("/", auth, async (req, res) => {
  try {
    const { status, windowTitle, isPrivate } = req.body;

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const activity = await Activity.create({
      user: req.user._id,
      status,
      windowTitle,
      isPrivate: Boolean(isPrivate),
    });

    res.json(activity);
  } catch (error) {
    console.error("Activity error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.delete("/:id", auth, admin, async (req, res) => {
  try {
    const deleted = await Activity.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ error: "Activity not found" });
    }

    res.json({ message: "Activity deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/", auth, admin, async (req, res) => {
  try {
    const { userId } = req.query;
    const filter = {};

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
