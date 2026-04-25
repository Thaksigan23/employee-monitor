const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "employee"], default: "employee" },
    name: { type: String, default: "" },
    department: { type: String, default: "General" },
    // Leave balance (days per year per type)
    leaveBalance: {
      sick: { type: Number, default: 12 },
      casual: { type: Number, default: 10 },
      vacation: { type: Number, default: 15 },
      personal: { type: Number, default: 5 },
      other: { type: Number, default: 3 },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);