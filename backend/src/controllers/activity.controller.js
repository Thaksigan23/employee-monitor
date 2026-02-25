const Activity = require("../models/Activity");

exports.createActivity = async (req, res) => {
  try {
    const activity = await Activity.create(req.body);
    res.status(201).json(activity);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getActivities = async (req, res) => {
  try {
    const activities = await Activity.find().sort({ createdAt: -1 }).limit(100);
    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};