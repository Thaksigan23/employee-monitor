const Activity = require("../models/Activity");

const VALID_STATUSES = ["Active", "Idle", "Suspicious"];

exports.createActivity = async (req, res) => {
  try {
    const { status, windowTitle, isPrivate } = req.body;

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const activity = await Activity.create({
      user: req.user._id, // Associate activity with the authenticated user
      status,
      windowTitle,
      isPrivate: Boolean(isPrivate),
    });

    res.status(201).json(activity);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getActivities = async (req, res) => {
  try {
    const { userId, start, end } = req.query;
    const filter = {};

    // Role-based filtering: Users only see their own activities, admins see all or filter by user
    if (req.user.role !== "admin") {
      filter.user = req.user._id;
    } else if (userId) {
      filter.user = userId;
    }

    // Optional date range filtering
    if (start || end) {
      filter.createdAt = {};
      if (start) filter.createdAt.$gte = new Date(start);
      if (end) filter.createdAt.$lte = new Date(end);
    }

    const activities = await Activity.find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .populate("user", "email role"); // Populate user details

    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};