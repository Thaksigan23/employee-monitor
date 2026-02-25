import { useEffect, useState } from "react";
import { fetchUsers, createUser, deleteUser } from "../services/api";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadUsers() {
    try {
      setLoading(true);
      const data = await fetchUsers();
      setUsers(data);
      setError("");
    } catch {
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    try {
      await createUser(email, password, role);
      setEmail("");
      setPassword("");
      setRole("user");
      loadUsers();
    } catch {
      setError("Failed to create user (maybe email already exists)");
    }
  }

  async function handleDelete(id) {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await deleteUser(id);
      loadUsers();
    } catch {
      setError("Failed to delete user");
    }
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <h1 className="text-3xl font-bold">User Management</h1>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Create User Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow border dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4">Create New User</h2>

        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="email"
            placeholder="Email"
            className="border rounded-lg px-4 py-2 dark:bg-gray-800 dark:border-gray-700"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            className="border rounded-lg px-4 py-2 dark:bg-gray-800 dark:border-gray-700"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <select
            className="border rounded-lg px-4 py-2 dark:bg-gray-800 dark:border-gray-700"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>

          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-2"
          >
            ➕ Create
          </button>
        </form>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow border dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b dark:border-gray-700 font-semibold">
          All Users
        </div>

        {loading && (
          <div className="p-6 text-center text-gray-500">Loading users...</div>
        )}

        {!loading && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                <tr>
                  <th className="p-3 text-left">Email</th>
                  <th className="p-3 text-left">Role</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u._id}
                    className="border-t dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700/60 transition"
                  >
                    <td className="p-3 font-medium">{u.email}</td>
                    <td className="p-3 capitalize">{u.role}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleDelete(u._id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))}

                {users.length === 0 && (
                  <tr>
                    <td colSpan="3" className="p-6 text-center text-gray-500">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}