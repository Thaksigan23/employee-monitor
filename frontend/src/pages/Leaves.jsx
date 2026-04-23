import { useState, useEffect, useMemo } from "react";
import { requestLeave, fetchLeaves, reviewLeave } from "../services/api";

const LEAVE_TYPES = [
  { value: "sick", label: "🤒 Sick Leave", color: "text-red-500" },
  { value: "casual", label: "☕ Casual Leave", color: "text-yellow-500" },
  { value: "vacation", label: "🏖️ Vacation", color: "text-blue-500" },
  { value: "personal", label: "👤 Personal", color: "text-purple-500" },
  { value: "other", label: "📋 Other", color: "text-gray-500" },
];

const STATUS_STYLES = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export default function Leaves() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form state
  const [type, setType] = useState("casual");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; }
  }, []);
  const isAdmin = user?.role === "admin";

  useEffect(() => { loadLeaves(); }, []);

  async function loadLeaves() {
    try {
      setLoading(true);
      const data = await fetchLeaves();
      setLeaves(data);
    } catch { setError("Failed to load leaves"); }
    finally { setLoading(false); }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setSubmitting(true);
      await requestLeave(type, startDate, endDate, reason);
      setSuccess("Leave request submitted!");
      setShowForm(false);
      setType("casual"); setStartDate(""); setEndDate(""); setReason("");
      loadLeaves();
    } catch (err) { setError(err.message); }
    finally { setSubmitting(false); }
  }

  async function handleReview(id, status) {
    try {
      await reviewLeave(id, status);
      setSuccess(`Leave ${status}!`);
      loadLeaves();
    } catch (err) { setError(err.message); }
  }

  const filtered = filter === "all" ? leaves : leaves.filter(l => l.status === filter);

  const stats = {
    pending: leaves.filter(l => l.status === "pending").length,
    approved: leaves.filter(l => l.status === "approved").length,
    rejected: leaves.filter(l => l.status === "rejected").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Leave Management</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-5 py-2.5 rounded-lg font-semibold shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5">
          {showForm ? "✕ Cancel" : "+ Request Leave"}
        </button>
      </div>

      {error && <div className="bg-red-100 text-red-700 p-3 rounded-lg">{error}</div>}
      {success && <div className="bg-green-100 text-green-700 p-3 rounded-lg">{success}</div>}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 text-center">
          <div className="text-2xl font-bold text-yellow-500">{stats.pending}</div>
          <div className="text-sm text-gray-500">Pending</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 text-center">
          <div className="text-2xl font-bold text-green-500">{stats.approved}</div>
          <div className="text-sm text-gray-500">Approved</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 text-center">
          <div className="text-2xl font-bold text-red-500">{stats.rejected}</div>
          <div className="text-sm text-gray-500">Rejected</div>
        </div>
      </div>

      {/* Request Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-4 border dark:border-gray-700">
          <h2 className="text-lg font-semibold">New Leave Request</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Leave Type</label>
              <select value={type} onChange={e => setType(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600">
                {LEAVE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required
                className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required
                className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Reason</label>
              <input type="text" value={reason} onChange={e => setReason(e.target.value)} required placeholder="Reason for leave..."
                className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600" />
            </div>
          </div>
          <button type="submit" disabled={submitting}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold disabled:opacity-50">
            {submitting ? "Submitting..." : "Submit Request"}
          </button>
        </form>
      )}

      {/* Filter */}
      <div className="flex gap-2">
        {["all", "pending", "approved", "rejected"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-all ${filter === f ? "bg-blue-500 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Leave List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No leave requests found</div>
        ) : (
          <div className="divide-y dark:divide-gray-700">
            {filtered.map(leave => (
              <div key={leave._id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-semibold">{leave.user?.email || "Unknown"}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[leave.status]}`}>
                      {leave.status}
                    </span>
                    <span className="text-xs text-gray-400 capitalize">{leave.type}</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(leave.startDate).toLocaleDateString()} → {new Date(leave.endDate).toLocaleDateString()}
                    <span className="mx-2">·</span>{leave.reason}
                  </div>
                </div>
                {isAdmin && leave.status === "pending" && (
                  <div className="flex gap-2 ml-4">
                    <button onClick={() => handleReview(leave._id, "approved")}
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium">
                      ✓ Approve
                    </button>
                    <button onClick={() => handleReview(leave._id, "rejected")}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium">
                      ✕ Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
