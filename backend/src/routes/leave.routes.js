const express = require("express");
const { requestLeave, getLeaves, reviewLeave, deleteLeave, getLeaveBalance } = require("../controllers/leave.controller");
const protect = require("../middleware/auth");

const router = express.Router();

router.post("/", protect, requestLeave);
router.get("/", protect, getLeaves);
router.get("/balance", protect, getLeaveBalance);
router.put("/:id/review", protect, reviewLeave);
router.delete("/:id", protect, deleteLeave);

module.exports = router;
