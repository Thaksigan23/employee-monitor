const express = require("express");
const router = express.Router();
const { register, login, changePassword } = require("../controllers/auth.controller");
const protect = require("../middleware/auth");

router.post("/register", register);
router.post("/login", login);
router.put("/change-password", protect, changePassword);

module.exports = router;