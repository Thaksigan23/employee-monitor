const mongoose = require("mongoose");

const ScreenshotSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    filePath: { type: String, required: true }, // Path to the uploaded image
    windowTitle: { type: String }, // Active window when screenshot was taken
  },
  { timestamps: true }
);

module.exports = mongoose.model("Screenshot", ScreenshotSchema);
