import { useState, useEffect, useMemo } from "react";
import { fetchShifts, createShift, deleteShift, assignShiftUsers, fetchUsers } from "../services/api";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#ec4899", "#06b6d4"];

export default function Shifts() {
  const [shifts, setShifts] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [assigningShift, setAssigningShift] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [form, setForm] = useState({
    name: "", startTime: "09:00", endTime: "17:00",
    days: ["Mon", "Tue", "Wed", "Thu", "Fri"], department: "General", color: "#10b981",
  });

  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; }
  }, []);
  const isAdmin = user?.role === "admin";

  async function load() {
    try {
      const data = await fetchShifts();
      setShifts(data);
      if (isAdmin) { const u = await fetchUsers(); setUsers(u); }
    } catch (e) { setError(e.message); }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e) {
    e.preventDefault(); setError(""); setSuccess("");
    try {
      await createShift(form);
      setSuccess("Shift created!");
      setShowForm(false);
      setForm({ name: "", startTime: "09:00", endTime: "17:00", days: ["Mon", "Tue", "Wed", "Thu", "Fri"], department: "General", color: "#10b981" });
      load();
    } catch (err) { setError(err.message); }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this shift?")) return;
    try { await deleteShift(id); setSuccess("Shift deleted"); load(); } catch (err) { setError(err.message); }
  }

  async function handleAssign() {
    try {
      await assignShiftUsers(assigningShift._id, selectedUsers);
      setSuccess("Users assigned!"); setAssigningShift(null); setSelectedUsers([]); load();
    } catch (err) { setError(err.message); }
  }

  function toggleDay(day) {
    setForm((f) => ({ ...f, days: f.days.includes(day) ? f.days.filter((d) => d !== day) : [...f.days, day] }));
  }

  function toggleUser(uid) {
    setSelectedUsers((prev) => prev.includes(uid) ? prev.filter((u) => u !== uid) : [...prev, uid]);
  }

  const scheduleGrid = useMemo(() => {
    const grid = {};
    DAYS.forEach((day) => { grid[day] = []; });
    shifts.forEach((s) => { (s.days || []).forEach((day) => { if (grid[day]) grid[day].push(s); }); });
    return grid;
  }, [shifts]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">📅 Shift Scheduling</h1>
        {isAdmin && (
          <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition">
            {showForm ? "✕ Cancel" : "＋ New Shift"}
          </button>
        )}
      </div>
      {error && <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-3 rounded-lg">{error}</div>}
      {success && <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 p-3 rounded-lg">{success}</div>}

      {showForm && isAdmin && (
        <form onSubmit={handleCreate} className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold">Create New Shift</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Shift Name</label>
              <input className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-green-500 focus:outline-none" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Morning Shift" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Department</label>
              <input className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-green-500 focus:outline-none" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Start Time</label>
              <input type="time" className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-green-500 focus:outline-none" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Time</label>
              <input type="time" className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-green-500 focus:outline-none" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Color</label>
              <div className="flex gap-2 mt-1">
                {COLORS.map((c) => (
                  <button key={c} type="button" onClick={() => setForm({ ...form, color: c })} className="w-8 h-8 rounded-full transition-transform" style={{ backgroundColor: c, transform: form.color === c ? "scale(1.3)" : "scale(1)", border: form.color === c ? "3px solid white" : "2px solid transparent", boxShadow: form.color === c ? `0 0 0 2px ${c}` : "none" }} />
                ))}
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Working Days</label>
            <div className="flex gap-2">
              {DAYS.map((day) => (
                <button key={day} type="button" onClick={() => toggleDay(day)} className={`px-3 py-2 rounded-lg text-sm font-medium transition ${form.days.includes(day) ? "bg-green-500 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"}`}>{day}</button>
              ))}
            </div>
          </div>
          <button type="submit" className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition">Create Shift</button>
        </form>
      )}

      {/* Weekly Schedule Grid */}
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">📊 Weekly Schedule</h2>
        <div className="grid grid-cols-7 gap-2">
          {DAYS.map((day) => (
            <div key={day}>
              <div className="text-center font-semibold text-sm py-2 bg-gray-100 dark:bg-gray-700 rounded-t-lg">{day}</div>
              <div className="min-h-[120px] bg-gray-50 dark:bg-gray-900/50 rounded-b-lg p-1 space-y-1">
                {scheduleGrid[day]?.map((s) => (
                  <div key={s._id} className="text-xs p-2 rounded-lg text-white font-medium" style={{ backgroundColor: s.color || "#10b981" }} title={`${s.name} (${s.startTime} - ${s.endTime})`}>
                    <div className="truncate">{s.name}</div>
                    <div className="opacity-80">{s.startTime}-{s.endTime}</div>
                  </div>
                ))}
                {(!scheduleGrid[day] || scheduleGrid[day].length === 0) && <div className="text-xs text-gray-400 text-center pt-4">—</div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Shift Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {shifts.map((s) => (
          <div key={s._id} className="bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden">
            <div className="h-2" style={{ backgroundColor: s.color || "#10b981" }} />
            <div className="p-5 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">{s.name}</h3>
                  <div className="text-sm text-gray-500 dark:text-gray-400">🕐 {s.startTime} — {s.endTime}</div>
                </div>
                <span className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700">{s.department}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {(s.days || []).map((d) => <span key={d} className="px-2 py-0.5 text-xs rounded bg-gray-100 dark:bg-gray-700">{d}</span>)}
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">👥 {s.assignedUsers?.length || 0} employee(s)</div>
                <div className="flex flex-wrap gap-1">
                  {(s.assignedUsers || []).slice(0, 5).map((u) => <span key={u._id} className="px-2 py-0.5 text-xs rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">{u.email?.split("@")[0]}</span>)}
                  {(s.assignedUsers || []).length > 5 && <span className="text-xs text-gray-500">+{s.assignedUsers.length - 5} more</span>}
                </div>
              </div>
              {isAdmin && (
                <div className="flex gap-2 pt-2 border-t dark:border-gray-700">
                  <button onClick={() => { setAssigningShift(s); setSelectedUsers((s.assignedUsers || []).map((u) => u._id)); }} className="flex-1 px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">👥 Assign</button>
                  <button onClick={() => handleDelete(s._id)} className="px-3 py-1.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition">🗑️</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {shifts.length === 0 && <div className="text-center text-gray-500 py-12"><div className="text-4xl mb-2">📅</div><div>No shifts created yet.{isAdmin && " Click 'New Shift' to get started."}</div></div>}

      {/* Assignment Modal */}
      {assigningShift && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setAssigningShift(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full max-h-[80vh] overflow-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Assign Users to &quot;{assigningShift.name}&quot;</h3>
            <div className="space-y-2 mb-4">
              {users.filter((u) => u.role === "employee").map((u) => (
                <label key={u._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                  <input type="checkbox" checked={selectedUsers.includes(u._id)} onChange={() => toggleUser(u._id)} className="rounded" />
                  <span className="font-medium">{u.email}</span>
                  <span className="text-xs text-gray-500 ml-auto">{u.department}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={handleAssign} className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition">Save ({selectedUsers.length} selected)</button>
              <button onClick={() => setAssigningShift(null)} className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
