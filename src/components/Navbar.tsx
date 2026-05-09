"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Search, MessageCircle, User, LogIn } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-4xl px-6 py-4 glass-morphism rounded-[2rem] flex items-center justify-between border border-white/20 shadow-2xl">
      <Link href="/" className="flex items-center gap-2">
        <div className="bg-[#D4AF37] p-1.5 rounded-lg">
          <Heart size={18} fill="black" className="text-black" />
        </div>
        <span className="font-bold text-xl tracking-tight hidden sm:block">
          Mallu<span className="gold-text">Love</span>
        </span>
      </Link>

      <div className="flex items-center gap-1 sm:gap-4">
        <NavLink href="/" active={pathname === "/"} label="Home" />
        {user ? (
          <>
            <NavLink href="/discover" active={pathname === "/discover"} label="Discover" icon={<Search size={18} />} />
            <NavLink href="/matches" active={pathname === "/matches"} label="Matches" icon={<Heart size={18} />} />
            <NavLink href="/chat" active={pathname === "/chat"} label="Chat" icon={<MessageCircle size={18} />} />
            <NavLink href="/profile" active={pathname === "/profile"} label="Profile" icon={<User size={18} />} />
          </>
        ) : (
          <NavLink href="/login" active={pathname === "/login"} label="Sign In" icon={<LogIn size={18} />} />
        )}
      </div>

      {!user && !loading && (
        <Link href="/register" className="hidden sm:block px-5 py-2 bg-[#D4AF37] text-black text-sm font-bold rounded-full hover:bg-[#B8860B] transition-all">
          Join Now
        </Link>
      )}
      
      {user && (
        <div className="hidden sm:flex items-center gap-2">
           <div className="w-8 h-8 rounded-full bg-[#D4AF37] flex items-center justify-center text-black font-bold text-xs">
              {user.name[0]}
           </div>
        </div>
      )}
    </nav>
  );
}

function NavLink({ href, active, label, icon }: { href: string; active: boolean; label: string; icon?: React.ReactNode }) {
  return (
    <Link 
      href={href} 
      className={`relative px-3 py-2 text-sm font-medium transition-all flex items-center gap-2 rounded-xl ${
        active 
          ? "text-[#D4AF37] bg-[#D4AF37]/10" 
          : "text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5"
      }`}
    >
      {icon}
      <span className={icon ? "hidden md:block" : ""}>{label}</span>
      {active && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#D4AF37] rounded-full" />}
    </Link>
  );
}
