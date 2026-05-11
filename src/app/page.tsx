"use client";

import { useEffect } from "react";
import { animate } from "animejs";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";

export default function Home() {
  useEffect(() => {
    // Elegant entrance animations
    animate('.reveal-item', {
      opacity: [0, 1],
      translateY: [40, 0],
      delay: (el: any, i: number) => i * 200,
      duration: 2000,
      ease: 'outExpo'
    });

    // Logo pulse
    animate('.logo-glow', {
      scale: [1, 1.05, 1],
      opacity: [0.3, 0.5, 0.3],
      duration: 4000,
      loop: true,
      easing: 'easeInOutQuad'
    });
  }, []);

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center bg-white px-6 overflow-hidden">
      
      {/* Background Accent */}
      <div className="absolute inset-0 flex items-center justify-center -z-10 overflow-hidden pointer-events-none">
         <h1 className="logo-glow text-[40vw] font-black italic tracking-tighter text-gray-50 opacity-0 select-none uppercase">Datie.</h1>
      </div>

      <div className="max-w-4xl w-full text-center space-y-12">
        
        {/* Minimal Badge */}
        <div className="reveal-item opacity-0 flex items-center justify-center gap-2 mb-8">
           <span className="px-4 py-1.5 bg-black text-white text-[9px] font-black uppercase tracking-[0.3em] rounded-full flex items-center gap-2">
              <ShieldCheck size={12} /> Verified Profiles Only
           </span>
        </div>

        {/* Hero Title */}
        <div className="reveal-item opacity-0">
          <h1 className="text-8xl md:text-[12rem] font-black tracking-tighter text-black uppercase italic leading-none mb-4">
            Datie.
          </h1>
          <div className="h-1 w-24 bg-black mx-auto mb-8" />
        </div>
        
        {/* Minimal Tagline */}
        <p className="reveal-item opacity-0 text-2xl md:text-3xl text-gray-400 font-medium tracking-tight max-w-xl mx-auto leading-relaxed">
          The premium space for <span className="text-black italic">meaningful connections</span> in the Malayali community.
        </p>

        {/* CTA Buttons */}
        <div className="reveal-item opacity-0 pt-12 flex flex-col items-center gap-6">
          <Link 
            href="/signup" 
            className="group relative px-12 py-6 bg-black text-white font-black uppercase tracking-[0.2em] text-xs rounded-full hover:scale-110 active:scale-95 transition-all shadow-2xl flex items-center gap-4 overflow-hidden"
          >
            <span className="relative z-10">Enter Datie.</span>
            <ArrowRight size={18} className="relative z-10 group-hover:translate-x-2 transition-transform" />
            <div className="absolute inset-0 bg-blue-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
          </Link>

          <Link href="/login" className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300 hover:text-black transition-colors">
             Sign In to Your Galaxy
          </Link>
        </div>
      </div>

      {/* Footer Detail */}
      <div className="absolute bottom-12 flex flex-col items-center gap-4 reveal-item opacity-0">
         <div className="flex items-center gap-4">
            <span className="w-12 h-[1px] bg-gray-100" />
            <Sparkles className="text-gray-200" size={20} />
            <span className="w-12 h-[1px] bg-gray-100" />
         </div>
         <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-300">Kerala's Elite Dating Protocol</p>
      </div>

    </main>
  );
}
