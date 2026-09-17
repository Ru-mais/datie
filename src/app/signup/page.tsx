"use client";

import { useEffect, useState } from "react";
import { animate } from "animejs";
import { Mail, Lock, User, MapPin, Phone, Calendar, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

const DISTRICTS = [
  "Alappuzha", "Ernakulam", "Idukki", "Kannur", "Kasaragod", 
  "Kollam", "Kottayam", "Kozhikode", "Malappuram", "Palakkad", 
  "Pathanamthitta", "Thiruvananthapuram", "Thrissur", "Wayanad"
];

export default function SignupPage() {
  const router = useRouter();
  const { signupWithEmail, user } = useAuth();
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    age: "",
    phone: "",
    district: "Ernakulam"
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  useEffect(() => {
    if (user) {
      router.push("/discover");
      return;
    }

    animate('.animate-signup', {
      opacity: [0, 1],
      translateY: [20, 0],
      delay: (_el: unknown, i: number) => i * 100,
      duration: 1000,
      ease: 'outExpo'
    });
  }, [user, router]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.phone.length < 10) return toast.error("Valid phone required");
    
    setIsSubmitting(true);
    try {
      // Check if phone number is already registered
      const phoneDoc = await getDoc(doc(db, "used_phones", formData.phone));
      if (phoneDoc.exists()) {
        toast.error("This phone number is already registered.");
        setIsSubmitting(false);
        return;
      }

      // Create account using the unified email system
      await signupWithEmail(formData.email, formData.password, formData.name, {
        age: parseInt(formData.age),
        phone: formData.phone,
        phoneVerified: true,
        district: formData.district
      });
      
      toast.success("Account Created! Please check your email to verify your account.");
      router.push("/discover");
    } catch (err: unknown) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "Signup failed. Account may already exist.";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <main className="min-h-screen flex items-center justify-center bg-white px-6 pt-32 pb-20 relative overflow-hidden">
      
      <div className="w-full max-w-xl p-10 border-2 border-black rounded-[3rem] shadow-2xl animate-signup opacity-0 bg-white z-10">
        <div className="text-center mb-10 space-y-2">
           <h1 className="text-6xl font-black tracking-tighter italic uppercase leading-tight">Datie.</h1>
           <p className="text-gray-400 font-black uppercase text-[10px] tracking-widest">Create your verified profile.</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 animate-signup opacity-0">
              <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-4">Full Name</label>
              <div className="relative">
                <User className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" required placeholder="Name" 
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full pl-16 pr-6 py-5 bg-gray-50 border-2 border-transparent focus:border-black rounded-full font-bold transition-all outline-none" 
                />
              </div>
            </div>

            <div className="space-y-2 animate-signup opacity-0">
              <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-4">Age</label>
              <div className="relative">
                <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="number" required min="18" placeholder="Age" 
                  value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})}
                  className="w-full pl-16 pr-6 py-5 bg-gray-50 border-2 border-transparent focus:border-black rounded-full font-bold transition-all outline-none" 
                />
              </div>
            </div>
          </div>

          <div className="space-y-2 animate-signup opacity-0">
            <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-4">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="email" required placeholder="you@example.com" 
                value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full pl-16 pr-6 py-5 bg-gray-50 border-2 border-transparent focus:border-black rounded-full font-bold transition-all outline-none" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 animate-signup opacity-0">
              <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-4">District</label>
              <div className="relative">
                <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <select 
                  value={formData.district} onChange={e => setFormData({...formData, district: e.target.value})}
                  className="w-full pl-16 pr-6 py-5 bg-gray-50 border-2 border-transparent focus:border-black rounded-full font-bold transition-all outline-none appearance-none"
                >
                  {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-2 animate-signup opacity-0">
              <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-4">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="tel" required placeholder="00000 00000" 
                  value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full pl-16 pr-6 py-5 bg-gray-50 border-2 border-transparent focus:border-black rounded-full font-bold transition-all outline-none" 
                />
              </div>
            </div>
          </div>

          <div className="space-y-2 animate-signup opacity-0">
            <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-4">Password</label>
            <div className="relative">
              <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="password" required placeholder="••••••••" 
                value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                className="w-full pl-16 pr-6 py-5 bg-gray-50 border-2 border-transparent focus:border-black rounded-full font-bold transition-all outline-none" 
              />
            </div>
          </div>

          <button 
            disabled={isSubmitting}
            className="w-full py-6 bg-black text-white rounded-full font-black uppercase tracking-widest text-xs hover:scale-[1.02] transition-all flex items-center justify-center gap-3 shadow-2xl disabled:opacity-50 mt-4"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : "Join Datie."}
            <ArrowRight size={20} />
          </button>
        </form>

        <p className="mt-8 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">
          Already a member? <Link href="/login" className="text-black underline">Sign In</Link>
        </p>
      </div>
    </main>
  );
}
