import { useState, useEffect, useMemo } from "react";
import { requestLeave, fetchLeaves, reviewLeave } from "../services/api";
import ConfirmModal from "../components/ConfirmModal";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const LEAVE_TYPES = [
  { value: "sick", label: "🤒 Sick Leave", color: "text-red-500", bg: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800" },
  { value: "casual", label: "☕ Casual Leave", color: "text-yellow-500", bg: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800" },
  { value: "vacation", label: "🏖️ Vacation", color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800" },
  { value: "personal", label: "👤 Personal", color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800" },
  { value: "other", label: "📋 Other", color: "text-gray-500", bg: "bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-700" },
];

const STATUS_STYLES = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

// Fetch leave balance from backend
async function fetchBalance() {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}/api/leaves/balance`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return res.json();
}

function BalanceCard({ type, data }) {
  const info = LEAVE_TYPES.find((t) => t.value === type) || { label: type, color: "text-gray-500", bg: "bg-gray-50 dark:bg-gray-700 border-gray-200" };
  const pct = data.total > 0 ? ((data.used / data.total) * 100).toFixed(0) : 0;
  return (
    <div className={`rounded-xl border p-4 ${info.bg}`}>
      <div className="flex justify-between items-start mb-2">
        <div className={`text-xs font-semibold ${info.color}`}>{info.label}</div>
        <div className={`text-xl font-bold ${info.color}`}>{data.remaining}</div>
      </div>
      <div className="text-xs text-gray-500 mb-2">{data.used} used / {data.total} total</div>
      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
        <div className="h-1.5 rounded-full bg-current transition-all duration-500" style={{ width: `${pct}%`, color: "inherit" }} />
      </div>
    </div>
  );
}

export default function Leaves() {
  const [leaves, setLeaves] = useState([]);
  const [balance, setBalance] = useState(null);
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

  // Review modal
  const [reviewModal, setReviewModal] = useState(null); // { leave, status, note }
  const [reviewNote, setReviewNote] = useState("");

  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; }
  }, []);
  const isAdmin = user?.role === "admin";

  useEffect(() => { loadLeaves(); }, []);

  async function loadLeaves() {
    try {
      setLoading(true);
      const [data, bal] = await Promise.all([fetchLeaves(), fetchBalance()]);
      setLeaves(data);
      setBalance(bal);
    } catch { setError("Failed to load data"); }
    finally { setLoading(false); }
  }

  // Form validation
  function validateForm() {
    if (!type || !startDate || !endDate || !reason.trim()) return "All fields are required.";
    if (new Date(endDate) < new Date(startDate)) return "End date must be on or after start date.";
    if (!isAdmin && balance?.balance?.[type]) {
      const { remaining } = balance.balance[type];
      const days = Math.max(1, Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1);
      if (days > remaining) return `Only ${remaining} day(s) of ${type} leave remaining.`;
    }
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) { setError(validationError); return; }
    try {
      setSubmitting(true); setError("");
      await requestLeave(type, startDate, endDate, reason);
      setSuccess("Leave request submitted!");
      setShowForm(false);
      setType("casual"); setStartDate(""); setEndDate(""); setReason("");
      loadLeaves();
    } catch (err) { setError(err.message); }
    finally { setSubmitting(false); }
  }

  async function handleReview(leave, status) {
    try {
      await reviewLeave(leave._id, status, reviewNote);
      setSuccess(`Leave ${status}!`);
      setReviewModal(null);
      setReviewNote("");
      loadLeaves();
    } catch (err) { setError(err.message); }
  }

  // Auto-dismiss success
  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(""), 3000);
      return () => clearTimeout(t);
    }
  }, [success]);

  const filtered = filter === "all" ? leaves : leaves.filter((l) => l.status === filter);
  const stats = {
    pending: leaves.filter((l) => l.status === "pending").length,
    approved: leaves.filter((l) => l.status === "approved").length,
    rejected: leaves.filter((l) => l.status === "rejected").length,
  };

  // Days calculation helper
  function calcDays(startDate, endDate) {
    const s = new Date(startDate);
    const e = new Date(endDate);
    return Math.max(1, Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Leave Management</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-5 py-2.5 rounded-lg font-semibold shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5"
        >
          {showForm ? "✕ Cancel" : "+ Request Leave"}
        </button>
      </div>

      {error && <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-3 rounded-lg text-sm flex items-start gap-2"><span>⚠️</span> {error}</div>}
      {success && <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 p-3 rounded-lg text-sm flex items-center gap-2"><span>✅</span> {success}</div>}

      {/* Leave Balance */}
      {balance?.balance && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Your Leave Balance (Remaining Days)</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {Object.entries(balance.balance).map(([type, data]) => (
              <BalanceCard key={type} type={type} data={data} />
            ))}
          </div>
        </div>
      )}

      {/* Status Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { key: "pending", label: "Pending", color: "text-yellow-500", bg: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200" },
          { key: "approved", label: "Approved", color: "text-green-500", bg: "bg-green-50 dark:bg-green-900/20 border-green-200" },
          { key: "rejected", label: "Rejected", color: "text-red-500", bg: "bg-red-50 dark:bg-red-900/20 border-red-200" },
        ].map((s) => (
          <button
            key={s.key}
            onClick={() => setFilter(filter === s.key ? "all" : s.key)}
            className={`rounded-xl border p-4 text-center transition hover:-translate-y-0.5 ${s.bg} ${filter === s.key ? "ring-2 ring-current" : ""}`}
          >
            <div className={`text-2xl font-bold ${s.color}`}>{stats[s.key]}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </button>
        ))}
      </div>

      {/* Request Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-4 border dark:border-gray-700">
          <h2 className="text-lg font-semibold">New Leave Request</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Leave Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                {LEAVE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label} {balance?.balance?.[t.value] ? `(${balance.balance[t.value].remaining} days left)` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required
                min={new Date().toISOString().split("T")[0]}
                className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required
                min={startDate || new Date().toISOString().split("T")[0]}
                className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Reason</label>
              <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} required
                placeholder="Briefly describe your reason..."
                className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>
          </div>

          {startDate && endDate && new Date(endDate) >= new Date(startDate) && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm text-blue-700 dark:text-blue-300">
              📅 Requesting <strong>{calcDays(startDate, endDate)} day(s)</strong> of {type} leave
              {balance?.balance?.[type] && ` · ${balance.balance[type].remaining} day(s) available`}
            </div>
          )}

          <button type="submit" disabled={submitting}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold disabled:opacity-50 transition">
            {submitting ? "Submitting..." : "Submit Request"}
          </button>
        </form>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {["all", "pending", "approved", "rejected"].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-all ${filter === f ? "bg-blue-500 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"}`}>
            {f} {f !== "all" && <span className="ml-1 opacity-70">({stats[f] || 0})</span>}
          </button>
        ))}
      </div>

      {/* Leave List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden border dark:border-gray-700">
        {loading ? (
          <div className="p-8 text-center text-gray-500 animate-pulse">Loading leaves...</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <div className="text-4xl mb-3">🏖️</div>
            <div className="text-gray-500 font-medium">No leave requests found</div>
          </div>
        ) : (
          <div className="divide-y dark:divide-gray-700">
            {filtered.map((leave) => {
              const days = calcDays(leave.startDate, leave.endDate);
              const typeInfo = LEAVE_TYPES.find((t) => t.value === leave.type);
              return (
                <div key={leave._id} className="p-4 flex items-start justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">{leave.user?.email || "Unknown"}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[leave.status]}`}>{leave.status}</span>
                      <span className="text-xs text-gray-500">{typeInfo?.label || leave.type}</span>
                      <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">{days} day{days !== 1 ? "s" : ""}</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(leave.startDate).toLocaleDateString()} → {new Date(leave.endDate).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 italic">"{leave.reason}"</div>
                    {leave.reviewNote && (
                      <div className="text-xs text-gray-400 mt-1">💬 Admin note: {leave.reviewNote}</div>
                    )}
                  </div>
                  {isAdmin && leave.status === "pending" && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => { setReviewModal({ leave, status: "approved" }); setReviewNote(""); }}
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition"
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => { setReviewModal({ leave, status: "rejected" }); setReviewNote(""); }}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition"
                      >
                        ✕ Reject
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Review Modal with Note */}
      {reviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full border dark:border-gray-700">
            <div className="p-6">
              <h3 className="text-lg font-bold mb-1">
                {reviewModal.status === "approved" ? "✅ Approve Leave" : "❌ Reject Leave"}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {reviewModal.leave.user?.email} · {LEAVE_TYPES.find((t) => t.value === reviewModal.leave.type)?.label}
                · {calcDays(reviewModal.leave.startDate, reviewModal.leave.endDate)} day(s)
              </p>
              <label className="block text-sm font-medium mb-2">
                {reviewModal.status === "rejected" ? "Rejection Reason (required)" : "Note (optional)"}
              </label>
              <textarea
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder={reviewModal.status === "rejected" ? "Why is this leave being rejected?" : "Any notes for the employee..."}
                rows={3}
                required={reviewModal.status === "rejected"}
                className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm resize-none"
              />
            </div>
            <div className="flex gap-3 px-6 pb-6 justify-end">
              <button onClick={() => setReviewModal(null)} className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm font-medium transition">Cancel</button>
              <button
                onClick={() => handleReview(reviewModal.leave, reviewModal.status)}
                disabled={reviewModal.status === "rejected" && !reviewNote.trim()}
                className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition disabled:opacity-50 ${reviewModal.status === "approved" ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"}`}
              >
                Confirm {reviewModal.status === "approved" ? "Approval" : "Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
