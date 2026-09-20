"use client";

import { useEffect, useState } from "react";
import { animate } from "animejs";
import { Heart, X, MapPin, Search, Filter, Loader2, User, Check, Sparkles, Camera, ArrowRight, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { collection, query, getDocs, limit, doc, setDoc, getDoc, serverTimestamp, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const DISTRICTS = ["All", "Alappuzha", "Ernakulam", "Idukki", "Kannur", "Kasaragod", "Kollam", "Kottayam", "Kozhikode", "Malappuram", "Palakkad", "Pathanamthitta", "Thiruvananthapuram", "Thrissur", "Wayanad"];
const GENDERS = ["All", "Male", "Female", "Other"];

export default function DiscoverPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [dismissModal, setDismissModal] = useState(false);

  // Profile completion check
  const isProfileIncomplete = Boolean(
    profile && (!profile.photoURL || !profile.bio || !profile.interests || profile.interests.length === 0)
  );

  // Filter States
  const [filters, setFilters] = useState({
    district: "All",
    gender: "All",
    minAge: 18,
    maxAge: 50,
    religion: ""
  });
  const [matchingWith, setMatchingWith] = useState<any>(null);

  const handleLike = async (targetUser: any) => {
    if (!user) return;
    try {
      const likeId = `${user.uid}_${targetUser.uid}`;
      await setDoc(doc(db, "likes", likeId), {
        from: user.uid,
        to: targetUser.uid,
        timestamp: serverTimestamp()
      });

      toast.success(`You liked ${targetUser.name}!`);

      const reverseLikeId = `${targetUser.uid}_${user.uid}`;
      const reverseLikeSnap = await getDoc(doc(db, "likes", reverseLikeId));

      if (reverseLikeSnap.exists()) {
        setMatchingWith(targetUser);
        const matchId = [user.uid, targetUser.uid].sort().join("_");
        await setDoc(doc(db, "matches", matchId), {
          users: [user.uid, targetUser.uid],
          timestamp: serverTimestamp(),
          lastMessage: "You matched! Say hello."
        });
      }

      setFilteredUsers(filteredUsers.filter(u => u.uid !== targetUser.uid));
    } catch (err) {
      console.error(err);
      toast.error("Failed to like user");
    }
  };

  const handlePass = (targetUid: string) => {
    setFilteredUsers(filteredUsers.filter(u => u.uid !== targetUid));
  };

  useEffect(() => {
    if (loading === false && !user) router.push("/login");

    const fetchUsers = async () => {
      if (!user) return;
      try {
        // 1. Fetch blocked user IDs
        const blocksRef = collection(db, "blocks");
        const blocksQuery = query(blocksRef, where("blocker", "==", user.uid));
        const blocksSnap = await getDocs(blocksQuery);
        const blockedIds = blocksSnap.docs.map(doc => doc.data().blocked);

        // 2. Fetch liked user IDs
        const likesRef = collection(db, "likes");
        const likesQuery = query(likesRef, where("from", "==", user.uid));
        const likesSnap = await getDocs(likesQuery);
        const likedIds = likesSnap.docs.map(doc => doc.data().to);

        // 3. Fetch all users
        const usersRef = collection(db, "users");
        const q = query(usersRef, limit(100));
        const querySnapshot = await getDocs(q);
        const fetchedUsers = querySnapshot.docs
          .map(doc => ({ ...doc.data(), uid: doc.id }))
          .filter((u: any) => 
            u.uid !== user.uid && 
            u.name && 
            !blockedIds.includes(u.uid) && 
            !likedIds.includes(u.uid)
          ); 
        
        setAllUsers(fetchedUsers);
        setFilteredUsers(fetchedUsers);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setIsFetching(false);
      }
    };

    if (loading === false && user) fetchUsers();
  }, [user, loading, router]);

  const applyFilters = () => {
    let result = [...allUsers];
    if (filters.district !== "All") result = result.filter(u => u.district === filters.district);
    if (filters.gender !== "All") result = result.filter(u => u.gender === filters.gender);
    if (filters.religion.trim() !== "") {
      result = result.filter(u => u.religion?.toLowerCase().includes(filters.religion.toLowerCase()));
    }
    result = result.filter(u => u.age >= filters.minAge && u.age <= filters.maxAge);

    setFilteredUsers(result);
    setShowFilters(false);
    toast.success(`Found ${result.length} matches!`);
  };

  useEffect(() => {
    if (!isFetching) {
      animate('.animate-card', {
        opacity: [0, 1],
        scale: [0.9, 1],
        translateY: [20, 0],
        delay: (el: any, i: number) => i * 50,
        duration: 800,
        ease: 'outExpo'
      });
    }
  }, [isFetching, filteredUsers]);

  if (loading || isFetching) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <Loader2 className="animate-spin text-black mb-4" size={40} />
      <span className="font-black uppercase tracking-widest text-[10px]">Datii. matches incoming...</span>
    </div>
  );

  return (
    <main className="min-h-screen bg-gray-50/50 pt-32 pb-20 px-6 overflow-hidden relative">
      <div className="max-w-7xl mx-auto">

        {/* Profile Completion Alert Banner */}
        {isProfileIncomplete && (
          <div className="mb-8 p-6 bg-gradient-to-r from-black to-neutral-900 text-white border-2 border-black rounded-[2rem] shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6 animate-card opacity-0">
            <div className="flex items-center gap-5 text-left">
              <div className="w-14 h-14 rounded-2xl bg-white text-black flex items-center justify-center shrink-0 shadow-lg">
                <Sparkles size={28} className="text-black" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-3 py-0.5 bg-yellow-400 text-black text-[9px] font-black uppercase tracking-widest rounded-full">Action Required</span>
                  <h4 className="font-black uppercase tracking-tight text-sm">Your Profile is Incomplete</h4>
                </div>
                <p className="text-gray-300 text-xs font-medium">
                  Add your photo, bio, and interests to get discovered and receive match requests!
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push("/profile")}
              className="px-8 py-4 bg-white text-black hover:bg-yellow-400 font-black uppercase tracking-widest text-xs rounded-full hover:scale-105 transition-all shadow-xl shrink-0 flex items-center gap-2"
            >
              Complete Profile <ArrowRight size={16} />
            </button>
          </div>
        )}

        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div className="animate-card opacity-0">
            <h1 className="text-6xl font-black tracking-tighter italic uppercase mb-2">Discover</h1>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
              <Search size={14} /> {filteredUsers.length} people match your vibe
            </p>
          </div>
          <button 
            onClick={() => setShowFilters(true)}
            className="flex items-center gap-3 px-8 py-4 bg-white border-2 border-black rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black hover:text-white transition-all shadow-xl animate-card opacity-0"
          >
            <Filter size={18} /> Filters {(filters.district !== "All" || filters.gender !== "All") && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
          </button>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="text-center py-40 border-4 border-dashed border-gray-100 rounded-[3rem] bg-white animate-card opacity-0">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8 relative">
               <User size={48} className="text-gray-200" />
               <div className="absolute inset-0 rounded-full border-2 border-gray-100 animate-ping opacity-20" />
            </div>
            
            {allUsers.length === 0 ? (
              <>
                <h2 className="text-4xl font-black tracking-tighter uppercase italic mb-4">You&apos;re our First Member!</h2>
                <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-[10px] mb-10 max-w-xs mx-auto leading-loose">
                  Welcome to Datie. There aren&apos;t any other profiles yet. Why not invite some friends to start the connection?
                </p>
                <button 
                  onClick={() => router.push("/profile")}
                  className="px-12 py-5 border-2 border-black rounded-full font-black uppercase tracking-widest text-xs hover:bg-black hover:text-white transition-all shadow-xl"
                >
                  Complete Your Profile
                </button>
              </>
            ) : (
              <>
                <h2 className="text-4xl font-black tracking-tighter uppercase italic mb-4">No Profiles Found</h2>
                <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-[10px] mb-10 max-w-xs mx-auto leading-loose">
                  We couldn&apos;t find anyone matching your current filters. Try expanding your search range or changing your preferences!
                </p>
                <button 
                  onClick={() => {
                    setFilters({ district: "All", gender: "All", minAge: 18, maxAge: 50, religion: "" });
                    setFilteredUsers(allUsers);
                  }}
                  className="px-12 py-5 bg-black text-white rounded-full font-black uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-xl"
                >
                  Clear All Filters
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredUsers.map((item) => (
              <div key={item.uid} className="animate-card opacity-0 group relative aspect-[3/4] bg-white border-2 border-black rounded-[2.5rem] overflow-hidden shadow-xl hover:scale-[1.02] transition-all">
                <div className="absolute inset-0 bg-gray-100">
                  {item.photoURL ? (
                    <img src={item.photoURL} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-200"><User size={80} /></div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80" />
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                  <div className="mb-4">
                    <h3 className="text-3xl font-black tracking-tighter italic uppercase mb-1">{item.name}, {item.age}</h3>
                    <div className="flex items-center gap-2 text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">
                       <MapPin size={12} /> {item.district}
                    </div>
                  </div>
                  <p className="text-xs text-white/80 font-medium mb-6 line-clamp-2 italic">&quot;{item.bio || "Searching for a story..."}&quot;</p>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => handleLike(item)}
                      className="flex-1 py-4 bg-white text-black rounded-2xl flex items-center justify-center gap-2 hover:bg-green-500 hover:text-white transition-all shadow-xl"
                    >
                      <Heart size={20} className="fill-current" />
                    </button>
                    <button 
                      onClick={() => handlePass(item.uid)}
                      className="flex-1 py-4 bg-black/20 backdrop-blur-md border border-white/20 text-white rounded-2xl flex items-center justify-center hover:bg-red-500 transition-all"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showFilters && (
        <div className="fixed inset-0 z-[100] flex justify-end animate-fade-in">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowFilters(false)} />
           <div className="relative w-full max-w-md bg-white h-full shadow-2xl p-10 flex flex-col animate-slide-left">
              <div className="flex justify-between items-center mb-12">
                 <h2 className="text-4xl font-black italic tracking-tighter uppercase">Filters</h2>
                 <button onClick={() => setShowFilters(false)} className="p-2 hover:bg-gray-100 rounded-full transition-all"><X size={32} /></button>
              </div>

              <div className="flex-1 space-y-10 overflow-y-auto no-scrollbar pb-10">
                 <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Looking For</label>
                    <div className="flex flex-wrap gap-3">
                       {GENDERS.map(g => (
                         <button key={g} onClick={() => setFilters({...filters, gender: g})} className={`px-6 py-3 rounded-full border-2 font-black text-[10px] uppercase tracking-widest transition-all ${filters.gender === g ? "bg-black text-white border-black" : "border-gray-100 hover:border-black"}`}>{g}</button>
                       ))}
                    </div>
                 </div>
                 <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Location (District)</label>
                    <select 
                      value={filters.district} 
                      onChange={(e) => setFilters({...filters, district: e.target.value})}
                      className="w-full p-5 border-2 border-black rounded-2xl font-black uppercase text-xs appearance-none bg-white"
                    >
                       {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                 </div>
                 <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Age Range ({filters.minAge} - {filters.maxAge})</label>
                    <div className="flex items-center gap-4">
                       <input type="range" min="18" max="50" value={filters.minAge} onChange={(e) => setFilters({...filters, minAge: parseInt(e.target.value)})} className="flex-1 accent-black" />
                       <input type="range" min="18" max="50" value={filters.maxAge} onChange={(e) => setFilters({...filters, maxAge: parseInt(e.target.value)})} className="flex-1 accent-black" />
                    </div>
                 </div>
                 <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Religion / Caste</label>
                    <input type="text" placeholder="e.g. Hindu, Christian, Muslim..." value={filters.religion} onChange={(e) => setFilters({...filters, religion: e.target.value})} className="w-full p-5 border-2 border-black rounded-2xl font-bold italic text-sm focus:outline-none bg-gray-50" />
                 </div>
              </div>

              <button onClick={applyFilters} className="w-full py-6 bg-black text-white rounded-full font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl hover:scale-[1.02] transition-all">
                Apply Preferences <Check size={20} />
              </button>
           </div>
        </div>
      )}

      {/* It's a Match Overlay */}
      {matchingWith && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl">
          <div className="text-center space-y-8 max-w-lg w-full">
            <h2 className="text-7xl font-black italic tracking-tighter text-white uppercase mb-4">It&apos;s a Match!</h2>
            <p className="text-gray-400 font-bold uppercase tracking-[0.3em] text-[10px]">You and {matchingWith.name} like each other</p>
            <div className="flex items-center justify-center gap-8 py-12">
              <div className="w-32 h-32 rounded-full border-4 border-white overflow-hidden shadow-2xl rotate-[-5deg]">
                 <img src={profile?.photoURL || ""} alt="You" className="w-full h-full object-cover" />
              </div>
              <div className="relative">
                 <Heart size={48} className="text-red-500 fill-red-500 animate-pulse" />
              </div>
              <div className="w-32 h-32 rounded-full border-4 border-white overflow-hidden shadow-2xl rotate-[5deg]">
                 <img src={matchingWith.photoURL || ""} alt={matchingWith.name} className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <button onClick={() => setMatchingWith(null)} className="w-full py-5 bg-white text-black rounded-full font-black uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-2xl">
                Keep Discovering
              </button>
              <button onClick={() => router.push("/matches")} className="text-white/40 font-black uppercase tracking-widest text-[10px] hover:text-white transition-all py-2">
                View All Matches
              </button>
            </div>
          </div>
        </div>
      )}

      {/* First-Login Incomplete Profile Prompt Modal */}
      {isProfileIncomplete && !dismissModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="max-w-md w-full bg-white rounded-[3rem] p-10 shadow-2xl border-2 border-black text-center space-y-6 animate-scale-up">
            <div className="w-20 h-20 rounded-full bg-black text-white flex items-center justify-center mx-auto shadow-2xl">
              <Sparkles size={36} className="text-yellow-400 animate-pulse" />
            </div>

            <div className="space-y-2">
              <span className="px-4 py-1.5 bg-yellow-400 text-black text-[9px] font-black uppercase tracking-widest rounded-full inline-block">
                Welcome to Datie
              </span>
              <h3 className="text-3xl font-black italic tracking-tighter uppercase">Fill Out Your Profile!</h3>
              <p className="text-gray-500 text-xs font-medium leading-relaxed">
                Profiles with photos and bios receive <strong className="text-black font-bold">5x more matches</strong>. Complete yours now to unlock full discovery!
              </p>
            </div>

            {/* Checklist */}
            <div className="bg-gray-50 rounded-2xl p-4 space-y-3 text-left">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-2">📸 Profile Photo</span>
                {profile?.photoURL ? (
                  <span className="text-green-600 font-black flex items-center gap-1 text-[10px] uppercase">Done <Check size={12} /></span>
                ) : (
                  <span className="text-red-500 font-black text-[10px] uppercase">Missing</span>
                )}
              </div>
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-2">✍️ About You (Bio)</span>
                {profile?.bio ? (
                  <span className="text-green-600 font-black flex items-center gap-1 text-[10px] uppercase">Done <Check size={12} /></span>
                ) : (
                  <span className="text-red-500 font-black text-[10px] uppercase">Missing</span>
                )}
              </div>
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-2">🎨 Interests & Vibe</span>
                {profile?.interests && profile.interests.length > 0 ? (
                  <span className="text-green-600 font-black flex items-center gap-1 text-[10px] uppercase">Done <Check size={12} /></span>
                ) : (
                  <span className="text-red-500 font-black text-[10px] uppercase">Missing</span>
                )}
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={() => router.push("/profile")}
                className="w-full py-5 bg-black text-white hover:bg-neutral-800 rounded-full font-black uppercase tracking-widest text-xs transition-all shadow-xl flex items-center justify-center gap-2 hover:scale-[1.02]"
              >
                Complete Profile Now <ArrowRight size={16} />
              </button>
              <button
                onClick={() => setDismissModal(true)}
                className="text-gray-400 hover:text-black font-black uppercase tracking-widest text-[10px] transition-all py-1"
              >
                Explore First, I&apos;ll Fill Later
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
