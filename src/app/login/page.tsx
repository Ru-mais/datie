"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Mail, Lock, ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Welcome back to Datie.");
      router.push("/discover");
    } catch (err: any) {
      toast.error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-12 animate-fade-in">
        <div className="text-center space-y-4">
           <div className="w-20 h-20 bg-black rounded-3xl flex items-center justify-center mx-auto shadow-2xl rotate-3">
              <ShieldCheck size={40} className="text-white" />
           </div>
           <h1 className="text-5xl font-black italic tracking-tighter uppercase">Datie.</h1>
           <p className="text-gray-400 font-black uppercase text-[10px] tracking-widest leading-loose">
             Sign in to your account.
           </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full p-5 pl-16 bg-gray-50 border-2 border-transparent focus:border-black rounded-full font-bold transition-all outline-none"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Password</label>
            <div className="relative">
              <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="password" required value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-5 pl-16 bg-gray-50 border-2 border-transparent focus:border-black rounded-full font-bold transition-all outline-none"
              />
            </div>
          </div>
          <button 
            type="submit" disabled={loading}
            className="w-full py-6 bg-black text-white rounded-full font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:scale-[1.02] transition-all shadow-2xl disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : <>Sign In <ArrowRight size={18} /></>}
          </button>
        </form>

        <p className="text-center text-[10px] font-black uppercase tracking-widest text-gray-400">
           New to Datie.? <Link href="/signup" className="text-black underline">Create Account</Link>
        </p>
      </div>
    </main>
  );
}
