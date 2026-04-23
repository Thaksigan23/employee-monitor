const express = require("express");
const { createTask, getPendingTasks, markTaskRead } = require("../controllers/task.controller");
const protect = require("../middleware/auth");

const router = express.Router();

router.post("/", protect, createTask);
router.get("/pending", protect, getPendingTasks);
router.put("/:id/acknowledge", protect, markTaskRead);

module.exports = router;
