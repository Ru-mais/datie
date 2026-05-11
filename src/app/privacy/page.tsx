"use client";

import { ArrowLeft, Shield, Lock, Eye, Phone, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { animate } from "animejs";

export default function PrivacyPage() {
  const router = useRouter();

  useEffect(() => {
    animate('.animate-content', {
      opacity: [0, 1],
      translateY: [20, 0],
      delay: (el: any, i: number) => i * 100,
      duration: 800,
      ease: 'outExpo'
    });
  }, []);

  return (
    <main className="min-h-screen bg-white pt-32 pb-20 px-6 overflow-hidden">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => router.back()} className="mb-12 flex items-center gap-2 font-black uppercase text-[10px] tracking-widest hover:translate-x-[-4px] transition-all">
          <ArrowLeft size={16} /> Back
        </button>

        <h1 className="text-6xl font-black italic tracking-tighter uppercase mb-6 animate-content opacity-0">Privacy & Terms.</h1>
        <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.4em] mb-20 animate-content opacity-0">Last Updated: May 2026</p>

        <div className="space-y-16 animate-content opacity-0">
          
          <Section 
            icon={<Shield className="text-blue-500" />}
            title="Our Commitment"
            text="Datie. is built on a foundation of trust. We never sell your data, and we only collect information that is strictly necessary to help you find meaningful connections."
          />

          <Section 
            icon={<Phone className="text-green-500" />}
            title="Identity Verification"
            text="We use Phone-First verification to ensure every user on the platform is a real person. Your phone number is encrypted and never shared with other users unless you explicitly choose to share it in a private match."
          />

          <Section 
            icon={<Lock className="text-black" />}
            title="Data Security"
            text="Your chat history and profile data are protected by industry-standard encryption and Firestore Security Rules. We use AI moderation to ensure the environment remains safe and professional."
          />

          <Section 
            icon={<Trash2 className="text-red-500" />}
            title="Your Control"
            text="You have the right to delete your profile and all associated data at any time. When you delete your account, your photos, messages, and matches are permanently removed from our active servers."
          />

          <div className="pt-20 border-t border-gray-100">
             <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-4">Terms of Service</h2>
             <p className="text-gray-500 leading-relaxed font-medium">
                By using Datie., you agree to treat all community members with respect. We have a zero-tolerance policy for harassment, scamming, or inappropriate content. Violation of these terms will result in an immediate and permanent ban.
             </p>
          </div>

          <div className="text-center pt-20">
             <span className="font-black italic text-2xl uppercase opacity-20">Datie.</span>
          </div>
        </div>
      </div>
    </main>
  );
}

function Section({ icon, title, text }: { icon: any, title: string, text: string }) {
  return (
    <div className="flex gap-8 group">
       <div className="w-16 h-16 rounded-[1.5rem] bg-gray-50 flex items-center justify-center shrink-0 group-hover:scale-110 transition-all shadow-sm">
          {icon}
       </div>
       <div>
          <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-2">{title}</h3>
          <p className="text-gray-500 leading-relaxed font-medium">{text}</p>
       </div>
    </div>
  );
}
