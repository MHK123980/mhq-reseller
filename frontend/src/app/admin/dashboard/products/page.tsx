"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { io } from "socket.io-client";

import { API_URL, SOCKET_URL } from "@/config/api";
const IMGBB_KEY = "d26bb3aafef1e75c324e7ce3072e3b47";

function getToken() {
  return typeof window !== "undefined" ? localStorage.getItem("token") : null;
}

async function uploadToImgBB(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("image", file);
  const res = await axios.post(
    `https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`,
    formData
  );
  return res.data.data.url;
}

export default function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const emptyForm = {
    name: "", price: "", description: "", category: "",
    hasDiscount: false, discountPercent: 0,
    deliveryCharges: 0, isFreeDelivery: false,
    isFeatured: false, isLowInStock: false, isOutOfStock: false,
    images: [] as string[]
  };
  const [form, setForm] = useState(emptyForm);

  const fetchData = async () => {
    try {
      const token = getToken();
      const headers = { Authorization: `Bearer ${token}` };
      const [prodRes, catRes] = await Promise.all([
        axios.get(`${API_URL}/products`, { headers }),
        axios.get(`${API_URL}/categories`, { headers }),
      ]);
      setProducts(prodRes.data);
      setCategories(catRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Socket.io Real-time Live Connection
    const socket = io(SOCKET_URL, { withCredentials: true });

    socket.on("product:new", () => fetchData());
    socket.on("product:updated", () => fetchData());
    socket.on("product:deleted", () => fetchData());

    return () => {
      socket.disconnect();
    };
  }, []);

  const openCreate = () => {
    setEditProduct(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (product: any) => {
    setEditProduct(product);
    setForm({
      name: product.name,
      price: product.price,
      description: product.description,
      category: product.category?._id || product.category,
      hasDiscount: product.hasDiscount || false,
      discountPercent: product.discountPercent || 0,
      deliveryCharges: product.deliveryCharges || 0,
      isFreeDelivery: product.isFreeDelivery || false,
      isFeatured: product.isFeatured || false,
      isLowInStock: product.isLowInStock || false,
      isOutOfStock: product.isOutOfStock || false,
      images: product.images || []
    });
    setShowModal(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      const urls = await Promise.all(files.map(uploadToImgBB));
      setForm(f => ({ ...f, images: [...f.images, ...urls] }));
    } catch {
      alert("Image upload failed. Check your ImgBB API key.");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== index) }));
  };

  const handleSave = async () => {
    if (!form.name || !form.price || !form.description || !form.category) {
      alert("Please fill all required fields");
      return;
    }
    if (form.images.length === 0) {
      alert("Please upload at least one image");
      return;
    }
    setSaving(true);
    try {
      const token = getToken();
      const headers = { Authorization: `Bearer ${token}` };
      const payload = { ...form, price: Number(form.price) };

      if (editProduct) {
        await axios.put(`${API_URL}/products/${editProduct._id}`, payload, { headers });
      } else {
        await axios.post(`${API_URL}/products`, payload, { headers });
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
    if (!confirm("Delete this product?")) return;
    try {
      const token = getToken();
      await axios.delete(`${API_URL}/products/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchData();
    } catch (err) {
      alert("Delete failed");
    }
  };

  const handleToggleFeatured = async (id: string) => {
    try {
      const token = getToken();
      await axios.patch(`${API_URL}/products/${id}/toggle-featured`, {}, { headers: { Authorization: `Bearer ${token}` } });
      fetchData();
    } catch (err) {
      alert("Toggle failed");
    }
  };

  const handleToggleOutOfStock = async (id: string) => {
    try {
      const token = getToken();
      await axios.patch(`${API_URL}/products/${id}/toggle-out-of-stock`, {}, { headers: { Authorization: `Bearer ${token}` } });
      fetchData();
    } catch (err) {
      alert("Toggle stock status failed");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Products</h1>
          <p className="text-zinc-400">{products.length} products total</p>
        </div>
        <button
          onClick={openCreate}
          className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-colors"
        >
          + Add Product
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full" />
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 text-zinc-400">No products yet. Add your first product!</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {products.map((product) => (
            <motion.div
              key={product._id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-zinc-800/60 border border-zinc-700 rounded-2xl overflow-hidden"
            >
              <div className="h-44 bg-zinc-900 relative">
                {product.images?.[0] ? (
                  <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-600">No Image</div>
                )}
                <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                  {product.isFeatured && (
                    <span className="bg-amber-500 text-black text-[10px] font-extrabold px-2 py-0.5 rounded shadow">
                      ★ FEATURED
                    </span>
                  )}
                  {product.isLowInStock && (
                    <span className="bg-yellow-500 text-black text-[10px] font-extrabold px-2 py-0.5 rounded shadow">
                      ⚠ LOW IN STOCK
                    </span>
                  )}
                  {product.isOutOfStock && (
                    <span className="bg-red-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded shadow">
                      ✖ OUT OF STOCK
                    </span>
                  )}
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-white font-bold text-lg mb-1 truncate">{product.name}</h3>
                <p className="text-zinc-400 text-sm mb-1">{product.category?.name}</p>
                <p className="text-amber-400 font-bold">Rs {product.price?.toLocaleString()}</p>

                <div className="flex flex-col gap-2 mt-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleFeatured(product._id)}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${
                        product.isFeatured
                          ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/40"
                          : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
                      }`}
                    >
                      {product.isFeatured ? "★ Featured" : "☆ Set Featured"}
                    </button>
                    <button
                      onClick={() => handleToggleOutOfStock(product._id)}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${
                        product.isOutOfStock
                          ? "bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/40"
                          : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
                      }`}
                    >
                      {product.isOutOfStock ? "In Stock" : "Out of Stock"}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEdit(product)}
                      className="flex-1 py-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded-lg text-xs font-bold transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(product._id)}
                      className="flex-1 py-2 bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-lg text-xs font-bold transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 z-50"
              onClick={() => setShowModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold text-white mb-6">
                  {editProduct ? "Edit Product" : "Add New Product"}
                </h2>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-zinc-400 mb-1 block">Product Name *</label>
                      <input
                        value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="Product name"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-zinc-400 mb-1 block">Price (Rs) *</label>
                      <input
                        type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-zinc-400 mb-1 block">Category *</label>
                    <select
                      value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="">Select category</option>
                      {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm text-zinc-400 mb-1 block">Description *</label>
                    <textarea
                      value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      rows={3}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                      placeholder="Product description"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-zinc-400 mb-1 block">Delivery Charges (Rs)</label>
                      <input
                        type="number" value={form.deliveryCharges} onChange={e => setForm(f => ({ ...f, deliveryCharges: Number(e.target.value) }))}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-zinc-400 mb-1 block">Discount %</label>
                      <input
                        type="number" value={form.discountPercent} onChange={e => setForm(f => ({ ...f, discountPercent: Number(e.target.value) }))}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                        min="0" max="100"
                      />
                    </div>
                  </div>

                  {/* Toggles */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {[
                      { label: "Has Discount", key: "hasDiscount" },
                      { label: "Free Delivery", key: "isFreeDelivery" },
                      { label: "Featured", key: "isFeatured" },
                      { label: "Low In Stock", key: "isLowInStock" },
                      { label: "Out of Stock", key: "isOutOfStock" },
                    ].map(({ label, key }) => (
                      <label key={key} className="flex items-center gap-2 cursor-pointer">
                        <div
                          onClick={() => setForm(f => ({ ...f, [key]: !f[key as keyof typeof f] }))}
                          className={`w-12 h-6 rounded-full transition-colors relative ${
                            form[key as keyof typeof form] ? "bg-amber-500" : "bg-zinc-700"
                          }`}
                        >
                          <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${
                            form[key as keyof typeof form] ? "left-6" : "left-0.5"
                          }`} />
                        </div>
                        <span className="text-sm text-zinc-300">{label}</span>
                      </label>
                    ))}
                  </div>

                  {/* Image Upload */}
                  <div>
                    <label className="text-sm text-zinc-400 mb-2 block">Product Images *</label>
                    <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      disabled={uploading}
                      className="w-full border-2 border-dashed border-zinc-600 rounded-xl py-4 text-zinc-400 hover:border-amber-500 hover:text-amber-400 transition-colors text-sm"
                    >
                      {uploading ? "Uploading to ImgBB..." : "Click to upload images"}
                    </button>
                    {form.images.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {form.images.map((url, i) => (
                          <div key={i} className="relative">
                            <img src={url} alt="" className="w-16 h-16 object-cover rounded-lg" />
                            <button
                              onClick={() => removeImage(i)}
                              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                            >×</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-3 border border-zinc-700 text-zinc-400 hover:text-white rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || uploading}
                    className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
                  >
                    {saving ? "Saving..." : editProduct ? "Update Product" : "Add Product"}
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
