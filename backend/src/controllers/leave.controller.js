const Leave = require("../models/Leave");
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");

// Helper: calculate days used from leaves
function calcDaysUsed(leaves) {
  const used = { sick: 0, casual: 0, vacation: 0, personal: 0, other: 0 };
  for (const leave of leaves) {
    if (leave.status !== "approved") continue;
    const start = new Date(leave.startDate);
    const end = new Date(leave.endDate);
    const days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1);
    if (used[leave.type] !== undefined) used[leave.type] += days;
  }
  return used;
}

// Employee requests leave
exports.requestLeave = async (req, res) => {
  try {
    const { type, startDate, endDate, reason } = req.body;

    if (!type || !startDate || !endDate || !reason) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      return res.status(400).json({ error: "End date must be after start date" });
    }

    // Check balance
    const user = await User.findById(req.user._id);
    const myLeaves = await Leave.find({ user: req.user._id, status: "approved" });
    const used = calcDaysUsed(myLeaves);
    const balance = (user.leaveBalance?.[type] ?? 0) - (used[type] ?? 0);
    const requestedDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1);

    if (requestedDays > balance) {
      return res.status(400).json({
        error: `Insufficient ${type} leave balance. You have ${balance} day(s) remaining.`,
      });
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
      .populate("user", "email name department leaveBalance")
      .populate("reviewedBy", "email");

    res.json(leaves);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get leave balance for current user
exports.getLeaveBalance = async (req, res) => {
  try {
    const userId = req.query.userId || req.user._id;

    // Only admin can check others
    if (String(userId) !== String(req.user._id) && req.user.role !== "admin") {
      return res.status(403).json({ error: "Not authorized" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const approvedLeaves = await Leave.find({ user: userId, status: "approved" });
    const used = calcDaysUsed(approvedLeaves);

    const balance = {};
    const quota = user.leaveBalance || { sick: 12, casual: 10, vacation: 15, personal: 5, other: 3 };

    for (const type of Object.keys(quota)) {
      balance[type] = {
        total: quota[type],
        used: used[type] || 0,
        remaining: Math.max(0, quota[type] - (used[type] || 0)),
      };
    }

    res.json({ userId, email: user.email, balance });
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

    await AuditLog.create({
      actor: req.user._id,
      action: `leave_${status}`,
      target: leave.user.email,
      details: `${leave.type} leave from ${leave.startDate} to ${leave.endDate}${reviewNote ? ` — Note: ${reviewNote}` : ""}`,
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
