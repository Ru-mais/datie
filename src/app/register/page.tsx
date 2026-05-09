"use client";

import { useEffect, useRef, useState } from "react";
import anime from "animejs/lib/anime.es.js";
import { Heart, Mail, Lock, User, MapPin, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";

const DISTRICTS = [
  'Alappuzha', 'Ernakulam', 'Idukki', 'Kannur', 'Kasaragod', 
  'Kollam', 'Kottayam', 'Kozhikode', 'Malappuram', 'Palakkad', 
  'Pathanamthitta', 'Thiruvananthapuram', 'Thrissur', 'Wayanad'
];

export default function RegisterPage() {
  const cardRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    age: "",
    gender: "Male",
    district: "Ernakulam",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const timeline = anime.timeline({ easing: 'easeOutExpo' });
    timeline.add({
      targets: cardRef.current,
      opacity: [0, 1],
      translateY: [50, 0],
      duration: 1200,
      delay: 300
    }).add({
      targets: '.animate-item',
      opacity: [0, 1],
      translateX: [-20, 0],
      duration: 800,
      delay: anime.stagger(100)
    }, '-=800');

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
      const { data } = await axios.post("http://localhost:5000/api/v1/auth/register", {
        ...formData,
        age: parseInt(formData.age)
      }, { withCredentials: true });
      
      toast.success("Welcome to MalluLove!");
      router.push("/profile"); // Go to profile to complete it
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black py-20">
      <div className="absolute inset-0 z-0">
        <Image src="/login-bg.png" alt="Kerala" fill className="object-cover opacity-60 scale-110" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
      </div>

      <div ref={cardRef} className="relative z-10 w-full max-w-xl p-10 glass-morphism rounded-[2.5rem] border border-white/10 shadow-2xl opacity-0 mx-4">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
            Join <span className="gold-text">MalluLove</span>
          </h1>
          <p className="text-gray-400 text-sm animate-item">Start your journey to find true Keralite love</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="animate-item space-y-2">
              <label className="text-xs font-semibold text-[#D4AF37] uppercase tracking-widest ml-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input 
                  type="text" required placeholder="Suku Kumar"
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-[#D4AF37]/50 transition-all"
                />
              </div>
            </div>

            <div className="animate-item space-y-2">
              <label className="text-xs font-semibold text-[#D4AF37] uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input 
                  type="email" required placeholder="me@kerala.com"
                  value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-[#D4AF37]/50 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="animate-item space-y-2">
              <label className="text-xs font-semibold text-[#D4AF37] uppercase tracking-widest ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input 
                  type="password" required placeholder="••••••••"
                  value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-[#D4AF37]/50 transition-all"
                />
              </div>
            </div>

            <div className="animate-item space-y-2">
              <label className="text-xs font-semibold text-[#D4AF37] uppercase tracking-widest ml-1">Age</label>
              <input 
                type="number" required min="18" placeholder="24"
                value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-[#D4AF37]/50 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="animate-item space-y-2">
              <label className="text-xs font-semibold text-[#D4AF37] uppercase tracking-widest ml-1">Gender</label>
              <select 
                value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-[#D4AF37]/50 transition-all appearance-none"
              >
                <option value="Male" className="bg-black">Male</option>
                <option value="Female" className="bg-black">Female</option>
                <option value="Other" className="bg-black">Other</option>
              </select>
            </div>

            <div className="animate-item space-y-2">
              <label className="text-xs font-semibold text-[#D4AF37] uppercase tracking-widest ml-1">District</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <select 
                  value={formData.district} onChange={e => setFormData({...formData, district: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-[#D4AF37]/50 transition-all appearance-none"
                >
                  {DISTRICTS.map(d => <option key={d} value={d} className="bg-black">{d}</option>)}
                </select>
              </div>
            </div>
          </div>

          <button 
            disabled={isSubmitting}
            className="animate-item w-full py-4 bg-[#D4AF37] hover:bg-[#B8860B] text-black font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-[0_0_30px_rgba(212,175,55,0.3)] active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? "Creating Account..." : "Create Account"}
            <ArrowRight size={20} />
          </button>
        </form>

        <p className="mt-10 text-center text-gray-500 text-sm animate-item">
          Already have an account?{" "}
          <Link href="/login" className="text-[#D4AF37] hover:underline font-semibold">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
