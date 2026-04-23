const Activity = require("../models/Activity");
const User = require("../models/User");

// Simple dictionary of productive/unproductive keywords
const PRODUCTIVE_KEYWORDS = ["code", "visual studio", "github", "excel", "sheets", "word", "docs", "jira", "trello", "slack", "teams", "meet", "zoom"];
const UNPRODUCTIVE_KEYWORDS = ["youtube", "netflix", "facebook", "twitter", "instagram", "tiktok", "game", "steam", "reddit"];

exports.getTimesheets = async (req, res) => {
  try {
    const { start, end } = req.query;
    
    const matchStage = {};
    if (start || end) {
      matchStage.createdAt = {};
      if (start) matchStage.createdAt.$gte = new Date(start);
      if (end) matchStage.createdAt.$lte = new Date(end);
    }
    
    // Only admins see all timesheets, users see their own
    if (req.user.role !== "admin") {
      matchStage.user = req.user._id;
    }

    const stats = await Activity.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            user: "$user",
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }
          },
          totalLogs: { $sum: 1 },
          activeLogs: { $sum: { $cond: [{ $eq: ["$status", "Active"] }, 1, 0] } },
          idleLogs: { $sum: { $cond: [{ $eq: ["$status", "Idle"] }, 1, 0] } },
          suspiciousLogs: { $sum: { $cond: [{ $eq: ["$status", "Suspicious"] }, 1, 0] } },
          titles: { $push: "$windowTitle" }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id.user",
          foreignField: "_id",
          as: "userDetails"
        }
      },
      { $unwind: "$userDetails" }
    ]);

    // Calculate times (assuming 1 log = 1 minute based on polling interval) and productivity scores
    const timesheets = stats.map(stat => {
      let productiveLogs = 0;
      let unproductiveLogs = 0;

      stat.titles.forEach(title => {
        if (!title) return;
        const lowerTitle = title.toLowerCase();
        
        const isProductive = PRODUCTIVE_KEYWORDS.some(k => lowerTitle.includes(k));
        const isUnproductive = UNPRODUCTIVE_KEYWORDS.some(k => lowerTitle.includes(k));

        if (isProductive) productiveLogs++;
        if (isUnproductive) unproductiveLogs++;
      });

      // Calculate score (out of active logs, how many are productive vs unproductive)
      const totalEvaluatedLogs = productiveLogs + unproductiveLogs;
      let productivityScore = 100;
      if (totalEvaluatedLogs > 0) {
        productivityScore = Math.round((productiveLogs / totalEvaluatedLogs) * 100);
      } else if (stat.activeLogs === 0) {
        productivityScore = 0;
      }

      return {
        userId: stat.userDetails._id,
        email: stat.userDetails.email,
        date: stat._id.date,
        activeMinutes: stat.activeLogs,
        idleMinutes: stat.idleLogs,
        suspiciousMinutes: stat.suspiciousLogs,
        productivityScore: productivityScore
      };
    });

    res.json(timesheets);
  } catch (error) {
    console.error("Error generating timesheets:", error);
    res.status(500).json({ error: "Failed to generate timesheets" });
  }
};

// App usage breakdown for pie charts
exports.getAppUsage = async (req, res) => {
  try {
    const { userId, start, end } = req.query;
    const matchStage = {};

    if (req.user.role !== "admin") {
      matchStage.user = req.user._id;
    } else if (userId) {
      matchStage.user = new (require("mongoose").Types.ObjectId)(userId);
    }

    if (start || end) {
      matchStage.createdAt = {};
      if (start) matchStage.createdAt.$gte = new Date(start);
      if (end) matchStage.createdAt.$lte = new Date(end);
    }

    const activities = await Activity.find(matchStage).select("windowTitle");

    // Extract app names from window titles
    const appCounts = {};
    activities.forEach((a) => {
      if (!a.windowTitle || a.windowTitle === "Private Activity") return;
      // Try to extract app name (last part after " - " or the whole title)
      const parts = a.windowTitle.split(" - ");
      const appName = parts.length > 1 ? parts[parts.length - 1].trim() : parts[0].trim();
      const normalized = appName.substring(0, 40); // cap length
      appCounts[normalized] = (appCounts[normalized] || 0) + 1;
    });

    // Convert to sorted array
    const usage = Object.entries(appCounts)
      .map(([app, count]) => ({ app, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15); // top 15 apps

    res.json(usage);
  } catch (error) {
    console.error("Error getting app usage:", error);
    res.status(500).json({ error: "Failed to get app usage" });
  }
};
