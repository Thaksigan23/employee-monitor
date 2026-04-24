const express = require("express");
const {
  createShift,
  getShifts,
  updateShift,
  deleteShift,
  assignUsers,
} = require("../controllers/shift.controller");
const protect = require("../middleware/auth");
const admin = require("../middleware/admin");

const router = express.Router();

router.get("/", protect, getShifts);
router.post("/", protect, admin, createShift);
router.put("/:id", protect, admin, updateShift);
router.delete("/:id", protect, admin, deleteShift);
router.put("/:id/assign", protect, admin, assignUsers);

module.exports = router;
