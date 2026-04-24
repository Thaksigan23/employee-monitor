const mongoose = require("mongoose");

const SecurityAlertSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, required: true, enum: ["USB_INSERTION", "UNAUTHORIZED_ACCESS", "SYSTEM_TAMPERING"] },
    details: { type: String, required: true },
    resolved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SecurityAlert", SecurityAlertSchema);
