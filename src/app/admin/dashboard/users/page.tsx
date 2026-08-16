"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

const API = "http://localhost:5000/api";

function getToken() {
  return typeof window !== "undefined" ? localStorage.getItem("token") : null;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const emptyForm = { name: "", email: "", password: "", role: "Manager" };
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    try {
      const token = getToken();
      const res = await axios.get(`${API}/auth/users`, { headers: { Authorization: `Bearer ${token}` } });
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const openCreate = () => {
    setEditUser(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (user: any) => {
    setEditUser(user);
    setForm({ name: user.name, email: user.email, password: "", role: user.role });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.email) { alert("Name and email are required"); return; }
    if (!editUser && !form.password) { alert("Password is required for new users"); return; }
    setSaving(true);
    try {
      const token = getToken();
      const headers = { Authorization: `Bearer ${token}` };
      const payload: any = { name: form.name, email: form.email, role: form.role };
      if (form.password) payload.password = form.password;

      if (editUser) {
        await axios.put(`${API}/auth/users/${editUser._id}`, payload, { headers });
      } else {
        await axios.post(`${API}/auth/users`, { ...payload, password: form.password }, { headers });
      }
      setShowModal(false);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this user?")) return;
    try {
      const token = getToken();
      await axios.delete(`${API}/auth/users/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || "Delete failed");
    }
  };

  const roleColor: Record<string, string> = {
    Owner: "bg-amber-500/20 text-amber-400",
    Admin: "bg-blue-500/20 text-blue-400",
    Manager: "bg-green-500/20 text-green-400",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">User Management</h1>
          <p className="text-zinc-400">{users.length} staff members</p>
        </div>
        <button
          onClick={openCreate}
          className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-colors"
        >
          + Add User
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="space-y-3">
          {users.map(user => (
            <motion.div
              key={user._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-zinc-800/60 border border-zinc-700 rounded-2xl p-4 flex items-center justify-between gap-4 flex-wrap"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-amber-600/20 flex items-center justify-center text-amber-400 font-bold text-xl">
                  {user.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-white font-bold">{user.name}</p>
                  <p className="text-zinc-400 text-sm">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${roleColor[user.role] || "bg-zinc-700 text-zinc-300"}`}>
                  {user.role}
                </span>
                <button
                  onClick={() => openEdit(user)}
                  className="px-4 py-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded-xl text-sm font-bold transition-colors"
                >
                  Edit
                </button>
                {user.role !== "Owner" && (
                  <button
                    onClick={() => handleDelete(user._id)}
                    className="px-4 py-2 bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-xl text-sm font-bold transition-colors"
                  >
                    Delete
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 z-50" onClick={() => setShowModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-md">
                <h2 className="text-xl font-bold text-white mb-6">
                  {editUser ? "Edit User" : "Add New User"}
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-zinc-400 mb-1 block">Full Name *</label>
                    <input
                      value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-zinc-400 mb-1 block">Email *</label>
                    <input
                      type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="email@example.com"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-zinc-400 mb-1 block">
                      Password {editUser ? "(leave blank to keep current)" : "*"}
                    </label>
                    <input
                      type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-zinc-400 mb-1 block">Role *</label>
                    <select
                      value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="Admin">Admin</option>
                      <option value="Manager">Manager</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setShowModal(false)}
                    className="flex-1 py-3 border border-zinc-700 text-zinc-400 hover:text-white rounded-xl transition-colors">
                    Cancel
                  </button>
                  <button onClick={handleSave} disabled={saving}
                    className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50">
                    {saving ? "Saving..." : editUser ? "Update User" : "Create User"}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
