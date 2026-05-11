"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, User, LogIn, Search, MessageCircle, Home } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-6 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <Link href="/" className="flex items-center gap-2 group">
        <Heart size={20} className="text-black fill-black" />
        <span className="font-black italic text-xl tracking-tighter uppercase">Datie.</span>
      </Link>
      
      <div className="flex items-center gap-6">
        {!user ? (
          <>
            <Link href="/login" className="text-[10px] font-black uppercase tracking-widest hover:opacity-50 transition-all">Sign In</Link>
            <Link href="/signup" className="text-[10px] font-black uppercase tracking-widest bg-black text-white px-8 py-3 rounded-full hover:scale-105 transition-all shadow-xl">
              Join Datie.
            </Link>
          </>
        ) : (
          <div className="flex items-center gap-8">
            <NavLink href="/" active={pathname === "/"} label="Home" icon={<Home size={18} />} />
            <NavLink href="/discover" active={pathname === "/discover"} label="Discover" icon={<Search size={18} />} />
            <NavLink href="/matches" active={pathname === "/matches"} label="Matches" icon={<Heart size={18} />} />
            <NavLink href="/profile" active={pathname === "/profile"} label="Profile" icon={<User size={18} />} />
            
            <div className="flex items-center gap-4 border-l pl-6 border-gray-200">
              <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold shadow-lg">
                {user.displayName?.[0] || user.email?.[0] || "U"}
              </div>
              <button onClick={logout} className="text-xs font-black uppercase tracking-widest hover:text-red-500 transition-all text-gray-400">
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
        active ? "text-black" : "text-gray-400 hover:text-black"
      }`}
    >
      {icon}
      <span className="hidden md:block">{label}</span>
    </Link>
  );
}
