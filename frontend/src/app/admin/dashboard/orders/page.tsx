"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { io } from "socket.io-client";

const API = "http://localhost:5000/api";

const STATUS_OPTIONS = ['Pending', 'Packed', 'Ready to Ship', 'On Route', 'Out for Delivery', 'Delivered', 'Canceled'];

function getToken() {
  return typeof window !== "undefined" ? localStorage.getItem("token") : null;
}

function statusColor(status: string) {
  const map: Record<string, string> = {
    'Pending': 'bg-yellow-500/20 text-yellow-400',
    'Packed': 'bg-blue-500/20 text-blue-400',
    'Ready to Ship': 'bg-cyan-500/20 text-cyan-400',
    'On Route': 'bg-purple-500/20 text-purple-400',
    'Out for Delivery': 'bg-orange-500/20 text-orange-400',
    'Delivered': 'bg-green-500/20 text-green-400',
    'Canceled': 'bg-red-500/20 text-red-400',
  };
  return map[status] || 'bg-zinc-500/20 text-zinc-400';
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState("All");

  // Create Order Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newOrderCustomer, setNewOrderCustomer] = useState({
    fullName: "", phoneNo: "", houseNo: "", streetNameNo: "", areaName: "", city: "", province: "", famousPlace: ""
  });
  const [newOrderItems, setNewOrderItems] = useState<{ productId: string; quantity: number }[]>([
    { productId: "", quantity: 1 }
  ]);
  const [creatingOrder, setCreatingOrder] = useState(false);

  const fetchOrders = async () => {
    try {
      const token = getToken();
      const headers = { Authorization: `Bearer ${token}` };
      const [ordRes, prodRes] = await Promise.all([
        axios.get(`${API}/orders`, { headers }),
        axios.get(`${API}/products`, { headers }),
      ]);
      setOrders(ordRes.data);
      setProducts(prodRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    // Socket.io Realtime sync
    const socket = io("http://localhost:5000", { withCredentials: true });
    
    socket.on("order:new", (newOrder) => {
      setOrders((prev) => [newOrder, ...prev.filter(o => o._id !== newOrder._id)]);
    });

    socket.on("order:updated", (updatedOrder) => {
      setOrders((prev) => prev.map(o => o._id === updatedOrder._id ? updatedOrder : o));
    });

    socket.on("order:deleted", (deletedId) => {
      setOrders((prev) => prev.filter(o => o._id !== deletedId));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleStatusChange = async (orderId: string, status: string) => {
    try {
      const token = getToken();
      await axios.put(`${API}/orders/${orderId}/status`, { status }, { headers: { Authorization: `Bearer ${token}` } });
      fetchOrders();
      if (selectedOrder?._id === orderId) {
        setSelectedOrder((prev: any) => ({ ...prev, status }));
      }
    } catch (err) {
      alert("Status update failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this order?")) return;
    try {
      const token = getToken();
      await axios.delete(`${API}/orders/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setSelectedOrder(null);
      fetchOrders();
    } catch (err) {
      alert("Delete failed");
    }
  };

  const handleCreateOrder = async () => {
    if (
      !newOrderCustomer.fullName ||
      !newOrderCustomer.phoneNo ||
      !newOrderCustomer.houseNo ||
      !newOrderCustomer.streetNameNo ||
      !newOrderCustomer.areaName ||
      !newOrderCustomer.city ||
      !newOrderCustomer.province
    ) {
      alert("Please fill all required customer delivery details");
      return;
    }

    const validItems = newOrderItems.filter(item => item.productId && item.quantity > 0);
    if (validItems.length === 0) {
      alert("Please select at least one product for the order");
      return;
    }

    setCreatingOrder(true);
    try {
      await axios.post(`${API}/orders`, {
        customerDetails: newOrderCustomer,
        products: validItems
      });

      setShowAddModal(false);
      setNewOrderCustomer({ fullName: "", phoneNo: "", houseNo: "", streetNameNo: "", areaName: "", city: "", province: "", famousPlace: "" });
      setNewOrderItems([{ productId: "", quantity: 1 }]);
      fetchOrders();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to create order");
    } finally {
      setCreatingOrder(false);
    }
  };

  const handlePrintSlip = (order: any) => {
    const slip = window.open("", "_blank");
    if (!slip) return;
    const addressStr = `${order.customerDetails?.houseNo}, ${order.customerDetails?.streetNameNo || order.customerDetails?.streetArea}, ${order.customerDetails?.areaName || ''}`;
    slip.document.write(`
      <html><head><title>Order Slip - MHQ Reseller</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 30px; color: #222; }
        h1 { color: #d97706; margin-bottom: 5px; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { text-align: left; padding: 8px 12px; border-bottom: 1px solid #eee; }
        th { background: #f5f5f5; font-size: 13px; }
        .total { font-size: 18px; font-weight: bold; color: #d97706; }
        .status { font-weight: bold; color: #2563eb; }
        @media print { body { padding: 10px; } }
      </style></head><body>
      <h1>MHQ Reseller (Broker)</h1>
      <p style="color:#666; margin-top:0">Order Slip</p>
      <div class="section">
        <b>Order ID:</b> ${order._id}<br/>
        <b>Status:</b> <span class="status">${order.status}</span><br/>
        <b>Date:</b> ${new Date(order.createdAt).toLocaleString()}<br/>
      </div>
      <div class="section">
        <b>Customer Details</b>
        <table>
          <tr><th>Name</th><td>${order.customerDetails?.fullName}</td></tr>
          <tr><th>Phone</th><td>${order.customerDetails?.phoneNo}</td></tr>
          <tr><th>Address</th><td>${addressStr}</td></tr>
          <tr><th>City</th><td>${order.customerDetails?.city}</td></tr>
          <tr><th>Province</th><td>${order.customerDetails?.province}</td></tr>
          ${order.customerDetails?.famousPlace ? `<tr><th>Famous Place</th><td>${order.customerDetails.famousPlace}</td></tr>` : ""}
        </table>
      </div>
      <div class="section">
        <b>Products</b>
        <table>
          <tr><th>Product</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr>
          ${order.products?.map((p: any) => `
            <tr>
              <td>${p.product?.name || "N/A"}</td>
              <td>${p.quantity}</td>
              <td>Rs ${p.priceAtPurchase?.toLocaleString()}</td>
              <td>Rs ${(p.priceAtPurchase * p.quantity)?.toLocaleString()}</td>
            </tr>`).join("")}
        </table>
        <p class="total" style="text-align:right; margin-top:10px">Total: Rs ${order.totalAmount?.toLocaleString()}</p>
      </div>
      <p style="text-align:center; color:#999; font-size:12px; margin-top:30px">All Rights Reserved For MHQ Reseller (Broker) By MHT Devs.</p>
      </body></html>
    `);
    slip.document.close();
    slip.print();
  };

  const filtered = filterStatus === "All" ? orders : orders.filter(o => o.status === filterStatus);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Orders</h1>
          <p className="text-zinc-400">{orders.length} total orders</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-colors shadow"
        >
          + Add Order
        </button>
      </div>

      {/* Status Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {["All", ...STATUS_OPTIONS].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filterStatus === s ? "bg-amber-600 text-white" : "bg-zinc-800 text-zinc-400 hover:text-white"
            }`}
          >{s}</button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-zinc-400">No orders found</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => (
            <motion.div
              key={order._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setSelectedOrder(order)}
              className="bg-zinc-800/60 border border-zinc-700 rounded-2xl p-4 cursor-pointer hover:border-amber-500/50 transition-colors"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-white font-bold">{order.customerDetails?.fullName}</p>
                  <p className="text-zinc-400 text-sm">{order.customerDetails?.city} · {order.customerDetails?.phoneNo}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-amber-400 font-bold">Rs {order.totalAmount?.toLocaleString()}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColor(order.status)}`}>
                    {order.status}
                  </span>
                  <span className="text-zinc-500 text-xs">{new Date(order.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Order Modal (Staff Manual Entry) */}
      <AnimatePresence>
        {showAddModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 z-50" onClick={() => setShowAddModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold text-white mb-6">Create Manual Order (Staff)</h2>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-zinc-400 mb-1 block">Full Name *</label>
                      <input
                        value={newOrderCustomer.fullName} onChange={e => setNewOrderCustomer({ ...newOrderCustomer, fullName: e.target.value })}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                        placeholder="Customer name"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-400 mb-1 block">Phone Number *</label>
                      <input
                        value={newOrderCustomer.phoneNo} onChange={e => setNewOrderCustomer({ ...newOrderCustomer, phoneNo: e.target.value })}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                        placeholder="03001234567"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-zinc-400 mb-1 block">House/Flat No *</label>
                    <input
                      value={newOrderCustomer.houseNo} onChange={e => setNewOrderCustomer({ ...newOrderCustomer, houseNo: e.target.value })}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                      placeholder="House / Flat #"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-zinc-400 mb-1 block">Street Name/No *</label>
                      <input
                        value={newOrderCustomer.streetNameNo} onChange={e => setNewOrderCustomer({ ...newOrderCustomer, streetNameNo: e.target.value })}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                        placeholder="Street 5"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-400 mb-1 block">Area Name *</label>
                      <input
                        value={newOrderCustomer.areaName} onChange={e => setNewOrderCustomer({ ...newOrderCustomer, areaName: e.target.value })}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                        placeholder="Gulberg / Sector G-9"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs text-zinc-400 mb-1 block">City *</label>
                      <input
                        value={newOrderCustomer.city} onChange={e => setNewOrderCustomer({ ...newOrderCustomer, city: e.target.value })}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                        placeholder="City"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-400 mb-1 block">Province *</label>
                      <input
                        value={newOrderCustomer.province} onChange={e => setNewOrderCustomer({ ...newOrderCustomer, province: e.target.value })}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                        placeholder="Province"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-400 mb-1 block">Famous Place</label>
                      <input
                        value={newOrderCustomer.famousPlace} onChange={e => setNewOrderCustomer({ ...newOrderCustomer, famousPlace: e.target.value })}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                        placeholder="Landmark"
                      />
                    </div>
                  </div>

                  {/* Products Selection */}
                  <div className="border-t border-zinc-800 pt-4">
                    <label className="text-sm font-bold text-amber-500 mb-2 block">Order Products *</label>
                    {newOrderItems.map((item, idx) => (
                      <div key={idx} className="flex gap-3 mb-2 items-center">
                        <select
                          value={item.productId}
                          onChange={e => {
                            const updated = [...newOrderItems];
                            updated[idx].productId = e.target.value;
                            setNewOrderItems(updated);
                          }}
                          className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm"
                        >
                          <option value="">Select Product</option>
                          {products.map(p => (
                            <option key={p._id} value={p._id}>
                              {p.name} - Rs {p.price}
                            </option>
                          ))}
                        </select>

                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={e => {
                            const updated = [...newOrderItems];
                            updated[idx].quantity = Number(e.target.value);
                            setNewOrderItems(updated);
                          }}
                          className="w-20 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm text-center"
                        />

                        {newOrderItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setNewOrderItems(newOrderItems.filter((_, i) => i !== idx))}
                            className="text-red-400 hover:text-red-300 p-2"
                          >✕</button>
                        )}
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => setNewOrderItems([...newOrderItems, { productId: "", quantity: 1 }])}
                      className="text-xs text-amber-500 font-bold hover:underline mt-1"
                    >
                      + Add Another Product
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-3 border border-zinc-700 text-zinc-400 hover:text-white rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateOrder}
                    disabled={creatingOrder}
                    className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
                  >
                    {creatingOrder ? "Creating..." : "Create Order"}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Order Detail Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 z-50" onClick={() => setSelectedOrder(null)} />
            <motion.div
              initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 100 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-zinc-900 border-l border-zinc-700 z-50 overflow-y-auto p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Order Details</h2>
                <button onClick={() => setSelectedOrder(null)} className="text-zinc-400 hover:text-white">✕</button>
              </div>

              <div className="space-y-5">
                <div className="bg-zinc-800 rounded-xl p-4">
                  <h3 className="text-amber-400 font-bold mb-3">Customer Info</h3>
                  <div className="space-y-1 text-sm">
                    <p className="text-white font-bold">{selectedOrder.customerDetails?.fullName}</p>
                    <p className="text-zinc-400">{selectedOrder.customerDetails?.phoneNo}</p>
                    <p className="text-zinc-400">{selectedOrder.customerDetails?.houseNo}, {selectedOrder.customerDetails?.streetNameNo || selectedOrder.customerDetails?.streetArea}</p>
                    <p className="text-zinc-400">{selectedOrder.customerDetails?.areaName}</p>
                    <p className="text-zinc-400">{selectedOrder.customerDetails?.city}, {selectedOrder.customerDetails?.province}</p>
                    {selectedOrder.customerDetails?.famousPlace && (
                      <p className="text-zinc-400">Near: {selectedOrder.customerDetails.famousPlace}</p>
                    )}
                  </div>
                </div>

                <div className="bg-zinc-800 rounded-xl p-4">
                  <h3 className="text-amber-400 font-bold mb-3">Products</h3>
                  <div className="space-y-2">
                    {selectedOrder.products?.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between items-center text-sm">
                        <div>
                          <p className="text-white">{item.product?.name || "N/A"}</p>
                          <p className="text-zinc-400">Qty: {item.quantity}</p>
                        </div>
                        <p className="text-amber-400 font-bold">Rs {(item.priceAtPurchase * item.quantity)?.toLocaleString()}</p>
                      </div>
                    ))}
                    <div className="border-t border-zinc-700 pt-2 mt-2 flex justify-between">
                      <span className="text-white font-bold">Total</span>
                      <span className="text-amber-500 font-bold text-lg">Rs {selectedOrder.totalAmount?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-800 rounded-xl p-4">
                  <h3 className="text-amber-400 font-bold mb-3">Update Status</h3>
                  <select
                    value={selectedOrder.status}
                    onChange={e => handleStatusChange(selectedOrder._id, e.target.value)}
                    className="w-full bg-zinc-700 border border-zinc-600 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => handlePrintSlip(selectedOrder)}
                    className="flex-1 py-3 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded-xl font-bold transition-colors"
                  >
                    🖨 Print Slip
                  </button>
                  <button
                    onClick={() => handleDelete(selectedOrder._id)}
                    className="flex-1 py-3 bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-xl font-bold transition-colors"
                  >
                    Delete Order
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
