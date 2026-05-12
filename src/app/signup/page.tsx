"use client";

import { useEffect, useState } from "react";
import { animate } from "animejs";
import { Mail, Lock, User, MapPin, Phone, Calendar, Loader2, ArrowRight, ShieldCheck, CheckCircle2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { auth, db } from "@/lib/firebase";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";
import toast from "react-hot-toast";

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
  
  const [step, setStep] = useState(1); // 1: Form, 2: OTP
  const [otp, setOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (user && mounted) router.push("/discover");

    if (typeof window !== "undefined" && !(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-signup', {
        'size': 'invisible'
      });
    }

    animate('.animate-signup', {
      opacity: [0, 1],
      translateY: [20, 0],
      delay: (el: any, i: number) => i * 100,
      duration: 1000,
      ease: 'outExpo'
    });
  }, [user, router, mounted]);

  const handleStartSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.phone.length < 10) return toast.error("Valid phone required");
    
    setIsSubmitting(true);
    try {
      const appVerifier = (window as any).recaptchaVerifier;
      const formatPhone = formData.phone.startsWith("+") ? formData.phone : `+91${formData.phone}`;
      
      const result = await signInWithPhoneNumber(auth, formatPhone, appVerifier);
      setConfirmationResult(result);
      setStep(2);
      toast.success("OTP sent to " + formatPhone);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "SMS failed. Check Firebase Billing.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyAndCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult || otp.length < 6) return toast.error("Enter 6-digit code");

    setIsSubmitting(true);
    try {
      // 1. Verify the OTP (This logs them in via Phone)
      const credential = await confirmationResult.confirm(otp);
      const phoneUser = credential.user;

      // 2. Link Email & Password to this Phone User
      const { linkWithCredential, EmailAuthProvider, updateProfile } = await import("firebase/auth");
      const emailCred = EmailAuthProvider.credential(formData.email, formData.password);
      
      await linkWithCredential(phoneUser, emailCred);
      
      // 3. Set Display Name
      await updateProfile(phoneUser, { displayName: formData.name });

      // 4. Create Firestore Profile
      const { setDoc, doc } = await import("firebase/firestore");
      await setDoc(doc(db, "users", phoneUser.uid), {
        name: formData.name,
        email: formData.email,
        age: parseInt(formData.age),
        phone: formData.phone,
        phoneVerified: true,
        district: formData.district,
        createdAt: new Date().toISOString()
      });
      
      toast.success("Identity Verified! Welcome to Datie.");
      router.push("/discover");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Invalid OTP or Linking failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-white px-6 pt-32 pb-20 relative overflow-hidden">
      
      <div id="recaptcha-signup"></div>

      <div className="w-full max-w-xl p-10 border-2 border-black rounded-[3rem] shadow-2xl animate-signup opacity-0 bg-white z-10">
        <div className="text-center mb-10 space-y-2">
           <h1 className="text-6xl font-black tracking-tighter italic uppercase leading-tight">Datie.</h1>
           <p className="text-gray-400 font-black uppercase text-[10px] tracking-widest">Create your verified profile.</p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleStartSignup} className="space-y-6">
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
              {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : "Verify Phone & Join Datie."}
              <ArrowRight size={20} />
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyAndCreate} className="space-y-8 animate-slide-left">
            <div className="text-center space-y-4">
               <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mx-auto">
                  <ShieldCheck size={32} />
               </div>
               <p className="text-gray-400 font-black uppercase text-[10px] tracking-widest leading-loose">
                  We've sent a 6-digit code to <br/> <span className="text-black font-black">{formData.phone}</span>
               </p>
            </div>
            <input 
              type="text" 
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="000000"
              className="w-full p-8 bg-gray-50 border-2 border-black rounded-[2rem] text-center text-4xl font-black tracking-[0.5em] outline-none"
            />
            <div className="flex flex-col gap-4">
               <button type="submit" disabled={isSubmitting} className="w-full py-6 bg-blue-600 text-white rounded-full font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-2xl disabled:opacity-50">
                  {isSubmitting ? <Loader2 className="animate-spin" /> : <>Verify & Create Account <CheckCircle2 size={18} /></>}
               </button>
               <button type="button" onClick={() => setStep(1)} className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors underline">Change Details</button>
            </div>
          </form>
        )}

        <p className="mt-8 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">
          Already a member? <Link href="/login" className="text-black underline">Sign In</Link>
        </p>
      </div>
    </main>
  );
}
