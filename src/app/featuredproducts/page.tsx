"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import axios from "axios";
import { useCart } from "@/context/CartContext";

import { API_URL } from "@/config/api";

export default function FeaturedProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { addToCart } = useCart();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${API_URL}/products?featured=true`);
        setProducts(res.data);
      } catch (err) {
        console.error("Error loading featured products:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="flex flex-col flex-1 pb-20 pt-28 px-4">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-amber-500 uppercase tracking-widest mb-2" style={{ fontFamily: 'Times New Roman, serif' }}>
            Featured Products
          </h1>
          <p className="text-zinc-300 text-sm">Hand-picked premium selections</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 text-zinc-400 text-lg">No featured products currently available.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => {
              const discountedPrice = product.hasDiscount && product.discountPercent > 0
                ? product.price - (product.price * (product.discountPercent / 100))
                : product.price;

              return (
                <motion.div
                  key={product._id}
                  whileHover={{ y: -10 }}
                  className="bg-white rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between group"
                >
                  <Link href={`/product/${product._id}`} className="block h-64 bg-zinc-100 relative overflow-hidden flex items-center justify-center">
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <span className="text-zinc-400 font-medium">{product.name}</span>
                    )}

                    <div className="absolute top-3 left-3 z-20 flex flex-col gap-1">
                      {product.isOutOfStock ? (
                        <span className="bg-red-600 text-white text-xs font-black px-2 py-1 rounded shadow uppercase">
                          Out Of Stock
                        </span>
                      ) : product.isLowInStock ? (
                        <span className="bg-yellow-500 text-black text-xs font-black px-2 py-1 rounded shadow uppercase">
                          Low In Stock!!
                        </span>
                      ) : null}

                      <span className="bg-amber-500 text-black text-xs font-black px-2 py-1 rounded shadow uppercase">
                        ★ Featured
                      </span>

                      {product.hasDiscount && product.discountPercent > 0 && (
                        <span className="bg-red-500 text-white text-xs font-black px-2 py-1 rounded shadow uppercase">
                          Sale {product.discountPercent}%
                        </span>
                      )}
                    </div>
                  </Link>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <Link href={`/product/${product._id}`} className="text-black font-bold text-lg mb-1 hover:text-amber-600 transition-colors line-clamp-1 block">
                        {product.name}
                      </Link>
                      <p className="text-zinc-500 text-xs font-medium mb-3">{product.category?.name}</p>
                    </div>

                    <div>
                      <div className="flex justify-between items-center my-2">
                        {product.hasDiscount && product.discountPercent > 0 ? (
                          <>
                            <span className="text-zinc-400 font-bold line-through text-xs">Rs {product.price?.toLocaleString()}</span>
                            <span className="text-amber-600 font-black text-lg">Rs {discountedPrice?.toLocaleString()}</span>
                          </>
                        ) : (
                          <span className="text-amber-600 font-black text-lg">Rs {product.price?.toLocaleString()}</span>
                        )}
                      </div>

                      {product.isOutOfStock ? (
                        <button disabled className="w-full py-2.5 bg-zinc-300 text-zinc-500 font-bold text-xs rounded-xl cursor-not-allowed uppercase">
                          Out of Stock
                        </button>
                      ) : (
                        <button 
                          onClick={() => addToCart(product)}
                          className="w-full py-2.5 bg-black text-white hover:bg-amber-500 hover:text-black font-bold text-xs rounded-xl transition-colors uppercase tracking-wider shadow"
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
