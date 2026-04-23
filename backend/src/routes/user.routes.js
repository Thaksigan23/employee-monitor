const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

router.get("/", auth, admin, async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ email: 1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/", auth, admin, async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ error: "Email, password, and role are required" });
    }

    if (!["admin", "employee"].includes(role)) {
      return res.status(400).json({ error: "Invalid role value" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hash,
      role,
    });

    res.json({
      message: "User created",
      user: { id: user._id, email, role },
    });
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.delete("/:id", auth, admin, async (req, res) => {
  try {
    if (String(req.user._id) === req.params.id) {
      return res.status(400).json({ error: "You cannot delete your own account" });
    }

    const deleted = await User.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "User deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
