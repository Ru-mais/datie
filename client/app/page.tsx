import Image from "next/image";
import Link from "next/link";
import { Heart, Sparkles, MapPin, Users } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-[#FAFAFA] dark:bg-[#0F0F0F] font-sans">
      {/* Hero Section */}
      <section className="relative h-[90vh] flex items-center justify-center overflow-hidden">
        <Image
          src="/login-bg.png"
          alt="Kerala Backwaters Hero"
          fill
          className="object-cover opacity-80"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-[#FAFAFA] dark:to-[#0F0F0F]" />
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-morphism text-[#D4AF37] mb-8 border border-[#D4AF37]/30">
            <Sparkles size={16} />
            <span className="text-xs font-bold uppercase tracking-widest">Premium Kerala Dating</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-bold text-white mb-6 tracking-tight">
            Mallu<span className="text-[#D4AF37]">Love</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-white/90 mb-10 font-light max-w-2xl mx-auto leading-relaxed">
            Discover meaningful connections rooted in tradition, 
            blending modern love with the soul of Kerala.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/login" 
              className="px-10 py-5 bg-[#D4AF37] hover:bg-[#B8860B] text-black font-bold rounded-2xl transition-all shadow-[0_0_30px_rgba(212,175,55,0.4)] active:scale-95 text-lg"
            >
              Get Started
            </Link>
            <button className="px-10 py-5 glass-morphism text-white font-bold rounded-2xl border border-white/20 hover:bg-white/10 transition-all text-lg">
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Features/Stats Section */}
      <section className="py-24 px-4 bg-white dark:bg-[#1A1A1A]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-[#F5F5DC] dark:bg-[#D4AF37]/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-[#D4AF37]">
              <Heart size={32} fill="currentColor" />
            </div>
            <h3 className="text-xl font-bold mb-3">Authentic Matches</h3>
            <p className="text-gray-500 text-sm">Verified profiles ensuring real connections across all districts.</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-[#F5F5DC] dark:bg-[#D4AF37]/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-[#D4AF37]">
              <MapPin size={32} />
            </div>
            <h3 className="text-xl font-bold mb-3">Local Context</h3>
            <p className="text-gray-500 text-sm">Tailored for the Malayali community with cultural nuances.</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-[#F5F5DC] dark:bg-[#D4AF37]/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-[#D4AF37]">
              <Users size={32} />
            </div>
            <h3 className="text-xl font-bold mb-3">Growing Community</h3>
            <p className="text-gray-500 text-sm">Join thousands of single Malayalis searching for love.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-100 dark:border-white/5 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Heart size={20} className="text-[#D4AF37]" fill="currentColor" />
          <span className="font-bold text-lg tracking-tight">MalluLove</span>
        </div>
        <p className="text-gray-500 text-sm">© 2026 MalluLove. All rights reserved.</p>
      </footer>
    </div>
  );
}
