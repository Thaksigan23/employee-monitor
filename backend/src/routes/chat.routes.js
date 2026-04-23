const express = require("express");
const { sendMessage, getConversation, getChatList } = require("../controllers/chat.controller");
const protect = require("../middleware/auth");

const router = express.Router();

// Get all chat partners with last message info
router.get("/list", protect, getChatList);

// Get full conversation with a specific user
router.get("/:userId", protect, getConversation);

// Send a message
router.post("/", protect, sendMessage);

module.exports = router;
