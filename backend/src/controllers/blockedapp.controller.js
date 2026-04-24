const { BlockedApp, Violation } = require("../models/BlockedApp");
const Activity = require("../models/Activity");
const AuditLog = require("../models/AuditLog");

// Add a blocked app (admin only)
exports.addBlockedApp = async (req, res) => {
  try {
    const { name, keywords, severity } = req.body;

    if (!name || !keywords || keywords.length === 0) {
      return res.status(400).json({ error: "Name and at least one keyword required" });
    }

    const app = await BlockedApp.create({
      name,
      keywords: keywords.map((k) => k.toLowerCase()),
      severity: severity || "medium",
      addedBy: req.user._id,
    });

    await AuditLog.create({
      actor: req.user._id,
      action: "add_blocked_app",
      target: app._id,
      details: `Blocked app "${name}" with keywords: ${keywords.join(", ")}`,
    });

    res.status(201).json(app);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: "App with this name already exists" });
    }
    res.status(500).json({ error: error.message });
  }
};

// Get all blocked apps
exports.getBlockedApps = async (req, res) => {
  try {
    const apps = await BlockedApp.find().sort({ createdAt: -1 });
    res.json(apps);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a blocked app (admin only)
exports.deleteBlockedApp = async (req, res) => {
  try {
    const app = await BlockedApp.findByIdAndDelete(req.params.id);
    if (!app) return res.status(404).json({ error: "App not found" });

    await AuditLog.create({
      actor: req.user._id,
      action: "remove_blocked_app",
      target: app._id,
      details: `Removed blocked app "${app.name}"`,
    });

    res.json({ message: "Blocked app removed" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Scan activities and create violations
exports.scanViolations = async (req, res) => {
  try {
    const blockedApps = await BlockedApp.find({ active: true });
    if (blockedApps.length === 0) {
      return res.json({ scanned: 0, violations: 0 });
    }

    // Get recent activities (last 24 hours)
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const activities = await Activity.find({
      createdAt: { $gte: since },
      windowTitle: { $exists: true, $ne: "" },
    });

    let newViolations = 0;

    for (const activity of activities) {
      const lowerTitle = (activity.windowTitle || "").toLowerCase();

      for (const app of blockedApps) {
        const matched = app.keywords.some((kw) => lowerTitle.includes(kw));
        if (matched) {
          // Check if we already logged this violation for this user+app in the last hour
          const recentViolation = await Violation.findOne({
            user: activity.user,
            blockedApp: app._id,
            createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) },
          });

          if (!recentViolation) {
            await Violation.create({
              user: activity.user,
              blockedApp: app._id,
              appName: app.name,
              windowTitle: activity.windowTitle,
              severity: app.severity,
            });
            newViolations++;
          }
        }
      }
    }

    res.json({ scanned: activities.length, violations: newViolations });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get violations (admin: all, employee: own)
exports.getViolations = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role !== "admin") {
      filter.user = req.user._id;
    }

    const violations = await Violation.find(filter)
      .sort({ createdAt: -1 })
      .limit(200)
      .populate("user", "email name department")
      .populate("blockedApp", "name severity");

    res.json(violations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Acknowledge a violation
exports.acknowledgeViolation = async (req, res) => {
  try {
    const violation = await Violation.findByIdAndUpdate(
      req.params.id,
      { acknowledged: true },
      { new: true }
    );
    if (!violation) return res.status(404).json({ error: "Violation not found" });
    res.json(violation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
