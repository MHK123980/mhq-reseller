"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { io } from "socket.io-client";
import { useCart } from "@/context/CartContext";

import { API_URL, SOCKET_URL } from "@/config/api";

export default function Home() {
  const [categories, setCategories] = useState<any[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { addToCart } = useCart();

  const fetchData = async () => {
    try {
      const [catRes, featRes, prodRes] = await Promise.all([
        axios.get(`${API_URL}/categories`),
        axios.get(`${API_URL}/products?featured=true`),
        axios.get(`${API_URL}/products`),
      ]);
      setCategories(catRes.data);

      const all = prodRes.data || [];
      const feat = featRes.data || [];

      // If featured products exist use them, else fallback to all products
      setFeaturedProducts(feat.length > 0 ? feat.slice(0, 7) : all.slice(0, 7));
      setAllProducts(all.slice(0, 7));
    } catch (err) {
      console.error("Error fetching homepage data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Socket.io Real-time Live Connection (Instant Sync)
    const socket = io(SOCKET_URL, { withCredentials: true });

    socket.on("product:new", () => fetchData());
    socket.on("product:updated", () => fetchData());
    socket.on("product:deleted", () => fetchData());
    socket.on("category:new", () => fetchData());
    socket.on("category:updated", () => fetchData());
    socket.on("category:deleted", () => fetchData());

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="flex flex-col flex-1 pb-20 w-full overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative pt-24 sm:pt-32 pb-16 px-4 flex flex-col items-center justify-center text-center min-h-[65vh]">
        <div className="z-10 bg-black/80 backdrop-blur-md p-6 sm:p-10 md:p-14 rounded-3xl border border-amber-500/30 shadow-2xl max-w-4xl w-full">
          <h1 
            className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-widest mb-3 text-amber-500 drop-shadow-lg"
            style={{ fontFamily: 'Times New Roman, serif' }}
          >
            MHQ
          </h1>
          <h2 className="text-lg sm:text-2xl md:text-4xl font-semibold mb-5 text-white tracking-widest">
            Reseller (Broker)
          </h2>
          
          <div className="h-px w-24 sm:w-48 bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto mb-6 sm:mb-8"></div>
          
          <p className="text-sm sm:text-lg md:text-xl text-zinc-200 mb-8 tracking-wider font-light leading-relaxed">
            PREMIUM QUALITY. TRUSTED SERVICE.<br/>
            YOUR SUCCESS, OUR PRIORITY.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 sm:gap-8 mb-10 text-amber-500">
            {['Premium Quality', 'Trusted Deals', 'Secure Transactions', 'Fast Delivery'].map((feature, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border border-amber-500/50 flex items-center justify-center mb-2 bg-black/70 shadow-inner">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 bg-amber-500 rounded-sm rotate-45"></div>
                </div>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-zinc-300 text-center max-w-[90px]">{feature}</span>
              </div>
            ))}
          </div>
          
          <Link 
            href="/products" 
            className="group relative inline-flex items-center justify-center px-8 py-3.5 sm:px-10 sm:py-4 font-bold text-white transition-all duration-300 bg-amber-600 hover:bg-amber-500 hover:text-black rounded-full overflow-hidden shadow-[0_0_20px_rgba(245,158,11,0.4)]"
          >
            <span className="relative z-10 flex items-center tracking-widest uppercase text-sm sm:text-base">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              Shop Now
            </span>
          </Link>
        </div>
      </section>

      {/* Dynamic Categories Bar */}
      <section className="py-6 sm:py-8 px-4 bg-zinc-950/90 backdrop-blur-md border-y border-amber-500/30">
        <div className="container mx-auto max-w-5xl">
          <div className="flex flex-wrap justify-center gap-4 sm:gap-10">
            {categories.length > 0 ? (
              categories.map((cat) => (
                <Link key={cat._id} href={`/products?category=${cat._id}`}>
                  <div className="flex flex-col items-center cursor-pointer group">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-zinc-900 border border-amber-500/40 flex items-center justify-center mb-2 group-hover:border-amber-500 transition-colors shadow-lg">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-amber-500 group-hover:border-amber-400 rounded-md transition-colors"></div>
                    </div>
                    <span className="text-[11px] sm:text-xs font-bold tracking-wider text-amber-400 group-hover:text-amber-300 uppercase transition-colors text-center">{cat.name}</span>
                  </div>
                </Link>
              ))
            ) : (
              ['Fashion', 'Accessories', 'Electronics', 'Premium Picks', '& More'].map((cat) => (
                <div key={cat} className="flex flex-col items-center cursor-pointer group">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-zinc-900 border border-amber-500/40 flex items-center justify-center mb-2 group-hover:border-amber-500 transition-colors shadow-lg">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-amber-500 group-hover:border-amber-400 rounded-md transition-colors"></div>
                  </div>
                  <span className="text-[11px] sm:text-xs font-bold tracking-wider text-amber-400 group-hover:text-amber-300 uppercase transition-colors text-center">{cat}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
      
      {/* Featured Products Section */}
      <section className="py-14 sm:py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-10">
            <h2 className="inline-block px-6 sm:px-8 py-2.5 sm:py-3 bg-zinc-900 text-amber-400 border border-amber-500/40 font-extrabold text-xl sm:text-2xl tracking-widest uppercase rounded-xl shadow-xl">
              Featured Products
            </h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6">
            {featuredProducts.map((product) => {
              const discountedPrice = product.hasDiscount && product.discountPercent > 0
                ? product.price - (product.price * (product.discountPercent / 100))
                : product.price;

              return (
                <div 
                  key={product._id}
                  className="bg-zinc-900 border border-zinc-700/80 rounded-2xl overflow-hidden shadow-2xl group flex flex-col justify-between hover:-translate-y-1 transition-transform"
                >
                  <Link href={`/product/${product._id}`} className="block h-56 sm:h-64 bg-zinc-950 relative overflow-hidden flex items-center justify-center">
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <span className="text-zinc-500 font-medium text-sm">{product.name}</span>
                    )}

                    {/* Badges */}
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
                        <button 
                          disabled
                          className="w-full py-2.5 bg-zinc-800 text-zinc-500 font-bold text-xs rounded-xl cursor-not-allowed uppercase"
                        >
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
                </div>
              );
            })}
            
            {/* Show All Card */}
            <Link 
              href="/featuredproducts"
              className="bg-zinc-900 border-2 border-amber-500/30 rounded-2xl overflow-hidden shadow-2xl flex flex-col items-center justify-center cursor-pointer min-h-[220px] sm:min-h-[280px] hover:border-amber-500 transition-all group"
            >
              <div className="w-14 h-14 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </div>
              <h3 className="text-white font-bold text-lg uppercase tracking-wider">Show All</h3>
              <p className="text-amber-400 text-xs mt-1">Featured Products</p>
            </Link>
          </div>
        </div>
      </section>

      {/* All Products Section */}
      <section className="py-14 sm:py-20 px-4 bg-black/80 backdrop-blur-sm border-t border-amber-500/20">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-10">
            <h2 className="inline-block px-6 sm:px-8 py-2.5 sm:py-3 bg-zinc-900 text-amber-400 border border-amber-500/40 font-extrabold text-xl sm:text-2xl tracking-widest uppercase rounded-xl shadow-xl">
              All Products
            </h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6">
            {allProducts.map((product) => {
              const discountedPrice = product.hasDiscount && product.discountPercent > 0
                ? product.price - (product.price * (product.discountPercent / 100))
                : product.price;

              return (
                <div 
                  key={product._id}
                  className="bg-zinc-900 border border-zinc-700/80 rounded-2xl overflow-hidden shadow-2xl group flex flex-col justify-between hover:-translate-y-1 transition-transform"
                >
                  <Link href={`/product/${product._id}`} className="block h-56 sm:h-64 bg-zinc-950 relative overflow-hidden flex items-center justify-center">
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <span className="text-zinc-500 font-medium text-sm">{product.name}</span>
                    )}

                    {/* Badges */}
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
                        <button 
                          disabled
                          className="w-full py-2.5 bg-zinc-800 text-zinc-500 font-bold text-xs rounded-xl cursor-not-allowed uppercase"
                        >
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
                </div>
              );
            })}
            
            {/* Show All Card */}
            <Link 
              href="/products"
              className="bg-zinc-900 border-2 border-amber-500/30 rounded-2xl overflow-hidden shadow-2xl flex flex-col items-center justify-center cursor-pointer min-h-[220px] sm:min-h-[280px] hover:border-amber-500 transition-all group"
            >
              <div className="w-14 h-14 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </div>
              <h3 className="text-white font-bold text-lg uppercase tracking-wider">Show All</h3>
              <p className="text-amber-400 text-xs mt-1">Products</p>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
