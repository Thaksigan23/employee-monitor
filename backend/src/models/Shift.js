const mongoose = require("mongoose");

const ShiftSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    startTime: { type: String, required: true }, // "09:00"
    endTime: { type: String, required: true },   // "17:00"
    days: [{ type: String, enum: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] }],
    department: { type: String, default: "General" },
    assignedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    color: { type: String, default: "#10b981" }, // for UI display
  },
  { timestamps: true }
);

module.exports = mongoose.model("Shift", ShiftSchema);
