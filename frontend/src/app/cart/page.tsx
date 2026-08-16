"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import axios from "axios";
import { useCart } from "@/context/CartContext";

import { API_URL } from "@/config/api";

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, clearCart, totalAmount } = useCart();
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<any>(null);

  const [customer, setCustomer] = useState({
    fullName: "",
    phoneNo: "",
    houseNo: "",
    streetNameNo: "",
    areaName: "",
    city: "",
    province: "",
    famousPlace: "",
    email: ""
  });

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    if (
      !customer.fullName ||
      !customer.phoneNo ||
      !customer.houseNo ||
      !customer.streetNameNo ||
      !customer.areaName ||
      !customer.city ||
      !customer.province
    ) {
      alert("Please fill all required delivery details (including Street Name/No and Area Name)");
      return;
    }

    setLoading(true);
    try {
      const orderProducts = cart.map((item) => ({
        productId: item.product._id,
        quantity: item.quantity,
      }));

      const res = await axios.post(`${API_URL}/orders`, {
        customerDetails: customer,
        products: orderProducts,
      });

      setOrderSuccess(res.data.order);
      clearCart();
    } catch (err: any) {
      console.error("Order placement error:", err);
      alert(err.response?.data?.message || "Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center py-32 px-4 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-black/70 backdrop-blur-md p-10 rounded-3xl border border-amber-500/30 max-w-lg w-full shadow-2xl"
        >
          <div className="w-20 h-20 bg-amber-500/20 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-2">Order Confirmed!</h1>
          <p className="text-zinc-300 text-sm mb-6">Thank you for your order. We are processing it right away.</p>
          <div className="bg-zinc-900/80 p-4 rounded-xl text-left text-xs space-y-2 mb-6 border border-white/10">
            <p><span className="text-amber-400 font-bold">Order ID:</span> {orderSuccess._id}</p>
            <p><span className="text-amber-400 font-bold">Customer Name:</span> {orderSuccess.customerDetails?.fullName}</p>
            <p><span className="text-amber-400 font-bold">Total Amount:</span> Rs {orderSuccess.totalAmount?.toLocaleString()}</p>
          </div>
          <Link href="/products" className="inline-block px-8 py-3.5 bg-amber-500 text-black font-bold rounded-xl hover:bg-amber-400 transition-colors uppercase tracking-wider text-sm shadow-lg">
            Continue Shopping
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 pb-24 pt-28 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-amber-500 uppercase tracking-widest mb-2" style={{ fontFamily: 'Times New Roman, serif' }}>
            Shopping Cart
          </h1>
          <p className="text-zinc-300 text-sm">Review your selected items and checkout</p>
        </div>

        {cart.length === 0 ? (
          <div className="bg-black/60 backdrop-blur-md p-16 rounded-3xl border border-white/10 text-center max-w-lg mx-auto">
            <svg className="w-16 h-16 text-zinc-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            <h2 className="text-2xl font-bold text-white mb-2">Your Cart is Empty</h2>
            <p className="text-zinc-400 text-sm mb-6">Looks like you haven't added any items yet.</p>
            <Link href="/products" className="px-8 py-3.5 bg-amber-500 text-black font-bold rounded-xl hover:bg-amber-400 transition-colors inline-block uppercase text-sm">
              Explore Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items List */}
            <div className="lg:col-span-2 space-y-4">
              {cart.map((item) => {
                const price = item.product.hasDiscount && item.product.discountPercent > 0
                  ? item.product.price - (item.product.price * (item.product.discountPercent / 100))
                  : item.product.price;
                const delivery = item.product.isFreeDelivery ? 0 : (item.product.deliveryCharges || 0);

                return (
                  <div
                    key={item.product._id}
                    className="bg-black/60 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <div className="w-20 h-20 bg-zinc-900 rounded-xl overflow-hidden flex-shrink-0 border border-zinc-700">
                        {item.product.images?.[0] ? (
                          <img src={item.product.images[0]} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-zinc-600">No Image</div>
                        )}
                      </div>
                      <div>
                        <Link href={`/product/${item.product._id}`} className="text-white font-bold hover:text-amber-500 transition-colors line-clamp-1">
                          {item.product.name}
                        </Link>
                        <p className="text-amber-400 font-bold text-sm mt-0.5">Rs {price?.toLocaleString()}</p>
                        <p className="text-zinc-400 text-xs">
                          {item.product.isFreeDelivery ? "Free Shipping" : `Delivery: Rs ${delivery}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t sm:border-t-0 border-white/10 pt-3 sm:pt-0">
                      {/* Quantity Controls */}
                      <div className="flex items-center bg-zinc-900 border border-zinc-700 rounded-xl">
                        <button
                          onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
                          className="px-3 py-1 text-white hover:bg-amber-500 hover:text-black font-bold"
                        >-</button>
                        <span className="px-4 py-1 text-amber-400 font-bold text-sm">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                          className="px-3 py-1 text-white hover:bg-amber-500 hover:text-black font-bold"
                        >+</button>
                      </div>

                      {/* Subtotal */}
                      <span className="text-amber-500 font-extrabold text-base min-w-[80px] text-right">
                        Rs {((price * item.quantity) + delivery)?.toLocaleString()}
                      </span>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeFromCart(item.product._id)}
                        className="text-zinc-500 hover:text-red-400 p-1"
                        title="Remove item"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                );
              })}

              <button
                onClick={clearCart}
                className="text-xs text-zinc-400 hover:text-red-400 transition-colors uppercase font-bold tracking-wider pt-2"
              >
                Clear Entire Cart
              </button>
            </div>

            {/* Delivery Details & Checkout Form */}
            <div className="bg-black/70 backdrop-blur-md p-6 rounded-3xl border border-amber-500/20 shadow-2xl h-fit">
              <h2 className="text-xl font-bold text-white mb-6 uppercase tracking-wider pb-3 border-b border-white/10">
                Delivery Details
              </h2>

              <form onSubmit={handlePlaceOrder} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1 block">Full Name *</label>
                  <input
                    type="text" required
                    value={customer.fullName} onChange={e => setCustomer({ ...customer, fullName: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1 block">Phone Number *</label>
                  <input
                    type="text" required
                    value={customer.phoneNo} onChange={e => setCustomer({ ...customer, phoneNo: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                    placeholder="03001234567"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1 block">House/Flat No *</label>
                  <input
                    type="text" required
                    value={customer.houseNo} onChange={e => setCustomer({ ...customer, houseNo: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                    placeholder="House / Flat #12"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1 block">Street Name/No *</label>
                    <input
                      type="text" required
                      value={customer.streetNameNo} onChange={e => setCustomer({ ...customer, streetNameNo: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                      placeholder="Street 5"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1 block">Area Name *</label>
                    <input
                      type="text" required
                      value={customer.areaName} onChange={e => setCustomer({ ...customer, areaName: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                      placeholder="Sector G-9 / Gulberg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1 block">City *</label>
                    <input
                      type="text" required
                      value={customer.city} onChange={e => setCustomer({ ...customer, city: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                      placeholder="Karachi, Lahore..."
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1 block">Province *</label>
                    <input
                      type="text" required
                      value={customer.province} onChange={e => setCustomer({ ...customer, province: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                      placeholder="Punjab, Sindh..."
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1 block">Famous Place / Landmark (Optional)</label>
                  <input
                    type="text"
                    value={customer.famousPlace} onChange={e => setCustomer({ ...customer, famousPlace: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                    placeholder="Near Central Mosque"
                  />
                </div>

                {/* Total & Checkout */}
                <div className="pt-4 border-t border-white/10 mt-6">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-white font-bold text-base">Grand Total</span>
                    <span className="text-2xl font-black text-amber-500">Rs {totalAmount?.toLocaleString()}</span>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-amber-500 text-black hover:bg-amber-400 font-extrabold rounded-2xl transition-all uppercase tracking-wider text-sm shadow-lg shadow-amber-500/20 disabled:opacity-50"
                  >
                    {loading ? "Placing Order..." : "Confirm & Place Order"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
