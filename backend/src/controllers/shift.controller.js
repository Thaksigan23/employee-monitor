const Shift = require("../models/Shift");
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");

// Create a new shift (admin only)
exports.createShift = async (req, res) => {
  try {
    const { name, startTime, endTime, days, department, assignedUsers, color } = req.body;

    if (!name || !startTime || !endTime) {
      return res.status(400).json({ error: "Name, start time, and end time are required" });
    }

    const shift = await Shift.create({
      name,
      startTime,
      endTime,
      days: days || ["Mon", "Tue", "Wed", "Thu", "Fri"],
      department: department || "General",
      assignedUsers: assignedUsers || [],
      createdBy: req.user._id,
      color: color || "#10b981",
    });

    await AuditLog.create({
      actor: req.user._id,
      action: "create_shift",
      target: shift._id,
      details: `Created shift "${name}" (${startTime}-${endTime})`,
    });

    res.status(201).json(shift);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all shifts
exports.getShifts = async (req, res) => {
  try {
    const shifts = await Shift.find()
      .populate("assignedUsers", "email name department")
      .populate("createdBy", "email")
      .sort({ createdAt: -1 });

    // If not admin, only return shifts user is assigned to
    if (req.user.role !== "admin") {
      const myShifts = shifts.filter((s) =>
        s.assignedUsers.some((u) => u._id.toString() === req.user._id.toString())
      );
      return res.json(myShifts);
    }

    res.json(shifts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a shift (admin only)
exports.updateShift = async (req, res) => {
  try {
    const shift = await Shift.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate("assignedUsers", "email name department");

    if (!shift) return res.status(404).json({ error: "Shift not found" });

    await AuditLog.create({
      actor: req.user._id,
      action: "update_shift",
      target: shift._id,
      details: `Updated shift "${shift.name}"`,
    });

    res.json(shift);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a shift (admin only)
exports.deleteShift = async (req, res) => {
  try {
    const shift = await Shift.findByIdAndDelete(req.params.id);
    if (!shift) return res.status(404).json({ error: "Shift not found" });

    await AuditLog.create({
      actor: req.user._id,
      action: "delete_shift",
      target: shift._id,
      details: `Deleted shift "${shift.name}"`,
    });

    res.json({ message: "Shift deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Assign users to a shift
exports.assignUsers = async (req, res) => {
  try {
    const { userIds } = req.body;
    const shift = await Shift.findById(req.params.id);
    if (!shift) return res.status(404).json({ error: "Shift not found" });

    shift.assignedUsers = userIds;
    await shift.save();

    const populated = await shift.populate("assignedUsers", "email name department");

    await AuditLog.create({
      actor: req.user._id,
      action: "assign_shift",
      target: shift._id,
      details: `Assigned ${userIds.length} user(s) to shift "${shift.name}"`,
    });

    res.json(populated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
