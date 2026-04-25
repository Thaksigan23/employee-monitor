import { useEffect, useMemo, useState } from "react";
import { fetchActivities } from "../services/api";

const PAGE_SIZE = 25;

function getEmployeeLabel(activity) {
  return activity.user?.email || "Unknown employee";
}

function StatusBadge({ status }) {
  const styles = {
    Active: "bg-green-100 text-green-700 border border-green-300",
    Idle: "bg-yellow-100 text-yellow-700 border border-yellow-300",
    Suspicious: "bg-red-100 text-red-700 border border-red-300",
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status] || "bg-gray-100 text-gray-700 border"}`}>
      {status}
    </span>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-t dark:border-gray-700 animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <td key={i} className="p-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
        </td>
      ))}
    </tr>
  );
}

export default function Activity() {
  const [activities, setActivities] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

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
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Reset to page 1 on filter change
  useEffect(() => { setPage(1); }, [search, statusFilter]);

  const filteredActivities = useMemo(() => {
    let list = activities;
    if (statusFilter !== "ALL") {
      list = list.filter((a) => a.status === statusFilter);
    }
    if (search.trim()) {
      const query = search.toLowerCase();
      list = list.filter(
        (a) =>
          getEmployeeLabel(a).toLowerCase().includes(query) ||
          (a.windowTitle || "").toLowerCase().includes(query)
      );
    }
    return list;
  }, [activities, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredActivities.length / PAGE_SIZE));
  const paginated = filteredActivities.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Status summary counts
  const statusCounts = useMemo(() => ({
    Active: activities.filter((a) => a.status === "Active").length,
    Idle: activities.filter((a) => a.status === "Idle").length,
    Suspicious: activities.filter((a) => a.status === "Suspicious").length,
  }), [activities]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Activity Logs</h1>
          <p className="text-sm text-gray-500 mt-1">{activities.length} total records · auto-refreshes every 10s</p>
        </div>
        <button onClick={loadData} className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition self-start">
          🔄 Refresh
        </button>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Active", count: statusCounts.Active, color: "text-green-500", bg: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" },
          { label: "Idle", count: statusCounts.Idle, color: "text-yellow-500", bg: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800" },
          { label: "Suspicious", count: statusCounts.Suspicious, color: "text-red-500", bg: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800" },
        ].map((s) => (
          <button
            key={s.label}
            onClick={() => setStatusFilter(statusFilter === s.label ? "ALL" : s.label)}
            className={`rounded-xl border p-3 text-center transition hover:-translate-y-0.5 ${s.bg} ${statusFilter === s.label ? "ring-2 ring-offset-1 ring-current" : ""}`}
          >
            <div className={`text-2xl font-bold ${s.color}`}>{s.count}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          placeholder="🔍 Search employee or window..."
          className="flex-1 border rounded-lg px-4 py-2.5 bg-white dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="border rounded-lg px-4 py-2.5 bg-white dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="ALL">All Status</option>
          <option value="Active">Active</option>
          <option value="Idle">Idle</option>
          <option value="Suspicious">Suspicious</option>
        </select>
      </div>

      {error && <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm">{error}</div>}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow border dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
          <span className="font-semibold">Logs</span>
          <span className="text-sm text-gray-400">{filteredActivities.length} results · Page {page}/{totalPages}</span>
        </div>

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
              {loading
                ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                : paginated.map((activity) => (
                    <tr
                      key={activity._id}
                      className={`border-t dark:border-gray-700 transition ${
                        activity.status === "Suspicious"
                          ? "bg-red-50 dark:bg-red-900/20"
                          : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      }`}
                    >
                      <td className="p-3 font-medium">{getEmployeeLabel(activity)}</td>
                      <td className="p-3"><StatusBadge status={activity.status} /></td>
                      <td className="p-3 text-gray-600 dark:text-gray-300 truncate max-w-xs">{activity.windowTitle}</td>
                      <td className="p-3 text-gray-500 whitespace-nowrap">{new Date(activity.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
              {!loading && filteredActivities.length === 0 && (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-gray-500">No results found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t dark:border-gray-700 flex items-center justify-between">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm font-medium disabled:opacity-40 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            >
              ← Prev
            </button>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = page <= 3 ? i + 1 : page - 2 + i;
                if (p < 1 || p > totalPages) return null;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition ${
                      p === page ? "bg-green-500 text-white" : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm font-medium disabled:opacity-40 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
