"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Mail, ArrowRight, Loader2, RefreshCcw } from "lucide-react";
import { auth } from "@/lib/firebase";

export default function VerifyEmailPage() {
  const router = useRouter();
  const { user, resendVerificationEmail, loading } = useAuth();
  const [isResending, setIsResending] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (user?.emailVerified) {
      router.push("/discover");
    }
  }, [user, loading, router]);

  const handleResend = async () => {
    setIsResending(true);
    await resendVerificationEmail();
    setIsResending(false);
  };

  const handleCheckVerification = async () => {
    setIsChecking(true);
    if (auth.currentUser) {
      await auth.currentUser.reload();
      if (auth.currentUser.emailVerified) {
        // We can force a reload of the app or push to discover
        window.location.href = "/discover";
      } else {
        setIsChecking(false);
      }
    } else {
      setIsChecking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black font-black italic text-3xl text-black dark:text-white animate-pulse">
        Datie.
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white dark:bg-black text-black dark:text-white flex items-center justify-center p-6 transition-colors duration-300">
      <div className="max-w-md w-full space-y-12 animate-fade-in text-center">
        <div className="space-y-4">
           <div className="w-20 h-20 bg-black dark:bg-neutral-900 border border-transparent dark:border-neutral-700 rounded-3xl flex items-center justify-center mx-auto shadow-2xl">
              <Mail size={40} className="text-white" />
           </div>
           <h1 className="text-5xl font-black italic tracking-tighter uppercase text-black dark:text-white mt-6">Verify Email</h1>
           <p className="text-gray-400 dark:text-neutral-500 font-bold uppercase text-[10px] tracking-widest leading-loose">
             We&apos;ve sent a verification link to <br/>
             <span className="text-black dark:text-white">{user?.email}</span>
           </p>
        </div>

        <div className="space-y-4">
          <p className="text-sm font-medium text-gray-500 dark:text-neutral-400 px-4">
            Please check your inbox and click the link to verify your account. You won&apos;t be able to access Datie until your email is verified.
          </p>

          <div className="pt-6 space-y-4">
            <button 
              onClick={handleCheckVerification} disabled={isChecking}
              className="w-full py-5 bg-black dark:bg-white text-white dark:text-black rounded-full font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:scale-[1.02] transition-all shadow-2xl disabled:opacity-50"
            >
              {isChecking ? <Loader2 className="animate-spin" size={18} /> : <>I&apos;ve Verified My Email <ArrowRight size={18} /></>}
            </button>
            
            <button 
              onClick={handleResend} disabled={isResending}
              className="w-full py-5 bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 text-black dark:text-white rounded-full font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:scale-[1.02] transition-all shadow-md disabled:opacity-50"
            >
              {isResending ? <Loader2 className="animate-spin" size={18} /> : <>Resend Link <RefreshCcw size={16} /></>}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
