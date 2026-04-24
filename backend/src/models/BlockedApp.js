const mongoose = require("mongoose");

const BlockedAppSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true }, // e.g. "YouTube", "Facebook"
    keywords: [{ type: String }], // keywords to match in window titles
    severity: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const ViolationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    blockedApp: { type: mongoose.Schema.Types.ObjectId, ref: "BlockedApp" },
    appName: { type: String, required: true },
    windowTitle: { type: String },
    severity: { type: String, default: "medium" },
    acknowledged: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const BlockedApp = mongoose.model("BlockedApp", BlockedAppSchema);
const Violation = mongoose.model("Violation", ViolationSchema);

module.exports = { BlockedApp, Violation };
