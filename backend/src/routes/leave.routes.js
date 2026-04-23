const express = require("express");
const { requestLeave, getLeaves, reviewLeave, deleteLeave } = require("../controllers/leave.controller");
const protect = require("../middleware/auth");

const router = express.Router();

router.post("/", protect, requestLeave);
router.get("/", protect, getLeaves);
router.put("/:id/review", protect, reviewLeave);
router.delete("/:id", protect, deleteLeave);

module.exports = router;
