"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";

const API = "http://localhost:5000/api";

function getToken() {
  return typeof window !== "undefined" ? localStorage.getItem("token") : null;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
    totalRevenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = getToken();
        const headers = { Authorization: `Bearer ${token}` };
        const [statsRes, ordersRes] = await Promise.all([
          axios.get(`${API}/orders/stats`, { headers }),
          axios.get(`${API}/orders`, { headers }),
        ]);
        setStats(statsRes.data);
        setRecentOrders(ordersRes.data.slice(0, 5));
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const statCards = [
    { label: "Total Orders", value: stats.totalOrders, color: "amber" },
    { label: "Pending Orders", value: stats.pendingOrders, color: "yellow" },
    { label: "Delivered", value: stats.deliveredOrders, color: "green" },
    { label: "Total Revenue", value: `Rs ${stats.totalRevenue.toLocaleString()}`, color: "blue" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-2">Dashboard Overview</h1>
      <p className="text-zinc-400 mb-8">Welcome to MHQ Reseller Admin Panel</p>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-zinc-800/60 border border-zinc-700 rounded-2xl p-5"
          >
            <p className="text-zinc-400 text-sm mb-1">{card.label}</p>
            <p className="text-2xl font-bold text-white">{card.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-zinc-800/60 border border-zinc-700 rounded-2xl p-6">
        <h2 className="text-xl font-bold text-white mb-6">Recent Orders</h2>
        {recentOrders.length === 0 ? (
          <p className="text-zinc-400 text-center py-8">No orders yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-zinc-400 border-b border-zinc-700">
                  <th className="pb-3 pr-4">Customer</th>
                  <th className="pb-3 pr-4">City</th>
                  <th className="pb-3 pr-4">Amount</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-700/50">
                {recentOrders.map((order) => (
                  <tr key={order._id} className="text-zinc-300 hover:bg-zinc-700/30 transition-colors">
                    <td className="py-3 pr-4 font-medium">{order.customerDetails?.fullName}</td>
                    <td className="py-3 pr-4 text-zinc-400">{order.customerDetails?.city}</td>
                    <td className="py-3 pr-4 text-amber-400 font-bold">Rs {order.totalAmount?.toLocaleString()}</td>
                    <td className="py-3 pr-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        order.status === 'Delivered' ? 'bg-green-500/20 text-green-400' :
                        order.status === 'Pending' ? 'bg-yellow-500/20 text-yellow-400' :
                        order.status === 'Canceled' ? 'bg-red-500/20 text-red-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 text-zinc-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
