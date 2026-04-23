import { useEffect, useState, useMemo, useCallback } from "react";
import { fetchActivities, clearActivities, fetchAppUsage } from "../services/api";
import Heatmap from "./Heatmap";
import ActivityLineChart from "./ActivityLineChart";

/* ===========================
   Small UI Components
=========================== */

function StatusBadge({ status }) {
  const styles = {
    Active: "bg-green-100 text-green-700 border border-green-300",
    Idle: "bg-yellow-100 text-yellow-700 border border-yellow-300",
    Suspicious: "bg-red-100 text-red-700 border border-red-300",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold ${
        styles[status] || "bg-gray-100 text-gray-700 border"
      }`}
    >
      {status}
    </span>
  );
}

function StatCard({ label, value, color, icon }) {
  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-xl p-5 flex items-center gap-4">
      <div
        className={`w-12 h-12 flex items-center justify-center rounded-lg text-white ${color}`}
      >
        <span className="text-2xl">{icon}</span>
      </div>

      <div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {label}
        </div>
        <div className="text-3xl font-bold">{value}</div>
      </div>
    </div>
  );
}

/* ===========================
   Helper Functions
=========================== */

function getLatestStatusByEmployee(activities) {
  const map = new Map();

  for (const a of activities) {
    const id = a.user?._id || a.user;

    if (!map.has(id)) {
      map.set(id, a.status);
    }
  }

  const counts = { Active: 0, Idle: 0, Suspicious: 0 };

  for (const status of map.values()) {
    if (counts[status] !== undefined) {
      counts[status]++;
    }
  }

  return counts;
}

function buildTimeStats(activities) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const stats = { Active: 0, Idle: 0, Suspicious: 0 };

  activities.forEach((a) => {
    const d = new Date(a.createdAt);

    if (d >= today && stats[a.status] !== undefined) {
      stats[a.status]++;
    }
  });

  const total =
    stats.Active + stats.Idle + stats.Suspicious;

  return {
    activeMinutes: stats.Active,
    idleMinutes: stats.Idle,
    suspiciousMinutes: stats.Suspicious,
    totalMinutes: total,
  };
}

/* ===========================
   Main Component
=========================== */

export default function AppDashboard() {

  const [activities, setActivities] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [appUsage, setAppUsage] = useState([]);

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);

  const isAdmin = user?.role === "admin";

  /* ===========================
     Load Activities
  =========================== */

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const data = await fetchActivities({
        userId:
          isAdmin && selectedEmployee !== "ALL"
            ? selectedEmployee
            : null,
      });

      setActivities(data);
      setError("");

      // Also load app usage
      try {
        const usage = await fetchAppUsage();
        setAppUsage(usage);
      } catch {}

    } catch {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }

  }, [isAdmin, selectedEmployee]);

  useEffect(() => {

    loadData();

    const interval = setInterval(loadData, 5000);

    return () => clearInterval(interval);

  }, [loadData]);

  /* ===========================
     Derived Data
  =========================== */

  const employees = useMemo(() => {

    if (!isAdmin) return [];

    const map = new Map();

    activities.forEach((a) => {
      if (a.user?._id) {
        map.set(a.user._id, a.user.email);
      }
    });

    return Array.from(map.entries());

  }, [activities, isAdmin]);

  const stats = useMemo(
    () => getLatestStatusByEmployee(activities),
    [activities]
  );

  const timeStats = useMemo(
    () => buildTimeStats(activities),
    [activities]
  );

  const percentage = (value) =>
    timeStats.totalMinutes === 0
      ? 0
      : (value / timeStats.totalMinutes) * 100;

  /* ===========================
     CSV Export
  =========================== */

  const exportToCSV = () => {

    if (!activities.length) {
      alert("No data to export");
      return;
    }

    const headers = [
      "Employee",
      "Status",
      "Window Title",
      "Private",
      "Date",
      "Time",
    ];

    const rows = activities.map((a) => {

      const date = new Date(a.createdAt);

      return [
        a.user?.email || "",
        a.status,
        `"${(a.windowTitle || "").replace(/"/g, '""')}"`,
        a.isPrivate ? "Yes" : "No",
        date.toLocaleDateString(),
        date.toLocaleTimeString(),
      ];

    });

    const csvContent =
      [headers, ...rows]
        .map((row) => row.join(","))
        .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;

    link.download = `activity-report-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

  };

  /* ===========================
     Clear Activities
  =========================== */

  const handleClear = async () => {

    if (!window.confirm("Delete activity logs?")) return;

    try {

      await clearActivities(
        isAdmin && selectedEmployee !== "ALL"
          ? selectedEmployee
          : null
      );

      loadData();

    } catch {

      alert("Failed to clear activities");

    }

  };

  /* ===========================
     UI
  =========================== */

  return (

    <div className="space-y-8">

      {/* Header */}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

        <h1 className="text-3xl font-bold">
          Employee Activity Dashboard
        </h1>

        <div className="flex gap-3 items-center">

          {isAdmin && (

            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="border rounded-lg px-4 py-2 bg-white dark:bg-gray-800"
            >

              <option value="ALL">All Employees</option>

              {employees.map(([id, email]) => (
                <option key={id} value={id}>
                  {email}
                </option>
              ))}

            </select>

          )}

          <button
            onClick={exportToCSV}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Export CSV
          </button>

          <button
            onClick={handleClear}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
          >
            Clear Activity
          </button>

        </div>

      </div>

      {/* Live Status */}

      {isAdmin && (

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

          <StatCard label="Active Now" value={stats.Active} color="bg-green-500" icon="✅" />
          <StatCard label="Idle Now" value={stats.Idle} color="bg-yellow-500" icon="⏸️" />
          <StatCard label="Suspicious Now" value={stats.Suspicious} color="bg-red-500" icon="⚠️" />

        </div>

      )}

      {/* Charts */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
          <h2 className="font-semibold mb-3">Activity Trend</h2>

          <div style={{ width: "100%", height: 300 }}>
            <ActivityLineChart activities={activities} />
          </div>

        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
          <h2 className="font-semibold mb-3">Daily Activity Pulse</h2>

          <div style={{ width: "100%", height: 300 }}>
            <Heatmap activities={activities} />
          </div>

        </div>

      </div>

      {/* App Usage Breakdown */}
      {appUsage.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <h2 className="font-semibold mb-4 text-lg">📱 App Usage Breakdown</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bar Chart */}
            <div className="space-y-3">
              {appUsage.slice(0, 8).map((app, i) => {
                const maxCount = appUsage[0]?.count || 1;
                const pct = Math.round((app.count / maxCount) * 100);
                const colors = [
                  "bg-blue-500", "bg-indigo-500", "bg-purple-500", "bg-pink-500",
                  "bg-cyan-500", "bg-teal-500", "bg-orange-500", "bg-green-500",
                ];
                return (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium truncate mr-2">{app.app}</span>
                      <span className="text-gray-400 flex-shrink-0">{app.count} logs</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div className={`h-3 rounded-full ${colors[i % colors.length]} transition-all duration-500`}
                        style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Summary */}
            <div className="flex flex-col items-center justify-center">
              <div className="text-5xl font-bold text-blue-500">{appUsage.length}</div>
              <div className="text-gray-500 mt-1">Unique Apps Tracked</div>
              <div className="mt-4 text-sm text-gray-400">
                Total logs: {appUsage.reduce((s, a) => s + a.count, 0)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table */}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">

        <div className="p-4 border-b font-semibold">
          Activity Logs
        </div>

        {loading ? (

          <div className="p-6 text-center">
            Loading data...
          </div>

        ) : (

          <table className="w-full text-sm">

            <thead className="bg-gray-50 dark:bg-gray-700">

              <tr>
                <th className="p-3 text-left">Employee</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Window</th>
                <th className="p-3 text-left">Time</th>
              </tr>

            </thead>

            <tbody>

              {activities.map((a) => (

                <tr key={a._id} className="border-t">

                  <td className="p-3">
                    {a.user?.email}
                  </td>

                  <td className="p-3">
                    <StatusBadge status={a.status} />
                  </td>

                  <td className="p-3">
                    {a.windowTitle}
                  </td>

                  <td className="p-3 text-gray-500">
                    {new Date(a.createdAt).toLocaleTimeString()}
                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        )}

      </div>

    </div>

  );

}
