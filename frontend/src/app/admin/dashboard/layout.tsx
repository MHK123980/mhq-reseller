"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    
    if (!token || !userData) {
      router.push("/admin");
    } else {
      setUser(JSON.parse(userData));
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/admin");
  };

  if (!user) return <div className="flex-1 flex items-center justify-center bg-zinc-950 text-white">Loading Admin Portal...</div>;

  const navItems = [
    { name: "Overview", path: "/admin/dashboard" },
    { name: "Products", path: "/admin/dashboard/products" },
    { name: "Categories", path: "/admin/dashboard/categories" },
    { name: "Orders", path: "/admin/dashboard/orders" },
    ...(user.role === "Owner" ? [{ name: "Users", path: "/admin/dashboard/users" }] : []),
  ];

  return (
    <div className="flex flex-col md:flex-row flex-1 min-h-screen bg-zinc-950 text-white overflow-x-hidden">
      {/* Mobile Header Bar */}
      <header className="flex md:hidden items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800 sticky top-0 z-40">
        <div>
          <h2 className="text-lg font-bold text-amber-500">Admin Panel</h2>
          <p className="text-xs text-zinc-400">Role: <span className="text-zinc-200">{user.role}</span></p>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-zinc-300 hover:text-white bg-zinc-800 rounded-xl"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 border-r border-zinc-800 bg-zinc-900/80 flex-col shrink-0">
        <div className="p-6 border-b border-zinc-800">
          <h2 className="text-xl font-bold text-amber-500">Admin Panel</h2>
          <p className="text-sm text-zinc-400 mt-1">Role: <span className="text-zinc-200">{user.role}</span></p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link 
                key={item.path} 
                href={item.path}
                className={`block px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-amber-600/20 text-amber-500 font-bold border border-amber-500/30' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-zinc-800">
          <button 
            onClick={handleLogout}
            className="w-full px-4 py-3 text-left font-bold text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition-colors"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Drawer Navigation */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/70 z-50 md:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-72 bg-zinc-900 border-r border-zinc-800 z-50 p-6 flex flex-col md:hidden shadow-2xl"
            >
              <div className="flex items-center justify-between pb-6 border-b border-zinc-800 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-amber-500">Admin Panel</h2>
                  <p className="text-xs text-zinc-400 mt-1">Role: <span className="text-zinc-200">{user.role}</span></p>
                </div>
                <button onClick={() => setMobileOpen(false)} className="text-zinc-400 hover:text-white p-2">✕</button>
              </div>

              <nav className="flex-1 space-y-2 overflow-y-auto">
                {navItems.map((item) => {
                  const isActive = pathname === item.path;
                  return (
                    <Link 
                      key={item.path} 
                      href={item.path}
                      onClick={() => setMobileOpen(false)}
                      className={`block px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-amber-600/20 text-amber-500 font-bold border border-amber-500/30' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}
                    >
                      {item.name}
                    </Link>
                  );
                })}
              </nav>

              <div className="pt-4 border-t border-zinc-800">
                <button 
                  onClick={handleLogout}
                  className="w-full px-4 py-3 text-left font-bold text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area - Mobile & Desktop Compatible */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-8 relative w-full">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
