const Leave = require("../models/Leave");
const AuditLog = require("../models/AuditLog");

// Employee requests leave
exports.requestLeave = async (req, res) => {
  try {
    const { type, startDate, endDate, reason } = req.body;

    if (new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({ error: "End date must be after start date" });
    }

    const leave = await Leave.create({
      user: req.user._id,
      type,
      startDate,
      endDate,
      reason,
    });

    res.status(201).json(leave);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get leaves (employees see own, admins see all)
exports.getLeaves = async (req, res) => {
  try {
    const filter = {};
    const { status } = req.query;

    if (req.user.role !== "admin") {
      filter.user = req.user._id;
    }
    if (status) filter.status = status;

    const leaves = await Leave.find(filter)
      .sort({ createdAt: -1 })
      .populate("user", "email name department")
      .populate("reviewedBy", "email");

    res.json(leaves);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Admin approves or rejects leave
exports.reviewLeave = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Only admins can review leaves" });
    }

    const { id } = req.params;
    const { status, reviewNote } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Status must be approved or rejected" });
    }

    const leave = await Leave.findByIdAndUpdate(
      id,
      { status, reviewedBy: req.user._id, reviewNote: reviewNote || "" },
      { new: true }
    ).populate("user", "email name");

    if (!leave) return res.status(404).json({ error: "Leave not found" });

    // Audit log
    await AuditLog.create({
      actor: req.user._id,
      action: `leave_${status}`,
      target: leave.user.email,
      details: `${leave.type} leave from ${leave.startDate} to ${leave.endDate}`,
      ip: req.ip,
    });

    res.json(leave);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete a leave request (only pending, by owner or admin)
exports.deleteLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const leave = await Leave.findById(id);
    if (!leave) return res.status(404).json({ error: "Leave not found" });

    const isOwner = leave.user.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({ error: "Not authorized" });
    }
    if (leave.status !== "pending" && req.user.role !== "admin") {
      return res.status(400).json({ error: "Can only cancel pending requests" });
    }

    await Leave.findByIdAndDelete(id);
    res.json({ message: "Leave request deleted" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
