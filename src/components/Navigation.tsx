"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/context/CartContext";

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { cartCount } = useCart();

  if (pathname.startsWith("/admin")) return null;

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-zinc-950/90 backdrop-blur-md border-b border-white/10 shadow-lg">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <Link href="/" className="text-xl md:text-3xl font-extrabold tracking-widest text-amber-500 drop-shadow-md" style={{ fontFamily: 'Times New Roman, serif' }}>
            MHQ <span className="text-sm md:text-xl text-white block -mt-1 md:-mt-2">Reseller (Broker)</span>
          </Link>
          
          <div className="flex items-center gap-4">
            <Link href="/cart" className="relative p-2 text-white hover:text-amber-500 transition-colors focus:outline-none">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-black transform translate-x-1/4 -translate-y-1/4 bg-amber-500 rounded-full animate-pulse">
                  {cartCount}
                </span>
              )}
            </Link>

            <button 
              onClick={() => setIsOpen(true)}
              className="p-2 text-white hover:text-amber-500 transition-colors focus:outline-none"
            >
              {/* Hamburger Icon */}
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-72 bg-zinc-950 border-l border-white/10 z-50 p-6 flex flex-col shadow-2xl"
            >
              <div className="flex justify-between items-center mb-12">
                <h2 className="text-xl font-bold text-amber-500">Menu</h2>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-zinc-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <nav className="flex flex-col space-y-6 text-lg font-medium">
                <Link href="/" onClick={() => setIsOpen(false)} className="text-white hover:text-amber-500 transition-colors">
                  Home
                </Link>
                <Link href="/products" onClick={() => setIsOpen(false)} className="text-white hover:text-amber-500 transition-colors">
                  Products
                </Link>
                <Link href="/categories" onClick={() => setIsOpen(false)} className="text-white hover:text-amber-500 transition-colors">
                  Categories
                </Link>
                <Link href="/contact" onClick={() => setIsOpen(false)} className="text-white hover:text-amber-500 transition-colors">
                  Contact
                </Link>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
