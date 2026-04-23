const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

// ==========================
// USERS
// ==========================

export async function fetchUsers() {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_BASE}/api/users`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error("Failed to fetch users");

  return res.json();
}

export async function createUser(email, password, role) {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_BASE}/api/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ email, password, role }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Failed to create user");
  }

  return data;
}

export async function deleteUser(id) {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_BASE}/api/users/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error("Failed to delete user");

  return res.json();
}

////////////////////////////////////////////////////////

// ==========================
// AUTH
// ==========================

export async function login(email, password) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Login failed");
  }

  localStorage.setItem("token", data.token);
  localStorage.setItem("user", JSON.stringify(data.user));

  return data;
}

export async function registerUser(email, password) {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password, role: "employee" }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Registration failed");
  }

  localStorage.setItem("token", data.token);
  localStorage.setItem("user", JSON.stringify(data.user));

  return data;
}

////////////////////////////////////////////////////////

// ==========================
// ACTIVITIES
// ==========================

export async function fetchActivities({
  userId = null,
  start = null,
  end = null,
} = {}) {
  const token = localStorage.getItem("token");

  let url = `${API_BASE}/api/activity`;
  const params = new URLSearchParams();

  if (userId) params.append("userId", userId);
  if (start) params.append("start", start);
  if (end) params.append("end", end);

  if (params.toString()) {
    url += `?${params.toString()}`;
  }

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error("Failed to fetch activities");

  return res.json();
}

////////////////////////////////////////////////////////

// ==========================
// DELETE SINGLE ACTIVITY
// ==========================

export async function deleteActivity(id) {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_BASE}/api/activity/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to delete activity");
  }

  return res.json();
}

////////////////////////////////////////////////////////

// ==========================
// CLEAR ALL ACTIVITIES
// ==========================

export async function clearActivities(userId = null) {
  const token = localStorage.getItem("token");

  let url = `${API_BASE}/api/activity`;

  if (userId) {
    url += `?userId=${userId}`;
  }

  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to clear activities");
  }

  return res.json();
}

// ==========================
// ANALYTICS
// ==========================

export async function fetchTimesheets(start = null, end = null) {
  const token = localStorage.getItem("token");

  let url = `${API_BASE}/api/analytics/timesheets`;
  const params = new URLSearchParams();

  if (start) params.append("start", start);
  if (end) params.append("end", end);

  if (params.toString()) {
    url += `?${params.toString()}`;
  }

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error("Failed to fetch timesheets");

  return res.json();
}

// ==========================
// TASKS
// ==========================

export async function sendTask(receiverId, message) {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_BASE}/api/tasks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ receiverId, message }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to send task");

  return data;
}

// ==========================
// CHAT
// ==========================

export async function fetchChatList() {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_BASE}/api/chat/list`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error("Failed to fetch chat list");
  return res.json();
}

export async function fetchConversation(userId) {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_BASE}/api/chat/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error("Failed to fetch conversation");
  return res.json();
}

export async function sendMessage(receiverId, text) {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_BASE}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ receiverId, text }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to send message");
  return data;
}

// ==========================
// LEAVES
// ==========================

export async function requestLeave(type, startDate, endDate, reason) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}/api/leaves`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ type, startDate, endDate, reason }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to request leave");
  return data;
}

export async function fetchLeaves(status = null) {
  const token = localStorage.getItem("token");
  let url = `${API_BASE}/api/leaves`;
  if (status) url += `?status=${status}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error("Failed to fetch leaves");
  return res.json();
}

export async function reviewLeave(id, status, reviewNote = "") {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}/api/leaves/${id}/review`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ status, reviewNote }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to review leave");
  return data;
}

// ==========================
// ANNOUNCEMENTS
// ==========================

export async function createAnnouncement(title, message, priority = "normal") {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}/api/announcements`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ title, message, priority }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to create announcement");
  return data;
}

export async function fetchAnnouncements() {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}/api/announcements`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch announcements");
  return res.json();
}

export async function markAnnouncementRead(id) {
  const token = localStorage.getItem("token");
  await fetch(`${API_BASE}/api/announcements/${id}/read`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
  });
}

// ==========================
// AUDIT LOGS
// ==========================

export async function fetchAuditLogs() {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}/api/audit`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch audit logs");
  return res.json();
}

// ==========================
// APP USAGE
// ==========================

export async function fetchAppUsage() {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}/api/analytics/app-usage`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch app usage");
  return res.json();
}
