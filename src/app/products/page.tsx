"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import axios from "axios";
import { io } from "socket.io-client";
import { useCart } from "@/context/CartContext";
import { API_URL, SOCKET_URL } from "@/config/api";

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const { addToCart } = useCart();

  const fetchData = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        axios.get(`${API_URL}/products`),
        axios.get(`${API_URL}/categories`),
      ]);
      setProducts(prodRes.data);
      setCategories(catRes.data);
    } catch (err) {
      console.error("Error loading products:", err);
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

  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory ? (product.category?._id === selectedCategory || product.category === selectedCategory) : true;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex flex-col flex-1 pb-20 pt-24 sm:pt-28 px-4 w-full overflow-x-hidden">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-8 sm:mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-amber-500 uppercase tracking-widest mb-2" style={{ fontFamily: 'Times New Roman, serif' }}>
            All Products
          </h1>
          <p className="text-zinc-300 text-xs sm:text-sm">Explore our complete collection</p>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-zinc-950/90 backdrop-blur-md p-4 rounded-2xl border border-amber-500/30 mb-8 sm:mb-10 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-xl">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-72 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
          />

          <div className="flex flex-wrap gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
            <button
              onClick={() => setSelectedCategory("")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedCategory === "" ? "bg-amber-500 text-black shadow" : "bg-zinc-800 text-zinc-400 hover:text-white"
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat._id}
                onClick={() => setSelectedCategory(cat._id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  selectedCategory === cat._id ? "bg-amber-500 text-black shadow" : "bg-zinc-800 text-zinc-400 hover:text-white"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 text-zinc-400 text-lg">No products found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6">
            {filteredProducts.map((product) => {
              const discountedPrice = product.hasDiscount && product.discountPercent > 0
                ? product.price - (product.price * (product.discountPercent / 100))
                : product.price;

              return (
                <motion.div
                  key={product._id}
                  whileHover={{ y: -8 }}
                  className="bg-zinc-900 border border-zinc-700/80 rounded-2xl overflow-hidden shadow-2xl flex flex-col justify-between group"
                >
                  <Link href={`/product/${product._id}`} className="block h-56 sm:h-64 bg-zinc-950 relative overflow-hidden flex items-center justify-center">
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <span className="text-zinc-500 font-medium text-sm">{product.name}</span>
                    )}

                    <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5">
                      {product.isOutOfStock ? (
                        <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded shadow uppercase">
                          Out Of Stock
                        </span>
                      ) : product.isLowInStock ? (
                        <span className="bg-yellow-500 text-black text-[10px] font-black px-2 py-0.5 rounded shadow uppercase">
                          Low In Stock!!
                        </span>
                      ) : null}

                      {product.isFeatured && (
                        <span className="bg-amber-500 text-black text-[10px] font-black px-2 py-0.5 rounded shadow uppercase">
                          ★ Featured
                        </span>
                      )}

                      {product.hasDiscount && product.discountPercent > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded shadow uppercase">
                          Sale {product.discountPercent}%
                        </span>
                      )}
                    </div>
                  </Link>

                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between bg-zinc-900">
                    <div>
                      <Link href={`/product/${product._id}`} className="text-white font-bold text-base sm:text-lg mb-1 hover:text-amber-400 transition-colors line-clamp-1 block">
                        {product.name}
                      </Link>
                      <p className="text-amber-500/80 text-xs font-semibold mb-3">{product.category?.name}</p>
                    </div>

                    <div>
                      <div className="flex justify-between items-center my-2">
                        {product.hasDiscount && product.discountPercent > 0 ? (
                          <>
                            <span className="text-zinc-500 font-bold line-through text-xs">Rs {product.price?.toLocaleString()}</span>
                            <span className="text-amber-400 font-black text-base sm:text-lg">Rs {discountedPrice?.toLocaleString()}</span>
                          </>
                        ) : (
                          <span className="text-amber-400 font-black text-base sm:text-lg">Rs {product.price?.toLocaleString()}</span>
                        )}
                      </div>

                      {product.isOutOfStock ? (
                        <button disabled className="w-full py-2.5 bg-zinc-800 text-zinc-500 font-bold text-xs rounded-xl cursor-not-allowed uppercase">
                          Out of Stock
                        </button>
                      ) : (
                        <button 
                          onClick={() => addToCart(product)}
                          className="w-full py-2.5 bg-amber-600 text-white hover:bg-amber-500 font-bold text-xs rounded-xl transition-colors uppercase tracking-wider shadow"
                        >
                          Add to Cart
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
