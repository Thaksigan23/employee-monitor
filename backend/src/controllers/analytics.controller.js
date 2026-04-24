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

// Team Leaderboard — ranks users by productivity score
exports.getLeaderboard = async (req, res) => {
  try {
    const { period = "week" } = req.query;

    let since;
    const now = new Date();
    if (period === "day") {
      since = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === "month") {
      since = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      // Default: week
      const dayOfWeek = now.getDay();
      since = new Date(now);
      since.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      since.setHours(0, 0, 0, 0);
    }

    const stats = await Activity.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: "$user",
          totalLogs: { $sum: 1 },
          activeLogs: { $sum: { $cond: [{ $eq: ["$status", "Active"] }, 1, 0] } },
          idleLogs: { $sum: { $cond: [{ $eq: ["$status", "Idle"] }, 1, 0] } },
          suspiciousLogs: { $sum: { $cond: [{ $eq: ["$status", "Suspicious"] }, 1, 0] } },
          titles: { $push: "$windowTitle" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      { $unwind: "$userInfo" },
    ]);

    const leaderboard = stats
      .map((s) => {
        let productiveLogs = 0;
        let unproductiveLogs = 0;

        s.titles.forEach((title) => {
          if (!title) return;
          const lower = title.toLowerCase();
          const isProd = PRODUCTIVE_KEYWORDS.some((k) => lower.includes(k));
          const isUnprod = UNPRODUCTIVE_KEYWORDS.some((k) => lower.includes(k));
          if (isProd) productiveLogs++;
          if (isUnprod) unproductiveLogs++;
        });

        const totalEval = productiveLogs + unproductiveLogs;
        let score = 100;
        if (totalEval > 0) {
          score = Math.round((productiveLogs / totalEval) * 100);
        } else if (s.activeLogs === 0) {
          score = 0;
        }

        return {
          userId: s.userInfo._id,
          email: s.userInfo.email,
          name: s.userInfo.name || s.userInfo.email.split("@")[0],
          department: s.userInfo.department || "General",
          totalMinutes: s.totalLogs,
          activeMinutes: s.activeLogs,
          idleMinutes: s.idleLogs,
          suspiciousMinutes: s.suspiciousLogs,
          productivityScore: score,
        };
      })
      .sort((a, b) => b.productivityScore - a.productivityScore || b.activeMinutes - a.activeMinutes);

    // Add rank
    leaderboard.forEach((entry, idx) => {
      entry.rank = idx + 1;
    });

    res.json(leaderboard);
  } catch (error) {
    console.error("Error getting leaderboard:", error);
    res.status(500).json({ error: "Failed to get leaderboard" });
  }
};

// Week-over-week trend data
exports.getTrends = async (req, res) => {
  try {
    const { weeks = 4 } = req.query;
    const numWeeks = Math.min(parseInt(weeks) || 4, 12);

    const matchStage = {};
    if (req.user.role !== "admin") {
      matchStage.user = req.user._id;
    }

    const now = new Date();
    const weekData = [];

    for (let i = numWeeks - 1; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i + 1) * 7);
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);

      const activities = await Activity.aggregate([
        {
          $match: {
            ...matchStage,
            createdAt: { $gte: weekStart, $lt: weekEnd },
          },
        },
        {
          $group: {
            _id: null,
            totalLogs: { $sum: 1 },
            activeLogs: { $sum: { $cond: [{ $eq: ["$status", "Active"] }, 1, 0] } },
            idleLogs: { $sum: { $cond: [{ $eq: ["$status", "Idle"] }, 1, 0] } },
            suspiciousLogs: { $sum: { $cond: [{ $eq: ["$status", "Suspicious"] }, 1, 0] } },
            uniqueUsers: { $addToSet: "$user" },
            titles: { $push: "$windowTitle" },
          },
        },
      ]);

      const data = activities[0] || {
        totalLogs: 0,
        activeLogs: 0,
        idleLogs: 0,
        suspiciousLogs: 0,
        uniqueUsers: [],
        titles: [],
      };

      // Calculate productivity score for the week
      let productiveLogs = 0;
      let unproductiveLogs = 0;
      (data.titles || []).forEach((title) => {
        if (!title) return;
        const lower = title.toLowerCase();
        if (PRODUCTIVE_KEYWORDS.some((k) => lower.includes(k))) productiveLogs++;
        if (UNPRODUCTIVE_KEYWORDS.some((k) => lower.includes(k))) unproductiveLogs++;
      });

      const totalEval = productiveLogs + unproductiveLogs;
      let score = 0;
      if (totalEval > 0) {
        score = Math.round((productiveLogs / totalEval) * 100);
      }

      const weekLabel = weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });

      weekData.push({
        week: weekLabel,
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
        totalMinutes: data.totalLogs,
        activeMinutes: data.activeLogs,
        idleMinutes: data.idleLogs,
        suspiciousMinutes: data.suspiciousLogs,
        uniqueUsers: (data.uniqueUsers || []).length,
        productivityScore: score,
      });
    }

    res.json(weekData);
  } catch (error) {
    console.error("Error getting trends:", error);
    res.status(500).json({ error: "Failed to get trends" });
  }
};

