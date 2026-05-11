"use client";

import { useEffect, useState } from "react";
import { animate } from "animejs";
import { Send, ArrowLeft, User, ShieldAlert, Flag, MoreVertical, MapPin, Heart, Calendar, Briefcase, GraduationCap, Ruler, HeartHandshake, Languages } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { doc, getDoc, setDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter, useParams } from "next/navigation";
import toast from "react-hot-toast";

export default function PublicProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const targetUid = params.uid as string;
  
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const snap = await getDoc(doc(db, "users", targetUid));
        if (snap.exists()) {
          setProfile(snap.data());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (targetUid) fetchProfile();
  }, [targetUid]);

  const handleBlockUser = async () => {
    if (!confirm(`Block ${profile?.name}? This will end the match permanently.`)) return;
    try {
      const blockId = `${user?.uid}_${profile?.uid}`;
      await setDoc(doc(db, "blocks", blockId), {
        blocker: user?.uid,
        blocked: profile?.uid,
        timestamp: serverTimestamp()
      });
      toast.success("User blocked");
      router.push("/discover");
    } catch (err) {
      toast.error("Failed to block");
    }
  };

  const handleReportUser = async () => {
    const reason = prompt("Why are you reporting this user? (e.g., Harassment, Fake Profile, Inappropriate Content)");
    if (!reason) return;

    try {
      await addDoc(collection(db, "reports"), {
        reporterId: user?.uid,
        reportedId: profile?.uid,
        reason,
        timestamp: serverTimestamp(),
        status: "pending"
      });
      toast.success("Thank you. We have received your report and will investigate.");
      handleBlockUser(); // Auto-block for safety
    } catch (err) {
      toast.error("Failed to submit report");
    }
  };

  useEffect(() => {
    if (!loading && profile) {
      animate('.animate-profile', {
        opacity: [0, 1],
        translateY: [20, 0],
        delay: (el: any, i: number) => i * 100,
        duration: 800,
        ease: 'outExpo'
      });
    }
  }, [loading, profile]);

  if (loading || authLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-white font-black italic text-3xl">Datii.</div>
  );

  if (!profile) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <h1 className="text-2xl font-black uppercase italic mb-4">Profile Not Found</h1>
      <button onClick={() => router.back()} className="px-8 py-4 bg-black text-white rounded-full font-black uppercase text-xs">Go Back</button>
    </div>
  );

  return (
    <main className="min-h-screen bg-white pt-32 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Back Button */}
        <div className="flex items-center justify-between mb-10 animate-profile opacity-0">
          <button onClick={() => router.back()} className="p-3 bg-gray-50 rounded-full hover:bg-black hover:text-white transition-all shadow-sm">
            <ArrowLeft size={24} />
          </button>
          <div className="flex gap-2">
            <button 
              onClick={handleReportUser}
              className="p-3 bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-2xl flex items-center gap-2 font-black text-[10px] uppercase tracking-widest transition-all"
            >
               <Flag size={18} /> Report
            </button>
            <button 
              onClick={handleBlockUser}
              className="p-3 bg-red-500 text-white hover:bg-red-600 rounded-2xl flex items-center gap-2 font-black text-[10px] uppercase tracking-widest transition-all shadow-lg"
            >
               <ShieldAlert size={18} /> Block
            </button>
          </div>
        </div>

        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-center gap-12 mb-16 animate-profile opacity-0">
          <div className="w-48 h-48 rounded-full border-4 border-black overflow-hidden shadow-2xl relative shrink-0">
             {profile.photoURL ? (
               <img src={profile.photoURL} className="w-full h-full object-cover" />
             ) : (
               <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-200"><User size={64} /></div>
             )}
          </div>
          
          <div className="text-center md:text-left flex-1">
            <h1 className="text-6xl font-black tracking-tighter mb-4 uppercase italic leading-tight">{profile.name}, {profile.age}</h1>
            <div className="flex flex-wrap justify-center md:justify-start gap-6 text-gray-400 font-bold uppercase tracking-widest text-[10px]">
              <span className="flex items-center gap-2 text-black border-r pr-6 border-gray-100"><MapPin size={14} /> {profile.district}</span>
              <span className="flex items-center gap-2 text-black border-r pr-6 border-gray-100"><Heart size={14} className="fill-black" /> {profile.lookingFor}</span>
              <span className="flex items-center gap-2 text-blue-500"><Calendar size={14} /> Active on Datii.</span>
            </div>
          </div>
        </div>

        {/* Story Section */}
        <div className="animate-profile opacity-0 p-10 border-2 border-black rounded-[3rem] shadow-xl space-y-12 mb-12">
           <div>
              <h2 className="text-3xl font-black italic tracking-tighter mb-6 uppercase">About {profile.name}</h2>
              <p className="text-2xl text-gray-600 leading-relaxed font-medium italic">"{profile.bio || "This star hasn't written their story yet..."}"</p>
           </div>

           <div className="grid grid-cols-2 md:grid-cols-3 gap-8 pt-6 border-t border-gray-100">
              <InfoBadge icon={<Briefcase size={16}/>} label="Work" value={profile.profession} />
              <InfoBadge icon={<GraduationCap size={16}/>} label="Education" value={profile.education} />
              <InfoBadge icon={<HeartHandshake size={16}/>} label="Religion" value={profile.religion} />
              <InfoBadge icon={<Ruler size={16}/>} label="Height" value={profile.height} />
              <InfoBadge icon={<Languages size={16}/>} label="Gender" value={profile.gender} />
           </div>

           {/* Interests */}
           {profile.interests && profile.interests.length > 0 && (
             <div className="pt-10 border-t border-gray-100">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-6">Their Vibes</h3>
                <div className="flex flex-wrap gap-3">
                   {profile.interests.map((i: string) => (
                     <span key={i} className="px-6 py-3 bg-gray-50 border-2 border-black/5 rounded-full text-[10px] font-black uppercase tracking-widest">
                       {i}
                     </span>
                   ))}
                </div>
             </div>
           )}
        </div>

      </div>
    </main>
  );
}

function InfoBadge({ icon, label, value }: { icon: any; label: string; value: any }) {
  if (!value) return null;
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-gray-400 text-[9px] font-black uppercase tracking-widest">{icon} {label}</div>
      <div className="font-black text-sm">{value}</div>
    </div>
  );
}
