"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, User, Search, Home, Sun, Moon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 sm:px-8 py-5 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-100 dark:border-neutral-800 transition-colors duration-300">
      <Link href="/" className="flex items-center gap-2 group">
        <Heart size={22} className="text-black dark:text-white fill-black dark:fill-white transition-transform group-hover:scale-110" />
        <span className="font-black italic text-2xl tracking-tighter uppercase text-black dark:text-white">Datie.</span>
      </Link>
      
      <div className="flex items-center gap-4 sm:gap-6">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          title={`Switch to ${theme === "light" ? "Dark" : "Light"} Mode`}
          className="w-10 h-10 rounded-full border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-sm"
        >
          {theme === "light" ? (
            <Moon size={18} className="text-neutral-700" />
          ) : (
            <Sun size={18} className="text-yellow-400" />
          )}
        </button>

        {!user ? (
          !["/", "/login", "/signup"].includes(pathname) && (
            <>
              <Link href="/login" className="text-[10px] font-black uppercase tracking-widest text-neutral-800 dark:text-neutral-200 hover:opacity-50 transition-all">Sign In</Link>
              <Link href="/signup" className="text-[10px] font-black uppercase tracking-widest bg-black dark:bg-white text-white dark:text-black px-6 sm:px-8 py-3 rounded-full hover:scale-105 transition-all shadow-xl">
                Join Datie.
              </Link>
            </>
          )
        ) : (
          <div className="flex items-center gap-5 sm:gap-8">
            <NavLink href="/" active={pathname === "/"} label="Home" icon={<Home size={18} />} />
            <NavLink href="/discover" active={pathname === "/discover"} label="Discover" icon={<Search size={18} />} />
            <NavLink href="/matches" active={pathname === "/matches"} label="Matches" icon={<Heart size={18} />} />
            <NavLink href="/profile" active={pathname === "/profile"} label="Profile" icon={<User size={18} />} />
            
            <div className="flex items-center gap-3 sm:gap-4 border-l pl-4 sm:pl-6 border-gray-200 dark:border-neutral-800">
              <div className="w-8 h-8 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-xs font-bold shadow-lg">
                {user.displayName?.[0] || user.email?.[0] || "U"}
              </div>
              <button onClick={logout} className="text-xs font-black uppercase tracking-widest hover:text-red-500 transition-all text-gray-400 dark:text-neutral-500">
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

function NavLink({ href, active, label, icon }: { href: string; active: boolean; label: string; icon: React.ReactNode }) {
  return (
    <Link 
      href={href} 
      className={`flex items-center gap-2 text-sm font-bold transition-all ${
        active 
          ? "text-black dark:text-white font-black" 
          : "text-gray-400 dark:text-neutral-500 hover:text-black dark:hover:text-white"
      }`}
    >
      {icon}
      <span className="hidden md:block">{label}</span>
    </Link>
  );
}
