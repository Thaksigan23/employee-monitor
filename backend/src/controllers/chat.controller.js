const Message = require("../models/Message");
const User = require("../models/User");

// Send a message
exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, text } = req.body;

    if (!receiverId || !text) {
      return res.status(400).json({ error: "receiverId and text are required" });
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ error: "Receiver not found" });
    }

    const message = await Message.create({
      sender: req.user._id,
      receiver: receiverId,
      text: text.trim(),
    });

    const populated = await message.populate("sender", "email role");

    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get conversation between current user and another user
exports.getConversation = async (req, res) => {
  try {
    const { userId } = req.params;

    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: userId },
        { sender: userId, receiver: req.user._id },
      ],
    })
      .sort({ createdAt: 1 })
      .limit(200)
      .populate("sender", "email role")
      .populate("receiver", "email role");

    // Mark messages as read where current user is the receiver
    await Message.updateMany(
      { sender: userId, receiver: req.user._id, isRead: false },
      { isRead: true }
    );

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get list of users the current user has chatted with (with last message + unread count)
exports.getChatList = async (req, res) => {
  try {
    const myId = req.user._id;

    // Find all unique users this user has chatted with
    const sentTo = await Message.distinct("receiver", { sender: myId });
    const receivedFrom = await Message.distinct("sender", { receiver: myId });

    const chatPartnerIds = [...new Set([...sentTo.map(String), ...receivedFrom.map(String)])];

    // If admin, also include all employees so they can start new chats
    let allUsers = [];
    if (req.user.role === "admin") {
      allUsers = await User.find({ _id: { $ne: myId } }).select("email role");
    }

    const chatList = [];

    for (const partnerId of chatPartnerIds) {
      const partner = await User.findById(partnerId).select("email role");
      if (!partner) continue;

      const lastMessage = await Message.findOne({
        $or: [
          { sender: myId, receiver: partnerId },
          { sender: partnerId, receiver: myId },
        ],
      }).sort({ createdAt: -1 });

      const unreadCount = await Message.countDocuments({
        sender: partnerId,
        receiver: myId,
        isRead: false,
      });

      chatList.push({
        user: partner,
        lastMessage: lastMessage
          ? { text: lastMessage.text, createdAt: lastMessage.createdAt, senderId: lastMessage.sender }
          : null,
        unreadCount,
      });
    }

    // Sort by last message time (most recent first)
    chatList.sort((a, b) => {
      const aTime = a.lastMessage ? new Date(a.lastMessage.createdAt) : new Date(0);
      const bTime = b.lastMessage ? new Date(b.lastMessage.createdAt) : new Date(0);
      return bTime - aTime;
    });

    // For admins, add users they haven't chatted with yet
    if (req.user.role === "admin") {
      const existingIds = new Set(chatList.map((c) => c.user._id.toString()));
      for (const u of allUsers) {
        if (!existingIds.has(u._id.toString())) {
          chatList.push({
            user: u,
            lastMessage: null,
            unreadCount: 0,
          });
        }
      }
    }

    res.json(chatList);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
