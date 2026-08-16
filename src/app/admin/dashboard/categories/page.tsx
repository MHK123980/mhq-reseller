"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

const API = "http://localhost:5000/api";

function getToken() {
  return typeof window !== "undefined" ? localStorage.getItem("token") : null;
}

export default function AdminCategories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editCat, setEditCat] = useState<any>(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      const res = await axios.get(`${API}/categories`);
      setCategories(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setEditCat(null);
    setForm({ name: "", description: "" });
    setShowModal(true);
  };

  const openEdit = (cat: any) => {
    setEditCat(cat);
    setForm({ name: cat.name, description: cat.description || "" });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { alert("Category name is required"); return; }
    setSaving(true);
    try {
      const token = getToken();
      const headers = { Authorization: `Bearer ${token}` };
      if (editCat) {
        await axios.put(`${API}/categories/${editCat._id}`, form, { headers });
      } else {
        await axios.post(`${API}/categories`, form, { headers });
      }
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    try {
      const token = getToken();
      await axios.delete(`${API}/categories/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchData();
    } catch (err) {
      alert("Delete failed");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Categories</h1>
          <p className="text-zinc-400">{categories.length} categories total</p>
        </div>
        <button
          onClick={openCreate}
          className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-colors"
        >
          + Add Category
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full" />
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-20 text-zinc-400">No categories yet. Add your first category!</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <motion.div
              key={cat._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-zinc-800/60 border border-zinc-700 rounded-2xl p-5"
            >
              <h3 className="text-white font-bold text-lg mb-1">{cat.name}</h3>
              <p className="text-zinc-400 text-sm mb-4">{cat.description || "No description"}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => openEdit(cat)}
                  className="flex-1 py-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded-xl text-sm font-bold transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(cat._id)}
                  className="flex-1 py-2 bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-xl text-sm font-bold transition-colors"
                >
                  Delete
                </button>
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
                  {editCat ? "Edit Category" : "Add New Category"}
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-zinc-400 mb-1 block">Category Name *</label>
                    <input
                      value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="e.g. Fashion, Electronics"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-zinc-400 mb-1 block">Description</label>
                    <textarea
                      value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      rows={3}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                      placeholder="Optional description"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setShowModal(false)}
                    className="flex-1 py-3 border border-zinc-700 text-zinc-400 hover:text-white rounded-xl transition-colors">
                    Cancel
                  </button>
                  <button onClick={handleSave} disabled={saving}
                    className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50">
                    {saving ? "Saving..." : editCat ? "Update" : "Add Category"}
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
