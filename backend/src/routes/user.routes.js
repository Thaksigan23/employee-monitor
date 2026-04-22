const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

// Get all users (admin only)
router.get("/", auth, admin, async (req, res) => {
  const users = await User.find().select("-password");
  res.json(users);
});

// Create user (admin only)
router.post("/", auth, admin, async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Validate role
    if (!["admin", "employee"].includes(role)) {
      return res.status(400).json({ error: "Invalid role value" });
    }

    // Check if user already exists
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
    res.status(500).json({ error: "Server error" });
  }
});

// Delete user (admin only)
router.delete("/:id", auth, admin, async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: "User deleted" });
});

module.exports = router;