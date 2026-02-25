const express = require("express");
const router = express.Router();
const { register, login } = require("../controllers/auth.controller");

router.post("/register", register); // for now (we'll remove later)
router.post("/login", login);

module.exports = router;