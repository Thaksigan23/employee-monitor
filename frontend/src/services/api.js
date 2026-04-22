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
