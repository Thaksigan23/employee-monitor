import { useState, useEffect } from "react";
import { fetchScreenshots, fetchUsers } from "../services/api";

const API_BASE = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace("/api", "")
  : "http://localhost:5000";

const PAGE_SIZE = 12;

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow border dark:border-gray-700 animate-pulse">
      <div className="aspect-video bg-gray-200 dark:bg-gray-700" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
      </div>
    </div>
  );
}

export default function Screenshots() {
  const [screenshots, setScreenshots] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [page, setPage] = useState(1);
  const [dateFilter, setDateFilter] = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user.role === "admin";

  useEffect(() => {
    if (isAdmin) fetchUsers().then(setUsers).catch(console.error);
  }, [isAdmin]);

  useEffect(() => {
    setLoading(true);
    setPage(1);
    fetchScreenshots(selectedUserId)
      .then(setScreenshots)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedUserId]);

  // Filter by date
  const filtered = dateFilter
    ? screenshots.filter((s) => new Date(s.createdAt).toLocaleDateString() === new Date(dateFilter).toLocaleDateString())
    : screenshots;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleKeyDown(e) {
    if (!selectedImage) return;
    const idx = filtered.findIndex((s) => s._id === selectedImage._id);
    if (e.key === "ArrowRight" && idx < filtered.length - 1) setSelectedImage(filtered[idx + 1]);
    if (e.key === "ArrowLeft" && idx > 0) setSelectedImage(filtered[idx - 1]);
    if (e.key === "Escape") setSelectedImage(null);
  }

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedImage, filtered]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">📸 Screenshots</h1>
          <p className="text-sm text-gray-500 mt-1">{filtered.length} screenshots captured</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          {isAdmin && (
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="border rounded-lg px-3 py-2 bg-white dark:bg-gray-800 dark:border-gray-700 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
            >
              <option value="">All Employees</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>{u.name || u.email}</option>
              ))}
            </select>
          )}
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
            className="border rounded-lg px-3 py-2 bg-white dark:bg-gray-800 dark:border-gray-700 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
          />
          {dateFilter && (
            <button onClick={() => setDateFilter("")} className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition">
              Clear ✕
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700">
          <div className="text-5xl mb-3">📸</div>
          <div className="text-gray-500 font-medium">No screenshots found</div>
          <div className="text-sm text-gray-400 mt-1">{dateFilter ? "Try a different date" : "The agent will capture screenshots automatically"}</div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {paginated.map((s) => (
              <div
                key={s._id}
                onClick={() => setSelectedImage(s)}
                className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow border dark:border-gray-700 group cursor-pointer hover:-translate-y-1 transition-all duration-200 hover:shadow-lg"
              >
                <div className="aspect-video bg-gray-100 dark:bg-gray-900 relative overflow-hidden">
                  <img
                    src={`${API_BASE}${s.filePath}`}
                    alt="Screenshot"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
                  />
                  <div className="hidden absolute inset-0 bg-gray-200 dark:bg-gray-700 items-center justify-center text-gray-400 text-sm">
                    Image unavailable
                  </div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center">
                    <span className="text-white text-2xl opacity-0 group-hover:opacity-100 transition-opacity">🔍</span>
                  </div>
                </div>
                <div className="p-3">
                  <div className="font-medium text-sm truncate" title={s.windowTitle}>{s.windowTitle || "Unknown"}</div>
                  <div className="text-xs text-gray-500 flex justify-between mt-1">
                    <span>{new Date(s.createdAt).toLocaleTimeString()}</span>
                    <span>{new Date(s.createdAt).toLocaleDateString()}</span>
                  </div>
                  {isAdmin && <div className="text-xs text-blue-500 mt-1 font-medium truncate">{s.user?.email}</div>}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl p-4 border dark:border-gray-700">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm font-medium disabled:opacity-40 hover:bg-gray-200 dark:hover:bg-gray-600 transition">
                ← Prev
              </button>
              <span className="text-sm text-gray-500">Page {page} of {totalPages} ({filtered.length} total)</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm font-medium disabled:opacity-40 hover:bg-gray-200 dark:hover:bg-gray-600 transition">
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {/* Lightbox Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-5xl w-full shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
              <div>
                <h3 className="font-bold">{selectedImage.windowTitle}</h3>
                <p className="text-sm text-gray-500">
                  {new Date(selectedImage.createdAt).toLocaleString()}
                  {isAdmin && ` · ${selectedImage.user?.email}`}
                </p>
              </div>
              <div className="flex gap-2">
                <a
                  href={`${API_BASE}${selectedImage.filePath}`}
                  download
                  className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition"
                  onClick={(e) => e.stopPropagation()}
                >
                  ⬇ Download
                </a>
                <button onClick={() => setSelectedImage(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition text-gray-500">✕</button>
              </div>
            </div>
            <img src={`${API_BASE}${selectedImage.filePath}`} alt="Full Screenshot" className="w-full max-h-[75vh] object-contain bg-black" />
            {/* Navigation arrows */}
            <div className="flex justify-between p-3 border-t dark:border-gray-700">
              <button
                onClick={(e) => { e.stopPropagation(); const idx = filtered.findIndex((s) => s._id === selectedImage._id); if (idx > 0) setSelectedImage(filtered[idx - 1]); }}
                disabled={filtered.findIndex((s) => s._id === selectedImage._id) === 0}
                className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm disabled:opacity-30 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
              >
                ← Previous
              </button>
              <span className="text-sm text-gray-400 self-center">
                {filtered.findIndex((s) => s._id === selectedImage._id) + 1} / {filtered.length}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); const idx = filtered.findIndex((s) => s._id === selectedImage._id); if (idx < filtered.length - 1) setSelectedImage(filtered[idx + 1]); }}
                disabled={filtered.findIndex((s) => s._id === selectedImage._id) === filtered.length - 1}
                className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm disabled:opacity-30 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
