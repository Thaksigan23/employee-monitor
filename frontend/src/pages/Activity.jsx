import { useEffect, useMemo, useState } from "react";
import { fetchActivities } from "../services/api";

// Reuse badge style
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

export default function Activity() {
  const [activities, setActivities] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
      setError("Failed to load activity logs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredActivities = useMemo(() => {
    let list = activities;

    // Employee can only see their own
    if (!isAdmin) {
      if (!user?.email && !user?.id) return [];
      list = list.filter(
        (a) => a.employeeId === user.email || a.employeeId === user.id
      );
    }

    // Status filter
    if (statusFilter !== "ALL") {
      list = list.filter((a) => a.status === statusFilter);
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.employeeId.toLowerCase().includes(q) ||
          (a.windowTitle || "").toLowerCase().includes(q)
      );
    }

    return list;
  }, [activities, search, statusFilter, isAdmin, user]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold">Activity Logs</h1>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Search employee or window..."
            className="border rounded-lg px-4 py-2 bg-white dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="border rounded-lg px-4 py-2 bg-white dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Status</option>
            <option value="Active">Active</option>
            <option value="Idle">Idle</option>
            <option value="Suspicious">Suspicious</option>
          </select>
        </div>
      </div>

      {error && <div className="bg-red-100 text-red-700 p-3 rounded-lg">{error}</div>}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow border dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b dark:border-gray-700 font-semibold">
          Logs ({filteredActivities.length})
        </div>

        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading...</div>
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
                    <td className="p-3">
                      <StatusBadge status={a.status} />
                    </td>
                    <td className="p-3 text-gray-600 dark:text-gray-300 truncate max-w-md">
                      {a.windowTitle}
                    </td>
                    <td className="p-3 text-gray-500">
                      {new Date(a.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}

                {filteredActivities.length === 0 && (
                  <tr>
                    <td colSpan="4" className="p-6 text-center text-gray-500">
                      No results found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}