const Announcement = require("../models/Announcement");
const AuditLog = require("../models/AuditLog");

// Admin creates announcement
exports.createAnnouncement = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Only admins can create announcements" });
    }

    const { title, message, priority } = req.body;

    const announcement = await Announcement.create({
      sender: req.user._id,
      title,
      message,
      priority: priority || "normal",
    });

    await AuditLog.create({
      actor: req.user._id,
      action: "announcement_created",
      target: "all_employees",
      details: title,
      ip: req.ip,
    });

    const populated = await announcement.populate("sender", "email");
    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all announcements
exports.getAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("sender", "email");

    // Add read status for current user
    const result = announcements.map((a) => ({
      ...a.toObject(),
      isRead: a.readBy.some((id) => id.toString() === req.user._id.toString()),
      readCount: a.readBy.length,
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mark announcement as read
exports.markRead = async (req, res) => {
  try {
    const { id } = req.params;
    await Announcement.findByIdAndUpdate(id, {
      $addToSet: { readBy: req.user._id },
    });
    res.json({ message: "Marked as read" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get unread announcements (for agent polling)
exports.getUnread = async (req, res) => {
  try {
    const announcements = await Announcement.find({
      readBy: { $nin: [req.user._id] },
    })
      .sort({ createdAt: -1 })
      .populate("sender", "email");

    res.json(announcements);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
