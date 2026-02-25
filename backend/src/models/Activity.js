const mongoose = require("mongoose");

const ActivitySchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true },
    status: { type: String, enum: ["Active", "Idle", "Suspicious"], required: true },
    windowTitle: { type: String },
    isPrivate: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Activity", ActivitySchema);