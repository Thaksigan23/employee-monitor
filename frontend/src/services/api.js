export async function fetchUsers() {
  const token = localStorage.getItem("token");
  const res = await fetch("http://localhost:5000/api/users", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
}

export async function createUser(email, password, role) {
  const token = localStorage.getItem("token");
  const res = await fetch("http://localhost:5000/api/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ email, password, role }),
  });
  if (!res.ok) throw new Error("Failed to create user");
  return res.json();
}

export async function deleteUser(id) {
  const token = localStorage.getItem("token");
  const res = await fetch(`http://localhost:5000/api/users/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to delete user");
  return res.json();
}

export async function login(email, password) {
  const res = await fetch("http://localhost:5000/api/auth/login", {
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

  // Save token & user
  localStorage.setItem("token", data.token);
  localStorage.setItem("user", JSON.stringify(data.user));

  return data;
}

export async function fetchActivities() {
  const token = localStorage.getItem("token");
  const res = await fetch("http://localhost:5000/api/activity", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch activities");
  }

  return res.json();
}
