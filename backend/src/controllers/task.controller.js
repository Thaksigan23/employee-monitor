const Task = require("../models/Task");

// Admin sends a task to an employee
exports.createTask = async (req, res) => {
  try {
    const { receiverId, message } = req.body;
    
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Only admins can send tasks" });
    }

    const task = await Task.create({
      sender: req.user._id,
      receiver: receiverId,
      message,
    });

    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Agent polls this to see if there are unread tasks
exports.getPendingTasks = async (req, res) => {
  try {
    const tasks = await Task.find({
      receiver: req.user._id,
      isRead: false,
    }).populate("sender", "email");

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Agent marks task as read after displaying it
exports.markTaskRead = async (req, res) => {
  try {
    const { id } = req.params;
    
    const task = await Task.findOneAndUpdate(
      { _id: id, receiver: req.user._id },
      { isRead: true },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
