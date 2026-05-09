"use client";

import { useEffect, useRef, useState } from "react";
import anime from "animejs/lib/anime.es.js";
import { Heart, Mail, Lock, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();

  useEffect(() => {
    // Initial entrance animation
    const timeline = anime.timeline({
      easing: 'easeOutExpo',
    });

    timeline
      .add({
        targets: cardRef.current,
        opacity: [0, 1],
        translateY: [50, 0],
        duration: 1200,
        delay: 300
      })
      .add({
        targets: '.animate-item',
        opacity: [0, 1],
        translateX: [-20, 0],
        duration: 800,
        delay: anime.stagger(100)
      }, '-=800');

    // Floating animation for decorative elements
    anime({
      targets: '.floating-heart',
      translateY: [-10, 10],
      duration: 3000,
      direction: 'alternate',
      loop: true,
      easing: 'easeInOutQuad',
      delay: anime.stagger(500)
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      // Error handled in AuthContext with toast
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/login-bg.png"
          alt="Kerala Backwaters"
          fill
          className="object-cover opacity-60 scale-110"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-black/80" />
      </div>

      {/* Decorative Floating Elements */}
      <div className="absolute top-20 left-20 floating-heart opacity-20">
        <Heart size={48} className="text-[#D4AF37]" fill="currentColor" />
      </div>
      <div className="absolute bottom-40 right-20 floating-heart opacity-10">
        <Heart size={80} className="text-[#800000]" fill="currentColor" />
      </div>

      {/* Login Card */}
      <div 
        ref={cardRef}
        className="relative z-10 w-full max-w-md p-10 glass-morphism rounded-[2.5rem] border border-white/10 shadow-2xl opacity-0"
      >
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#D4AF37] mb-4 shadow-[0_0_20px_rgba(212,175,55,0.4)]">
            <Heart className="text-black" size={32} fill="currentColor" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
            Mallu<span className="text-[#D4AF37]">Love</span>
          </h1>
          <p className="text-gray-400 text-sm animate-item">Find your perfect match in God's Own Country</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="animate-item">
            <label className="block text-xs font-semibold text-[#D4AF37] uppercase tracking-widest mb-2 ml-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="me@kerala.com"
                required
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#D4AF37]/50 focus:bg-white/10 transition-all"
              />
            </div>
          </div>

          <div className="animate-item">
            <label className="block text-xs font-semibold text-[#D4AF37] uppercase tracking-widest mb-2 ml-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#D4AF37]/50 focus:bg-white/10 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center justify-between animate-item text-xs">
            <label className="flex items-center gap-2 text-gray-400 cursor-pointer group">
              <input type="checkbox" className="w-4 h-4 rounded border-white/10 bg-white/5 accent-[#D4AF37]" />
              <span className="group-hover:text-white transition-colors">Remember me</span>
            </label>
            <Link href="#" className="text-[#D4AF37] hover:text-[#B8860B] transition-colors font-medium">
              Forgot Password?
            </Link>
          </div>

          <button 
            disabled={isSubmitting}
            className="animate-item w-full py-4 bg-[#D4AF37] hover:bg-[#B8860B] text-black font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-[0_0_30px_rgba(212,175,55,0.3)] active:scale-95 group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Signing in..." : "Sign In"}
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <div className="mt-10">
          <div className="relative flex items-center justify-center mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <span className="relative px-4 bg-transparent text-gray-500 text-xs uppercase tracking-widest">
              Or continue with
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 animate-item">
            <button className="flex items-center justify-center gap-2 py-3 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-all">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.042-1.416-4.042-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              <span className="text-sm">Github</span>
            </button>
            <button className="flex items-center justify-center gap-2 py-3 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-all">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span className="text-sm">Google</span>
            </button>
          </div>
        </div>

        <p className="mt-10 text-center text-gray-500 text-sm animate-item">
          Don't have an account?{" "}
          <Link href="#" className="text-[#D4AF37] hover:underline font-semibold">
            Create Profile
          </Link>
        </p>
      </div>

      {/* Footer Info */}
      <div className="absolute bottom-8 left-0 right-0 text-center z-10 animate-item opacity-40">
        <p className="text-[10px] text-gray-500 uppercase tracking-[0.3em]">
          Made with ❤️ in Kerala • Premium Dating Experience
        </p>
      </div>
    </div>
  );
}
