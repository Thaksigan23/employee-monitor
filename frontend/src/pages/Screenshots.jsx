import { useState, useEffect } from "react";
import { fetchScreenshots, fetchUsers } from "../services/api";

// Assuming backend is at VITE_API_URL but replacing /api with nothing to get the base URL for uploads
const API_BASE = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace("/api", "") : "http://localhost:5000";

export default function Screenshots() {
  const [screenshots, setScreenshots] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user.role === "admin";

  useEffect(() => {
    if (isAdmin) {
      fetchUsers().then(setUsers).catch(console.error);
    }
  }, [isAdmin]);

  useEffect(() => {
    setLoading(true);
    fetchScreenshots(selectedUserId)
      .then(setScreenshots)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedUserId]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">📸 Screenshots</h1>
        {isAdmin && (
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="border rounded-lg px-4 py-2 dark:bg-gray-800 dark:border-gray-700"
          >
            <option value="">All Employees</option>
            {users.map((u) => (
              <option key={u._id} value={u._id}>{u.name || u.email}</option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading screenshots...</div>
      ) : screenshots.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-3">📸</div>
          <div className="text-gray-500">No screenshots captured yet.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {screenshots.map((s) => (
            <div key={s._id} className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg border dark:border-gray-700 group cursor-pointer" onClick={() => setSelectedImage(s)}>
              <div className="aspect-video bg-gray-100 dark:bg-gray-900 relative overflow-hidden">
                <img 
                  src={`${API_BASE}${s.filePath}`} 
                  alt="Screenshot" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => { e.target.src = "https://via.placeholder.com/600x400?text=Image+Unavailable"; }}
                />
              </div>
              <div className="p-4">
                <div className="font-semibold truncate" title={s.windowTitle}>{s.windowTitle}</div>
                <div className="text-sm text-gray-500 flex justify-between mt-1">
                  <span>{new Date(s.createdAt).toLocaleTimeString()}</span>
                  <span>{new Date(s.createdAt).toLocaleDateString()}</span>
                </div>
                {isAdmin && <div className="text-xs text-blue-500 mt-2 font-medium">{s.user?.email}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedImage && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
          <div className="bg-white dark:bg-gray-800 p-2 rounded-xl max-w-5xl w-full" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-2 mb-2">
              <div>
                <h3 className="font-bold text-lg">{selectedImage.windowTitle}</h3>
                <p className="text-sm text-gray-500">{new Date(selectedImage.createdAt).toLocaleString()} {isAdmin && `- ${selectedImage.user?.email}`}</p>
              </div>
              <button onClick={() => setSelectedImage(null)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg">✕</button>
            </div>
            <img src={`${API_BASE}${selectedImage.filePath}`} alt="Full Screenshot" className="w-full rounded-lg" />
          </div>
        </div>
      )}
    </div>
  );
}
