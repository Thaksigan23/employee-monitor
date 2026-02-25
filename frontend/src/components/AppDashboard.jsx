import { useEffect, useState, useMemo } from "react";
import { fetchActivities } from "../services/api";
import Heatmap from "./Heatmap";
import ActivityLineChart from "./ActivityLineChart";

// ---------- Small UI Components ----------
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
        <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
        <div className="text-3xl font-bold">{value}</div>
      </div>
    </div>
  );
}

// ---------- Helpers ----------
function getLatestStatusByEmployee(activities) {
  const map = new Map();

  for (const a of activities) {
    if (!map.has(a.employeeId)) {
      map.set(a.employeeId, a.status);
    }
  }

  const counts = { Active: 0, Idle: 0, Suspicious: 0 };

  for (const status of map.values()) {
    if (counts[status] !== undefined) counts[status]++;
  }

  return counts;
}

function buildTimeStats(activities) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const stats = {
    Active: 0,
    Idle: 0,
    Suspicious: 0,
  };

  activities.forEach((a) => {
    const d = new Date(a.createdAt);
    if (d >= today) {
      if (stats[a.status] !== undefined) {
        stats[a.status] += 1; // each record ≈ 1 minute
      }
    }
  });

  return {
    activeMinutes: stats.Active,
    idleMinutes: stats.Idle,
    suspiciousMinutes: stats.Suspicious,
    totalMinutes: stats.Active + stats.Idle + stats.Suspicious,
  };
}

// ---------- Main Dashboard Component ----------
export default function AppDashboard() {
  const [activities, setActivities] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("ALL");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // Safe user parsing
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);

  const isAdmin = user?.role === "admin";

  async function loadData() {
    try {
      setLoading(true);
      const data = await fetchActivities();
      setActivities(data);
      setError("");
    } catch {
      setError("Failed to load data from backend");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const employees = useMemo(
    () => Array.from(new Set(activities.map((a) => a.employeeId))),
    [activities]
  );

  const filteredActivities = useMemo(() => {
    if (!isAdmin) {
      if (!user?.email && !user?.id) return [];
      return activities.filter(
        (a) => a.employeeId === user.email || a.employeeId === user.id
      );
    }

    if (selectedEmployee !== "ALL") {
      return activities.filter((a) => a.employeeId === selectedEmployee);
    }

    return activities;
  }, [activities, selectedEmployee, isAdmin, user]);

  const stats = useMemo(
    () => getLatestStatusByEmployee(filteredActivities),
    [filteredActivities]
  );

  const timeStats = useMemo(
    () => buildTimeStats(filteredActivities),
    [filteredActivities]
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold">Employee Activity Dashboard</h1>

        {isAdmin && (
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-500">Filter:</label>
            <select
              className="border rounded-lg px-4 py-2 bg-white dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
            >
              <option value="ALL">All Employees</option>
              {employees.map((emp) => (
                <option key={emp} value={emp}>
                  {emp}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Live Status Cards */}
      {isAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard label="Active Now" value={stats.Active} color="bg-green-500" icon="✅" />
          <StatCard label="Idle Now" value={stats.Idle} color="bg-yellow-500" icon="⏸️" />
          <StatCard label="Suspicious Now" value={stats.Suspicious} color="bg-red-500" icon="⚠️" />
        </div>
      )}

      {/* Time Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Active Time (Today)" value={`${timeStats.activeMinutes} min`} color="bg-green-500" icon="⏱️" />
        <StatCard label="Idle Time (Today)" value={`${timeStats.idleMinutes} min`} color="bg-yellow-500" icon="💤" />
        <StatCard label="Suspicious Time (Today)" value={`${timeStats.suspiciousMinutes} min`} color="bg-red-500" icon="🚨" />
        <StatCard label="Total Tracked" value={`${timeStats.totalMinutes} min`} color="bg-blue-500" icon="📊" />
      </div>

      {/* Breakdown Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 border dark:border-gray-700">
        <h2 className="font-semibold mb-3">Today’s Activity Breakdown</h2>

        {timeStats.totalMinutes === 0 ? (
          <div className="text-gray-500">No data for today</div>
        ) : (
          <>
            <div className="w-full h-4 rounded-full overflow-hidden flex">
              <div
                className="bg-green-500"
                style={{ width: `${(timeStats.activeMinutes / timeStats.totalMinutes) * 100}%` }}
              />
              <div
                className="bg-yellow-500"
                style={{ width: `${(timeStats.idleMinutes / timeStats.totalMinutes) * 100}%` }}
              />
              <div
                className="bg-red-500"
                style={{ width: `${(timeStats.suspiciousMinutes / timeStats.totalMinutes) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-sm mt-2 text-gray-500">
              <span>Active</span>
              <span>Idle</span>
              <span>Suspicious</span>
            </div>
          </>
        )}
      </div>

      {error && <div className="bg-red-100 text-red-700 p-3 rounded-lg">{error}</div>}

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow border dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b dark:border-gray-700 font-semibold">Activity Logs</div>

        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading data...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                <tr>
                  <th className="p-3 text-left">Employee</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Window</th>
                  <th className="p-3 text-left">Time</th>
                </tr>
              </thead>
              <tbody>
                {filteredActivities.map((a) => (
                  <tr
                    key={a._id}
                    className={`border-t dark:border-gray-700 transition ${
                      a.status === "Suspicious"
                        ? "bg-red-50 dark:bg-red-900/20"
                        : "hover:bg-gray-100 dark:hover:bg-gray-700/60"
                    }`}
                  >
                    <td className="p-3 font-medium">{a.employeeId}</td>
                    <td className="p-3"><StatusBadge status={a.status} /></td>
                    <td className="p-3 text-gray-600 dark:text-gray-300 truncate max-w-md">
                      {a.windowTitle}
                    </td>
                    <td className="p-3 text-gray-500">
                      {new Date(a.createdAt).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}

                {filteredActivities.length === 0 && (
                  <tr>
                    <td colSpan="4" className="p-6 text-center text-gray-500">
                      No data to display
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 border dark:border-gray-700">
          <h2 className="font-semibold mb-3">Activity Trend</h2>
          <ActivityLineChart activities={filteredActivities} />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 border dark:border-gray-700">
          <h2 className="font-semibold mb-3">Daily Activity Pulse</h2>
          <Heatmap activities={filteredActivities} />
        </div>
      </div>
    </div>
  );
}