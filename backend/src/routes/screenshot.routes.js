const express = require("express");
const multer = require("multer");
const path = require("path");
const protect = require("../middleware/auth");
const { uploadScreenshot, getScreenshots } = require("../controllers/screenshot.controller");

const router = express.Router();

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, req.user._id + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

router.post("/", protect, upload.single("image"), uploadScreenshot);
router.get("/", protect, getScreenshots);

module.exports = router;
