"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import axios from "axios";
import { useCart } from "@/context/CartContext";

import { API_URL } from "@/config/api";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [product, setProduct] = useState<any>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);

  const { addToCart } = useCart();

  useEffect(() => {
    if (!id) return;
    const fetchProduct = async () => {
      try {
        const res = await axios.get(`${API_URL}/products/${id}`);
        setProduct(res.data);
      } catch (err) {
        console.error("Error loading product detail:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-32">
        <div className="animate-spin w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center py-32 px-4 text-center">
        <h1 className="text-3xl font-bold text-white mb-4">Product Not Found</h1>
        <Link href="/products" className="px-6 py-3 bg-amber-500 text-black font-bold rounded-xl hover:bg-amber-600 transition-colors">
          Back to All Products
        </Link>
      </div>
    );
  }

  const discountedPrice = product.hasDiscount && product.discountPercent > 0
    ? product.price - (product.price * (product.discountPercent / 100))
    : product.price;

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    addToCart(product, quantity);
    router.push("/cart");
  };

  return (
    <div className="flex flex-col flex-1 pb-24 pt-28 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Back Link */}
        <Link href="/products" className="inline-flex items-center text-zinc-300 hover:text-amber-500 mb-8 transition-colors text-sm font-medium">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to Products
        </Link>

        <div className="bg-black/70 backdrop-blur-md rounded-3xl border border-amber-500/20 shadow-2xl p-6 md:p-10 grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Images Gallery */}
          <div className="flex flex-col gap-4">
            <div className="h-80 md:h-[450px] bg-zinc-900 rounded-2xl overflow-hidden relative border border-white/10 flex items-center justify-center">
              {product.images?.[selectedImageIndex] ? (
                <img
                  src={product.images[selectedImageIndex]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-zinc-500">No Image Available</span>
              )}

              {/* Status Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                {product.isOutOfStock ? (
                  <span className="bg-red-600 text-white text-xs font-black px-3 py-1.5 rounded-lg shadow uppercase tracking-wider">
                    Out Of Stock
                  </span>
                ) : product.isLowInStock ? (
                  <span className="bg-yellow-500 text-black text-xs font-black px-3 py-1.5 rounded-lg shadow uppercase tracking-wider">
                    Low In Stock!!
                  </span>
                ) : null}

                {product.isFeatured && (
                  <span className="bg-amber-500 text-black text-xs font-black px-3 py-1.5 rounded-lg shadow uppercase tracking-wider">
                    ★ Featured
                  </span>
                )}

                {product.hasDiscount && product.discountPercent > 0 && (
                  <span className="bg-red-500 text-white text-xs font-black px-3 py-1.5 rounded-lg shadow uppercase tracking-wider">
                    Sale {product.discountPercent}% OFF
                  </span>
                )}
              </div>
            </div>

            {/* Thumbnail Selectors */}
            {product.images?.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {product.images.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                      selectedImageIndex === idx ? "border-amber-500 scale-105" : "border-zinc-700 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info & Actions */}
          <div className="flex flex-col justify-between">
            <div>
              <div className="mb-2">
                <span className="text-amber-500 text-xs font-bold uppercase tracking-widest bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                  {product.category?.name || "General"}
                </span>
              </div>

              <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-4 mt-3 tracking-wide">
                {product.name}
              </h1>

              {/* Pricing Section */}
              <div className="bg-zinc-900/80 p-5 rounded-2xl border border-white/10 mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-zinc-400 text-xs uppercase tracking-wider mb-1">Price</p>
                  <div className="flex items-baseline gap-3">
                    {product.hasDiscount && product.discountPercent > 0 ? (
                      <>
                        <span className="text-3xl font-black text-amber-500">
                          Rs {discountedPrice?.toLocaleString()}
                        </span>
                        <span className="text-lg font-bold text-zinc-500 line-through">
                          Rs {product.price?.toLocaleString()}
                        </span>
                      </>
                    ) : (
                      <span className="text-3xl font-black text-amber-500">
                        Rs {product.price?.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Delivery Info */}
                <div className="text-right">
                  <p className="text-zinc-400 text-xs uppercase tracking-wider mb-1">Shipping</p>
                  {product.isFreeDelivery ? (
                    <span className="bg-green-500/20 text-green-400 font-bold text-xs px-3 py-1.5 rounded-lg border border-green-500/30 uppercase tracking-wider">
                      Free Delivery
                    </span>
                  ) : (
                    <span className="text-white font-bold text-sm">
                      Rs {product.deliveryCharges || 0} Delivery
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="mb-8">
                <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-2">Description</h3>
                <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-line bg-zinc-900/40 p-4 rounded-xl border border-white/5">
                  {product.description}
                </p>
              </div>
            </div>

            {/* Quantity & Cart Action Buttons */}
            <div className="space-y-4 pt-4 border-t border-white/10">
              {/* Quantity Selector */}
              {!product.isOutOfStock && (
                <div className="flex items-center gap-4">
                  <span className="text-white font-bold text-sm uppercase tracking-wider">Quantity:</span>
                  <div className="flex items-center bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-4 py-2 text-white hover:bg-amber-500 hover:text-black font-bold transition-colors"
                    >-</button>
                    <span className="px-5 py-2 text-amber-400 font-bold text-sm">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-4 py-2 text-white hover:bg-amber-500 hover:text-black font-bold transition-colors"
                    >+</button>
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                {product.isOutOfStock ? (
                  <button
                    disabled
                    className="w-full py-4 bg-zinc-700 text-zinc-400 font-bold rounded-2xl cursor-not-allowed uppercase tracking-wider text-center"
                  >
                    Out of Stock
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleAddToCart}
                      className="flex-1 py-4 bg-zinc-900 border-2 border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-black font-extrabold rounded-2xl transition-all uppercase tracking-wider shadow-lg flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                      {added ? "Added to Cart!" : "Add to Cart"}
                    </button>

                    <button
                      onClick={handleBuyNow}
                      className="flex-1 py-4 bg-amber-500 text-black hover:bg-amber-400 font-black rounded-2xl transition-all uppercase tracking-wider shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
                    >
                      Buy Now
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
