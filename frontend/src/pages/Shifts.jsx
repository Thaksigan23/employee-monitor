import { useState, useEffect, useMemo } from "react";
import { fetchShifts, createShift, deleteShift, updateShift, assignShiftUsers, fetchUsers } from "../services/api";
import ConfirmModal from "../components/ConfirmModal";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#ec4899", "#06b6d4"];
const EMPTY_FORM = { name: "", startTime: "09:00", endTime: "17:00", days: ["Mon", "Tue", "Wed", "Thu", "Fri"], department: "General", color: "#10b981" };

export default function Shifts() {
  const [shifts, setShifts] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingShift, setEditingShift] = useState(null); // shift being edited
  const [assigningShift, setAssigningShift] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // shift id to delete
  const [form, setForm] = useState(EMPTY_FORM);

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

  // Auto-dismiss success
  useEffect(() => {
    if (success) { const t = setTimeout(() => setSuccess(""), 3000); return () => clearTimeout(t); }
  }, [success]);

  // Form validation
  function validateForm() {
    if (!form.name.trim()) return "Shift name is required.";
    if (!form.days.length) return "Select at least one working day.";
    if (form.startTime >= form.endTime) return "Start time must be before end time.";
    return null;
  }

  async function handleCreate(e) {
    e.preventDefault(); setError(""); setSuccess("");
    const err = validateForm();
    if (err) { setError(err); return; }
    try {
      if (editingShift) {
        await updateShift(editingShift._id, form);
        setSuccess("Shift updated!");
      } else {
        await createShift(form);
        setSuccess("Shift created!");
      }
      setShowForm(false);
      setEditingShift(null);
      setForm(EMPTY_FORM);
      load();
    } catch (err) { setError(err.message); }
  }

  function startEdit(shift) {
    setForm({
      name: shift.name,
      startTime: shift.startTime,
      endTime: shift.endTime,
      days: shift.days || [],
      department: shift.department || "General",
      color: shift.color || "#10b981",
    });
    setEditingShift(shift);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id) {
    try { await deleteShift(id); setSuccess("Shift deleted"); load(); } catch (err) { setError(err.message); }
    setDeleteConfirm(null);
  }

  async function handleAssign() {
    try {
      // Check for conflicts: warn if user is in multiple shifts on the same day
      const conflicts = [];
      for (const uid of selectedUsers) {
        const existingShifts = shifts.filter(
          (s) => s._id !== assigningShift._id && (s.assignedUsers || []).some((u) => u._id === uid)
        );
        for (const es of existingShifts) {
          const overlap = es.days.some((d) => assigningShift.days.includes(d));
          if (overlap) {
            const u = users.find((u) => u._id === uid);
            conflicts.push(`${u?.email} already has "${es.name}" on overlapping days`);
          }
        }
      }
      if (conflicts.length > 0) {
        const proceed = window.confirm(`⚠️ Shift conflicts detected:\n${conflicts.join("\n")}\n\nProceed anyway?`);
        if (!proceed) return;
      }
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
          <button onClick={() => { setShowForm(!showForm); setEditingShift(null); setForm(EMPTY_FORM); }}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition">
            {showForm ? "✕ Cancel" : "＋ New Shift"}
          </button>
        )}
      </div>

      {error && <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-3 rounded-lg text-sm">⚠️ {error}</div>}
      {success && <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 p-3 rounded-lg text-sm">✅ {success}</div>}

      {showForm && isAdmin && (
        <form onSubmit={handleCreate} className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 space-y-5 border dark:border-gray-700">
          <h2 className="text-lg font-semibold">{editingShift ? "✏️ Edit Shift" : "Create New Shift"}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Shift Name *</label>
              <input className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-green-500 focus:outline-none"
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Morning Shift" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Department</label>
              <input className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-green-500 focus:outline-none"
                value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Start Time *</label>
              <input type="time" className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-green-500 focus:outline-none"
                value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Time *</label>
              <input type="time" className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-green-500 focus:outline-none"
                value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Color</label>
              <div className="flex gap-2 mt-1 flex-wrap">
                {COLORS.map((c) => (
                  <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
                    className="w-8 h-8 rounded-full transition-transform"
                    style={{ backgroundColor: c, transform: form.color === c ? "scale(1.3)" : "scale(1)", border: form.color === c ? "3px solid white" : "2px solid transparent", boxShadow: form.color === c ? `0 0 0 2px ${c}` : "none" }} />
                ))}
              </div>
            </div>
          </div>

          {/* Duration preview */}
          {form.startTime && form.endTime && form.startTime < form.endTime && (
            <div className="text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2">
              ⏱ Duration: {Math.round((new Date(`2000-01-01T${form.endTime}`) - new Date(`2000-01-01T${form.startTime}`)) / 60000)} minutes
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Working Days * ({form.days.length} selected)</label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((day) => (
                <button key={day} type="button" onClick={() => toggleDay(day)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${form.days.includes(day) ? "text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"}`}
                  style={form.days.includes(day) ? { backgroundColor: form.color } : {}}>
                  {day}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition">
              {editingShift ? "💾 Update Shift" : "Create Shift"}
            </button>
            {editingShift && (
              <button type="button" onClick={() => { setEditingShift(null); setShowForm(false); setForm(EMPTY_FORM); }}
                className="px-6 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg font-medium text-sm transition">
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      )}

      {/* Weekly Schedule Grid */}
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 border dark:border-gray-700">
        <h2 className="text-lg font-semibold mb-4">📊 Weekly Schedule</h2>
        <div className="grid grid-cols-7 gap-2">
          {DAYS.map((day) => (
            <div key={day}>
              <div className="text-center font-semibold text-xs py-2 bg-gray-100 dark:bg-gray-700 rounded-t-lg uppercase tracking-wide">{day}</div>
              <div className="min-h-[120px] bg-gray-50 dark:bg-gray-900/50 rounded-b-lg p-1.5 space-y-1.5">
                {scheduleGrid[day]?.map((s) => (
                  <div key={s._id} className="text-xs p-1.5 rounded-lg text-white font-medium cursor-pointer hover:opacity-90 transition"
                    style={{ backgroundColor: s.color || "#10b981" }} title={`${s.name} (${s.startTime} - ${s.endTime})`}>
                    <div className="truncate">{s.name}</div>
                    <div className="opacity-80 text-[10px]">{s.startTime}–{s.endTime}</div>
                  </div>
                ))}
                {(!scheduleGrid[day] || scheduleGrid[day].length === 0) && (
                  <div className="text-xs text-gray-300 dark:text-gray-600 text-center pt-4">—</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Shift Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {shifts.map((s) => (
          <div key={s._id} className="bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden border dark:border-gray-700 hover:-translate-y-1 transition-all duration-200">
            <div className="h-1.5" style={{ backgroundColor: s.color || "#10b981" }} />
            <div className="p-5 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">{s.name}</h3>
                  <div className="text-sm text-gray-500">🕐 {s.startTime} — {s.endTime}</div>
                </div>
                <span className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700">{s.department}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {(s.days || []).map((d) => (
                  <span key={d} className="px-2 py-0.5 text-xs rounded font-medium" style={{ backgroundColor: s.color + "22", color: s.color }}>{d}</span>
                ))}
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">👥 {s.assignedUsers?.length || 0} employee(s)</div>
                <div className="flex flex-wrap gap-1">
                  {(s.assignedUsers || []).slice(0, 4).map((u) => (
                    <span key={u._id} className="px-2 py-0.5 text-xs rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                      {u.email?.split("@")[0]}
                    </span>
                  ))}
                  {(s.assignedUsers || []).length > 4 && (
                    <span className="text-xs text-gray-500">+{s.assignedUsers.length - 4} more</span>
                  )}
                </div>
              </div>
              {isAdmin && (
                <div className="flex gap-2 pt-2 border-t dark:border-gray-700">
                  <button onClick={() => startEdit(s)} className="flex-1 px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium transition">✏️ Edit</button>
                  <button onClick={() => { setAssigningShift(s); setSelectedUsers((s.assignedUsers || []).map((u) => u._id)); }} className="flex-1 px-3 py-1.5 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition">👥 Assign</button>
                  <button onClick={() => setDeleteConfirm(s._id)} className="px-3 py-1.5 text-xs bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition">🗑️</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {shifts.length === 0 && (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700">
          <div className="text-4xl mb-3">📅</div>
          <div className="text-gray-500 font-medium">No shifts created yet{isAdmin ? " — click 'New Shift' to get started" : ""}.</div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      <ConfirmModal
        open={!!deleteConfirm}
        title="Delete Shift"
        message="Are you sure you want to delete this shift? All user assignments will be lost."
        confirmLabel="Delete"
        onConfirm={() => handleDelete(deleteConfirm)}
        onCancel={() => setDeleteConfirm(null)}
        danger
      />

      {/* Assignment Modal */}
      {assigningShift && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setAssigningShift(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full max-h-[80vh] overflow-auto shadow-2xl border dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-1">Assign Users to "{assigningShift.name}"</h3>
            <p className="text-sm text-gray-500 mb-4">{assigningShift.days.join(", ")} · {assigningShift.startTime}–{assigningShift.endTime}</p>
            <div className="space-y-1 mb-4">
              {users.filter((u) => u.role === "employee").map((u) => (
                <label key={u._id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                  <input type="checkbox" checked={selectedUsers.includes(u._id)} onChange={() => toggleUser(u._id)} className="rounded" />
                  <div>
                    <div className="font-medium text-sm">{u.email}</div>
                    <div className="text-xs text-gray-400">{u.department}</div>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={handleAssign} className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition">
                Save ({selectedUsers.length} selected)
              </button>
              <button onClick={() => setAssigningShift(null)} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 font-medium transition">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