// Performance report data (for PDF generation on frontend)
exports.getPerformanceReport = async (req, res) => {
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

    // Daily breakdown
    const dailyStats = await Activity.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            user: "$user",
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          },
          totalLogs: { $sum: 1 },
          activeLogs: { $sum: { $cond: [{ $eq: ["$status", "Active"] }, 1, 0] } },
          idleLogs: { $sum: { $cond: [{ $eq: ["$status", "Idle"] }, 1, 0] } },
          suspiciousLogs: { $sum: { $cond: [{ $eq: ["$status", "Suspicious"] }, 1, 0] } },
          titles: { $push: "$windowTitle" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id.user",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      { $unwind: "$userInfo" },
      { $sort: { "_id.date": 1 } },
    ]);

    // Build report
    const report = {
      generatedAt: new Date().toISOString(),
      period: {
        start: start || "All time",
        end: end || "Now",
      },
      summary: {
        totalDays: 0,
        totalActiveMinutes: 0,
        totalIdleMinutes: 0,
        totalSuspiciousMinutes: 0,
        avgProductivityScore: 0,
      },
      daily: [],
      topApps: [],
    };

    let totalScore = 0;

    dailyStats.forEach((stat) => {
      let productiveLogs = 0;
      let unproductiveLogs = 0;

      stat.titles.forEach((title) => {
        if (!title) return;
        const lower = title.toLowerCase();
        if (PRODUCTIVE_KEYWORDS.some((k) => lower.includes(k))) productiveLogs++;
        if (UNPRODUCTIVE_KEYWORDS.some((k) => lower.includes(k))) unproductiveLogs++;
      });

      const totalEval = productiveLogs + unproductiveLogs;
      let score = 100;
      if (totalEval > 0) score = Math.round((productiveLogs / totalEval) * 100);
      else if (stat.activeLogs === 0) score = 0;

      totalScore += score;
      report.summary.totalActiveMinutes += stat.activeLogs;
      report.summary.totalIdleMinutes += stat.idleLogs;
      report.summary.totalSuspiciousMinutes += stat.suspiciousLogs;

      report.daily.push({
        date: stat._id.date,
        email: stat.userInfo.email,
        name: stat.userInfo.name || stat.userInfo.email.split("@")[0],
        activeMinutes: stat.activeLogs,
        idleMinutes: stat.idleLogs,
        suspiciousMinutes: stat.suspiciousLogs,
        productivityScore: score,
      });
    });

    report.summary.totalDays = dailyStats.length;
    report.summary.avgProductivityScore = dailyStats.length > 0
      ? Math.round(totalScore / dailyStats.length)
      : 0;

    // Top apps from the activities
    const activities = await Activity.find(matchStage).select("windowTitle");
    const appCounts = {};
    activities.forEach((a) => {
      if (!a.windowTitle || a.windowTitle === "Private Activity") return;
      const parts = a.windowTitle.split(" - ");
      const appName = parts.length > 1 ? parts[parts.length - 1].trim() : parts[0].trim();
      const normalized = appName.substring(0, 40);
      appCounts[normalized] = (appCounts[normalized] || 0) + 1;
    });

    report.topApps = Object.entries(appCounts)
      .map(([app, count]) => ({ app, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    res.json(report);
  } catch (error) {
    console.error("Error generating performance report:", error);
    res.status(500).json({ error: "Failed to generate report" });
  }
};
