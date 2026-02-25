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
  const { email, password, role } = req.body;
  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({ email, password: hash, role });
  res.json({ message: "User created", user: { id: user._id, email, role } });
});

// Delete user (admin only)
router.delete("/:id", auth, admin, async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: "User deleted" });
});

module.exports = router;