"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();

  // Hide footer on admin routes
  if (pathname.startsWith("/admin")) return null;

  return (
    <footer className="border-t border-white/10 pt-16 pb-8 text-sm text-zinc-400 mt-auto bg-black/80 backdrop-blur-md z-10">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="text-2xl font-extrabold tracking-widest text-amber-500 mb-4 block" style={{ fontFamily: 'Times New Roman, serif' }}>
              MHQ <span className="text-sm text-white block -mt-1">Reseller (Broker)</span>
            </Link>
            <p className="text-zinc-500 mt-4 leading-relaxed">
              Premium quality, trusted service. Your success is our priority. Explore our exclusive collection of premium products today.
            </p>
          </div>
          
          {/* Quick Links */}
          <div>
            <h3 className="text-white font-bold mb-4 uppercase tracking-wider">Quick Links</h3>
            <ul className="space-y-3">
              <li><Link href="/" className="hover:text-amber-500 transition-colors">Home</Link></li>
              <li><Link href="/products" className="hover:text-amber-500 transition-colors">All Products</Link></li>
              <li><Link href="/featuredproducts" className="hover:text-amber-500 transition-colors">Featured Products</Link></li>
              <li><Link href="/categories" className="hover:text-amber-500 transition-colors">Categories</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-white font-bold mb-4 uppercase tracking-wider">Customer Service</h3>
            <ul className="space-y-3">
              <li><Link href="/about" className="hover:text-amber-500 transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-amber-500 transition-colors">Contact Us</Link></li>
              <li><Link href="/faq" className="hover:text-amber-500 transition-colors">FAQ</Link></li>
              <li><Link href="/shipping" className="hover:text-amber-500 transition-colors">Shipping & Returns</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-bold mb-4 uppercase tracking-wider">Legal</h3>
            <ul className="space-y-3">
              <li><Link href="/terms" className="hover:text-amber-500 transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-amber-500 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/refunds" className="hover:text-amber-500 transition-colors">Refund Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-zinc-500">
          <p>All Rights Reserved For MHQ Reseller (Broker) By MHT Devs.</p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            {/* Social Icons Placeholder */}
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-amber-500 hover:text-black transition-colors cursor-pointer">
              FB
            </div>
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-amber-500 hover:text-black transition-colors cursor-pointer">
              IG
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
