const AuditLog = require("../models/AuditLog");

// Get all audit logs (admin only)
exports.getAuditLogs = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { limit = 100 } = req.query;

    const logs = await AuditLog.find()
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate("actor", "email role");

    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
