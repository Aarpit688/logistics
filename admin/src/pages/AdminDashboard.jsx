import React, { useEffect, useState } from "react";
import UserRow from "./UserRow";
import { LogOut } from "lucide-react";
import { logoutAdmin } from "../utils/adminAuth";

const AdminDashboard = () => {
  const adminToken = localStorage.getItem("adminToken");

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  const fetchUsers = async () => {
    const res = await fetch(
      `https://logistics-bnqu.onrender.com/api/admin/users?search=${search}&page=${page}&limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      }
    );

    const data = await res.json();
    setUsers(data.users || []);
    setTotal(data.total || 0);
  };

  useEffect(() => {
    fetchUsers();
  }, [search, page]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>

        <button
          onClick={logoutAdmin}
          className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search by name, email or mobile"
        className="border px-3 py-2 rounded-md mb-4 w-full max-w-md"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
      />

      {/* Table */}
      <div className="overflow-x-auto border rounded-md">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Mobile</th>
              <th className="p-3">Account Type & Code</th>
              <th className="p-3">Approved</th>
              <th className="p-3">Created</th>
              <th className="p-3"></th>
            </tr>
          </thead>

          <tbody>
            {users.map((user) => (
              <UserRow key={user._id} user={user} refresh={fetchUsers} />
            ))}

            {users.length === 0 && (
              <tr>
                <td colSpan="6" className="p-4 text-center text-gray-500">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <button
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
          className="px-4 py-2 border rounded disabled:opacity-50"
        >
          Previous
        </button>

        <span>
          Page {page} of {totalPages || 1}
        </span>

        <button
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
          className="px-4 py-2 border rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default AdminDashboard;
