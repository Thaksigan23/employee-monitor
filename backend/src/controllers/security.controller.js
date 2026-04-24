const SecurityAlert = require("../models/SecurityAlert");
const AuditLog = require("../models/AuditLog");

exports.createAlert = async (req, res) => {
  try {
    const { type, details } = req.body;

    const alert = await SecurityAlert.create({
      user: req.user._id,
      type,
      details,
    });

    res.status(201).json(alert);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAlerts = async (req, res) => {
  try {
    const filter = {};
    // Employees can only see their own alerts
    if (req.user.role !== "admin") {
      filter.user = req.user._id;
    }

    const alerts = await SecurityAlert.find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .populate("user", "email name department");

    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.resolveAlert = async (req, res) => {
  try {
    const alert = await SecurityAlert.findByIdAndUpdate(
      req.params.id,
      { resolved: true },
      { new: true }
    );

    if (!alert) return res.status(404).json({ error: "Alert not found" });

    await AuditLog.create({
      actor: req.user._id,
      action: "resolve_security_alert",
      target: alert._id,
      details: `Resolved alert: ${alert.type} for user ID ${alert.user}`,
    });

    res.json(alert);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
