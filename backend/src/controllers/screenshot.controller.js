const Screenshot = require("../models/Screenshot");

exports.uploadScreenshot = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image provided" });
    }

    const { windowTitle } = req.body;

    // The file is saved in uploads/, we store the relative path
    const filePath = `/uploads/${req.file.filename}`;

    const screenshot = await Screenshot.create({
      user: req.user._id,
      filePath,
      windowTitle: windowTitle || "Unknown",
    });

    res.status(201).json(screenshot);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getScreenshots = async (req, res) => {
  try {
    const filter = {};
    // Only admins can specify a userId to filter by
    if (req.user.role === "admin" && req.query.userId) {
      filter.user = req.query.userId;
    } else if (req.user.role !== "admin") {
      filter.user = req.user._id;
    }

    // Default to last 50 screenshots
    const screenshots = await Screenshot.find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("user", "email name department");

    res.json(screenshots);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
