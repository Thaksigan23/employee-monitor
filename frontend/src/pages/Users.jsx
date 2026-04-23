import { useEffect, useState } from "react";
import { fetchUsers, createUser, deleteUser, sendTask } from "../services/api";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("employee");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadUsers() {
    try {
      setLoading(true);
      const data = await fetchUsers();
      setUsers(data);
      setError("");
    } catch (error) {
      setError(error.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleCreate(event) {
    event.preventDefault();

    try {
      await createUser(email, password, role);
      setEmail("");
      setPassword("");
      setRole("employee");
      setError("");
      setSuccess("User created successfully");
      loadUsers();
    } catch (error) {
      setSuccess("");
      setError(error.message || "Failed to create user");
    }
  }

  async function handleDelete(id) {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      await deleteUser(id);
      setError("");
      setSuccess("User deleted successfully");
      loadUsers();
    } catch (error) {
      setSuccess("");
      setError(error.message || "Failed to delete user");
    }
  }

  async function handleSendTask(userId, email) {
    const message = prompt(`Enter a task for ${email}:`);
    if (!message) return;

    try {
      await sendTask(userId, message);
      setError("");
      setSuccess(`Task sent to ${email} successfully!`);
    } catch (error) {
      setSuccess("");
      setError(error.message || "Failed to send task");
    }
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <h1 className="text-3xl font-bold">User Management</h1>

      {error && <div className="bg-red-100 text-red-700 p-3 rounded-lg">{error}</div>}
      {success && <div className="bg-green-100 text-green-700 p-3 rounded-lg">{success}</div>}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow border dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4">Create New User</h2>

        <form onSubmit={handleCreate} className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <input
            type="email"
            placeholder="Email"
            className="border rounded-lg px-4 py-2 dark:bg-gray-800 dark:border-gray-700"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            className="border rounded-lg px-4 py-2 dark:bg-gray-800 dark:border-gray-700"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          <select
            className="border rounded-lg px-4 py-2 dark:bg-gray-800 dark:border-gray-700"
            value={role}
            onChange={(event) => setRole(event.target.value)}
          >
            <option value="employee">Employee</option>
            <option value="admin">Admin</option>
          </select>

          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-2"
          >
            Create
          </button>
        </form>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow border dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b dark:border-gray-700 font-semibold">All Users</div>

        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading users...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                <tr>
                  <th className="p-3 text-left">Email</th>
                  <th className="p-3 text-left">Role</th>
                  <th className="p-3 text-left">Department</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user._id}
                    className="border-t dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700/60 transition"
                  >
                    <td className="p-3 font-medium">{user.email}</td>
                    <td className="p-3 capitalize">{user.role}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        {user.department || "General"}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => handleSendTask(user._id, user.email)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Send Task
                        </button>
                        <button
                          onClick={() => handleDelete(user._id)}
                          className="text-red-600 hover:text-red-800 font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {users.length === 0 && (
                  <tr>
                    <td colSpan="4" className="p-6 text-center text-gray-500">
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
