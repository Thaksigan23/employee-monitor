import { useState, useEffect, useMemo } from "react";
import { createAnnouncement, fetchAnnouncements, markAnnouncementRead } from "../services/api";

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("normal");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; }
  }, []);
  const isAdmin = user?.role === "admin";

  useEffect(() => { loadAnnouncements(); }, []);

  async function loadAnnouncements() {
    try {
      setLoading(true);
      const data = await fetchAnnouncements();
      setAnnouncements(data);
    } catch { setError("Failed to load announcements"); }
    finally { setLoading(false); }
  }

  async function handleCreate(e) {
    e.preventDefault();
    try {
      setSubmitting(true);
      await createAnnouncement(title, message, priority);
      setSuccess("Announcement sent to all employees!");
      setShowForm(false);
      setTitle(""); setMessage(""); setPriority("normal");
      loadAnnouncements();
    } catch (err) { setError(err.message); }
    finally { setSubmitting(false); }
  }

  async function handleMarkRead(id) {
    await markAnnouncementRead(id);
    loadAnnouncements();
  }

  function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">📢 Announcements</h1>
        {isAdmin && (
          <button onClick={() => setShowForm(!showForm)}
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-5 py-2.5 rounded-lg font-semibold shadow-lg shadow-orange-500/20 transition-all hover:-translate-y-0.5">
            {showForm ? "✕ Cancel" : "📣 New Announcement"}
          </button>
        )}
      </div>

      {error && <div className="bg-red-100 text-red-700 p-3 rounded-lg">{error}</div>}
      {success && <div className="bg-green-100 text-green-700 p-3 rounded-lg">{success}</div>}

      {/* Create Form (admin only) */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-4 border dark:border-gray-700">
          <h2 className="text-lg font-semibold">Broadcast to All Employees</h2>
          <input type="text" placeholder="Announcement Title" value={title} onChange={e => setTitle(e.target.value)} required
            className="w-full border rounded-lg px-4 py-3 dark:bg-gray-700 dark:border-gray-600 text-lg font-medium" />
          <textarea placeholder="Message content..." value={message} onChange={e => setMessage(e.target.value)} required rows={4}
            className="w-full border rounded-lg px-4 py-3 dark:bg-gray-700 dark:border-gray-600" />
          <div className="flex items-center gap-4">
            <select value={priority} onChange={e => setPriority(e.target.value)}
              className="border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600">
              <option value="normal">🟢 Normal</option>
              <option value="urgent">🔴 Urgent</option>
            </select>
            <button type="submit" disabled={submitting}
              className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg font-semibold disabled:opacity-50">
              {submitting ? "Sending..." : "📣 Send to Everyone"}
            </button>
          </div>
        </form>
      )}

      {/* Announcements List */}
      {loading ? (
        <div className="text-center text-gray-500 py-8">Loading...</div>
      ) : announcements.length === 0 ? (
        <div className="text-center text-gray-400 py-12">
          <div className="text-5xl mb-3">📭</div>
          <p>No announcements yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map(a => (
            <div key={a._id}
              className={`bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 border-l-4 transition-all hover:shadow-lg ${
                a.priority === "urgent" ? "border-l-red-500" : "border-l-blue-500"
              } ${!a.isRead ? "ring-2 ring-blue-200 dark:ring-blue-800" : ""}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {a.priority === "urgent" && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold animate-pulse">URGENT</span>}
                    <h3 className="text-lg font-bold">{a.title}</h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap mt-1">{a.message}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                    <span>By {a.sender?.email}</span>
                    <span>{timeAgo(a.createdAt)}</span>
                    {isAdmin && <span>{a.readCount} read</span>}
                  </div>
                </div>
                {!a.isRead && (
                  <button onClick={() => handleMarkRead(a._id)}
                    className="text-blue-500 hover:text-blue-700 text-sm font-medium ml-4 flex-shrink-0">
                    Mark as Read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
