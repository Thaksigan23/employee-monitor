import { useEffect, useState, useMemo } from "react";
import { fetchActivities } from "./services/api";
import Heatmap from "./components/Heatmap";
import ActivityLineChart from "./components/ActivityLineChart";
import Layout from "./components/Layout";

// ---------- Small UI Components ----------

function StatusBadge({ status }) {
  const colors = {
    Active: "bg-green-500",
    Idle: "bg-yellow-500",
    Suspicious: "bg-red-500",
  };

  return (
    <span
      className={`px-2 py-1 text-white rounded ${
        colors[status] || "bg-gray-500"
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

// ---------- Main App ----------

function App() {
  const [activities, setActivities] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("ALL");
  const [error, setError] = useState("");

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
      const data = await fetchActivities();
      setActivities(data);
      setError("");
    } catch {
      setError("Failed to load data from backend");
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

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Employee Activity Dashboard</h1>

        {isAdmin && (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 flex items-center gap-4">
            <label className="font-medium">Filter by Employee:</label>
            <select
              className="border rounded-lg px-4 py-2 dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
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

        {isAdmin && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard label="Active Now" value={stats.Active} color="bg-green-500" icon="✅" />
            <StatCard label="Idle Now" value={stats.Idle} color="bg-yellow-500" icon="⏸️" />
            <StatCard label="Suspicious Now" value={stats.Suspicious} color="bg-red-500" icon="⚠️" />
          </div>
        )}

        {error && <div className="text-red-600">{error}</div>}

        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-4 overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700 text-left">
                <th className="p-3 border-b dark:border-gray-600">Employee</th>
                <th className="p-3 border-b dark:border-gray-600">Status</th>
                <th className="p-3 border-b dark:border-gray-600">Window</th>
                <th className="p-3 border-b dark:border-gray-600">Time</th>
              </tr>
            </thead>
            <tbody>
              {filteredActivities.map((a) => (
                <tr key={a._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="p-3 border-b dark:border-gray-700">{a.employeeId}</td>
                  <td className="p-3 border-b dark:border-gray-700">
                    <StatusBadge status={a.status} />
                  </td>
                  <td className="p-3 border-b dark:border-gray-700">{a.windowTitle}</td>
                  <td className="p-3 border-b dark:border-gray-700">
                    {new Date(a.createdAt).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
              {filteredActivities.length === 0 && (
                <tr>
                  <td colSpan="4" className="p-4 text-center text-gray-500">
                    No data to display
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 shadow rounded-xl p-4">
            <h2 className="font-semibold mb-3">Activity Trend</h2>
            <ActivityLineChart activities={filteredActivities} />
          </div>

          <div className="bg-white dark:bg-gray-800 shadow rounded-xl p-4">
            <h2 className="font-semibold mb-3">Daily Activity Pulse</h2>
            <Heatmap activities={filteredActivities} />
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default App;