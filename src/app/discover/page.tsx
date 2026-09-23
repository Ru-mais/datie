"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { animate } from "animejs";
import { 
  Heart, X, MapPin, Search, Filter, RotateCcw, 
  User, Check, Sparkles, Star, ArrowRight, 
  Grid, Layers, Flame, Briefcase, GraduationCap
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { collection, query, getDocs, limit, doc, setDoc, getDoc, serverTimestamp, where, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import VerifiedBadge from "@/components/VerifiedBadge";
import { getCachedDiscoveryDeck, setCachedDiscoveryDeck } from "@/lib/discoveryCache";
import { checkClientSwipeRateLimit } from "@/lib/rateLimit";
import { showLocalNotification } from "@/lib/notifications";

const DISTRICTS = [
  "All", "Alappuzha", "Ernakulam", "Idukki", "Kannur", "Kasaragod", 
  "Kollam", "Kottayam", "Kozhikode", "Malappuram", "Palakkad", 
  "Pathanamthitta", "Thiruvananthapuram", "Thrissur", "Wayanad"
];
const GENDERS = ["All", "Male", "Female", "Other"];

// Dynamic Compatibility Score Calculation
function calculateCompatibility(currentUserProfile: any, targetUserProfile: any): number {
  if (!currentUserProfile || !targetUserProfile) return 80;
  let score = 55;

  // 1. Same District: +20%
  if (currentUserProfile.district && targetUserProfile.district && currentUserProfile.district === targetUserProfile.district) {
    score += 20;
  }

  // 2. Looking For alignment: +15%
  if (currentUserProfile.lookingFor && targetUserProfile.lookingFor && currentUserProfile.lookingFor === targetUserProfile.lookingFor) {
    score += 15;
  }

  // 3. Shared Interests: +5% each up to +25%
  const currentInterests = currentUserProfile.interests || [];
  const targetInterests = targetUserProfile.interests || [];
  const shared = currentInterests.filter((i: string) => targetInterests.includes(i));
  score += Math.min(25, shared.length * 6);

  // 4. Opposite Gender Boost for Dating
  if (currentUserProfile.lookingFor && currentUserProfile.lookingFor.toLowerCase().includes("dating")) {
    const currentGender = currentUserProfile.gender?.toLowerCase();
    const targetGender = targetUserProfile.gender?.toLowerCase();
    if (currentGender && targetGender && currentGender !== targetGender && 
       (currentGender === "male" || currentGender === "female") && 
       (targetGender === "male" || targetGender === "female")) {
      score += 30;
    }
  }

  // Keep score between 65% and 98%
  return Math.min(98, Math.max(65, score));
}

export default function DiscoverPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  // State
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [dismissModal, setDismissModal] = useState(false);
  const [viewMode, setViewMode] = useState<"deck" | "grid">("deck");

  // Swipe Deck State
  const [deckIndex, setDeckIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [swipeHistory, setSwipeHistory] = useState<{ user: any; action: "like" | "pass" | "superlike" }[]>([]);
  const [matchingWith, setMatchingWith] = useState<any>(null);

  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

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

  const fetchUsers = useCallback(async (bypassCache = false) => {
    if (!user) return;
    setIsFetching(true);
    try {
      // Check discovery cache first if not bypassing
      if (!bypassCache) {
        const cached = await getCachedDiscoveryDeck(user.uid);
        if (cached && Array.isArray(cached) && cached.length > 0) {
          setAllUsers(cached);
          setFilteredUsers(cached);
          setDeckIndex(0);
          setIsFetching(false);
          return;
        }
      }

      // 1. Fetch blocked user IDs
      const blocksQuery = query(collection(db, "blocks"), where("blocker", "==", user.uid));
      const blocksSnap = await getDocs(blocksQuery);
      const blockedIds = blocksSnap.docs.map(doc => doc.data().blocked);

      // 2. Fetch liked user IDs
      const likesQuery = query(collection(db, "likes"), where("from", "==", user.uid));
      const likesSnap = await getDocs(likesQuery);
      const likedIds = likesSnap.docs.map(doc => doc.data().to);

      // 3. Fetch all active users
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

      // Sort by compatibility score
      fetchedUsers.sort((a, b) => calculateCompatibility(profile, b) - calculateCompatibility(profile, a));

      setAllUsers(fetchedUsers);
      setFilteredUsers(fetchedUsers);
      setDeckIndex(0);

      // Cache deck for fast subsequent navigation
      await setCachedDiscoveryDeck(user.uid, fetchedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsFetching(false);
    }
  }, [user, profile]);

  useEffect(() => {
    if (loading === false && !user) router.push("/login");
    if (loading === false && user) {
      if (!user.emailVerified) {
        router.push("/verify-email");
        return;
      }
      fetchUsers();
    }
  }, [user, loading, router, fetchUsers]);

  // Handle Like
  const handleLike = async (targetUser: any, isSuperLike = false) => {
    if (!user || !targetUser) return;

    // Rate limit check: max 60 swipes per minute
    const rateCheck = checkClientSwipeRateLimit(60, 60);
    if (!rateCheck.allowed) {
      toast.error(`Whoa, slow down! Swiping too fast. Please wait ${rateCheck.waitSeconds}s.`, { icon: "⏳" });
      setDragOffset({ x: 0, y: 0 });
      return;
    }

    // Add to undo history
    setSwipeHistory(prev => [...prev, { user: targetUser, action: isSuperLike ? "superlike" : "like" }]);
    setDeckIndex(prev => prev + 1);
    setDragOffset({ x: 0, y: 0 });

    try {
      const likeId = `${user.uid}_${targetUser.uid}`;
      await setDoc(doc(db, "likes", likeId), {
        from: user.uid,
        to: targetUser.uid,
        isSuperLike,
        timestamp: serverTimestamp()
      });

      if (isSuperLike) {
        toast.success(`⭐ Super Liked ${targetUser.name}!`, { icon: "🌟" });
      } else {
        toast.success(`Liked ${targetUser.name}!`);
      }

      // Check for mutual like
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

        // Trigger native notification if permission granted
        showLocalNotification("It's a Match! 🎉", {
          body: `You and ${targetUser.name} matched! Tap to start chatting.`,
          url: `/chat/${matchId}`
        });
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to like user");
    }
  };

  // Handle Pass
  const handlePass = (targetUser: any) => {
    if (!targetUser) return;

    // Rate limit check: max 60 swipes per minute
    const rateCheck = checkClientSwipeRateLimit(60, 60);
    if (!rateCheck.allowed) {
      toast.error(`Whoa, slow down! Please wait ${rateCheck.waitSeconds}s.`, { icon: "⏳" });
      setDragOffset({ x: 0, y: 0 });
      return;
    }

    setSwipeHistory(prev => [...prev, { user: targetUser, action: "pass" }]);
    setDeckIndex(prev => prev + 1);
    setDragOffset({ x: 0, y: 0 });
  };

  // Handle Rewind / Undo
  const handleRewind = async () => {
    if (swipeHistory.length === 0 || deckIndex === 0) {
      toast.error("No previous swipe to rewind!");
      return;
    }

    const lastSwipe = swipeHistory[swipeHistory.length - 1];
    setSwipeHistory(prev => prev.slice(0, -1));
    setDeckIndex(prev => Math.max(0, prev - 1));
    setDragOffset({ x: 0, y: 0 });

    // If it was a like, remove it from Firestore
    if (lastSwipe.action === "like" || lastSwipe.action === "superlike") {
      try {
        const likeId = `${user?.uid}_${lastSwipe.user.uid}`;
        await deleteDoc(doc(db, "likes", likeId));
      } catch (e) {
        console.warn("Could not delete rewind like doc:", e);
      }
    }

    toast.success(`Rewound back to ${lastSwipe.user.name}!`, { icon: "⏪" });
  };

  // Drag Gesture Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    if (viewMode !== "deck") return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragStartRef.current) return;
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;
    setDragOffset({ x: deltaX, y: deltaY });
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    dragStartRef.current = null;

    const currentCandidate = filteredUsers[deckIndex];
    if (!currentCandidate) {
      setDragOffset({ x: 0, y: 0 });
      return;
    }

    const threshold = 120;
    if (dragOffset.x > threshold) {
      // Swiped Right -> LIKE
      handleLike(currentCandidate);
    } else if (dragOffset.x < -threshold) {
      // Swiped Left -> PASS
      handlePass(currentCandidate);
    } else if (dragOffset.y < -threshold) {
      // Swiped Up -> SUPER LIKE
      handleLike(currentCandidate, true);
    } else {
      // Release -> Snap back
      setDragOffset({ x: 0, y: 0 });
    }
  };

  const applyFilters = () => {
    let result = [...allUsers];
    if (filters.district !== "All") result = result.filter(u => u.district === filters.district);
    if (filters.gender !== "All") result = result.filter(u => u.gender === filters.gender);
    if (filters.religion.trim() !== "") {
      result = result.filter(u => u.religion?.toLowerCase().includes(filters.religion.toLowerCase()));
    }
    result = result.filter(u => u.age >= filters.minAge && u.age <= filters.maxAge);

    setFilteredUsers(result);
    setDeckIndex(0);
    setSwipeHistory([]);
    setShowFilters(false);
    toast.success(`Found ${result.length} matches!`);
  };

  useEffect(() => {
    if (!isFetching) {
      animate('.animate-card', {
        opacity: [0, 1],
        scale: [0.95, 1],
        translateY: [20, 0],
        delay: (el: any, i: number) => i * 40,
        duration: 800,
        ease: 'outExpo'
      });
    }
  }, [isFetching, viewMode]);

  const currentCandidate = filteredUsers[deckIndex];
  const nextCandidate = filteredUsers[deckIndex + 1];

  // Dynamic Card Drag Physics
  const cardRotation = (dragOffset.x / 300) * 18;
  const likeOpacity = Math.min(1, Math.max(0, dragOffset.x / 100));
  const nopeOpacity = Math.min(1, Math.max(0, -dragOffset.x / 100));
  const superLikeOpacity = Math.min(1, Math.max(0, -dragOffset.y / 100));

  return (
    <main className="min-h-screen bg-gray-50/60 dark:bg-neutral-950 pt-32 pb-24 px-4 sm:px-6 overflow-hidden relative transition-colors duration-300">
      <div className="max-w-6xl mx-auto">

        {/* Profile Completion Warning Banner */}
        {isProfileIncomplete && (
          <div className="mb-8 p-6 bg-gradient-to-r from-black via-neutral-900 to-black dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 text-white border-2 border-black dark:border-neutral-700 rounded-[2.5rem] shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6 animate-card opacity-0">
            <div className="flex items-center gap-5 text-left">
              <div className="w-14 h-14 rounded-2xl bg-white text-black flex items-center justify-center shrink-0 shadow-lg">
                <Sparkles size={28} className="text-yellow-500" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-3 py-0.5 bg-yellow-400 text-black text-[9px] font-black uppercase tracking-widest rounded-full">Boost Matches</span>
                  <h4 className="font-black uppercase tracking-tight text-sm">Your Profile is Incomplete</h4>
                </div>
                <p className="text-gray-300 text-xs font-medium">
                  Add your photo and bio to receive compatibility recommendations!
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

        {/* Top Header & Controls */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6">
          <div className="animate-card opacity-0">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-5xl sm:text-6xl font-black tracking-tighter italic uppercase text-black dark:text-white">Discover</h1>
              <span className="px-3 py-1 bg-black dark:bg-white text-white dark:text-black text-[9px] font-black uppercase tracking-widest rounded-full flex items-center gap-1">
                <Flame size={12} className="text-orange-400 fill-orange-400" /> Live Feed
              </span>
            </div>
            <p className="text-gray-400 dark:text-neutral-500 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
              <Search size={14} /> {Math.max(0, filteredUsers.length - deckIndex)} profiles ready to explore
            </p>
          </div>

          <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-end">
            {/* View Mode Toggle */}
            <div className="bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 rounded-2xl p-1 flex shadow-md">
              <button
                onClick={() => setViewMode("deck")}
                className={`px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all ${viewMode === "deck" ? "bg-black dark:bg-white text-white dark:text-black" : "text-gray-400 dark:text-neutral-500 hover:text-black dark:hover:text-white"}`}
              >
                <Layers size={14} /> Deck
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all ${viewMode === "grid" ? "bg-black dark:bg-white text-white dark:text-black" : "text-gray-400 dark:text-neutral-500 hover:text-black dark:hover:text-white"}`}
              >
                <Grid size={14} /> Gallery
              </button>
            </div>

            {/* Filter Button */}
            <button 
              onClick={() => setShowFilters(true)}
              className="flex items-center gap-3 px-6 py-3.5 bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 text-black dark:text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all shadow-md"
            >
              <Filter size={16} /> Filters {(filters.district !== "All" || filters.gender !== "All") && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
            </button>
          </div>
        </div>

        {/* ─────────── 1. SKELETON SHIMMER LOADING ─────────── */}
        {isFetching ? (
          <div className="flex flex-col items-center justify-center py-10">
            <div className="w-full max-w-md aspect-[3/4] rounded-[3rem] border-2 border-black dark:border-neutral-700 p-6 bg-white dark:bg-neutral-900 shadow-2xl relative overflow-hidden flex flex-col justify-between">
              <div className="w-full h-2/3 rounded-[2rem] skeleton-shimmer" />
              <div className="space-y-4 pt-4">
                <div className="h-8 w-3/4 rounded-xl skeleton-shimmer" />
                <div className="h-4 w-1/2 rounded-lg skeleton-shimmer" />
                <div className="h-4 w-full rounded-lg skeleton-shimmer" />
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <div className="w-14 h-14 rounded-full skeleton-shimmer" />
              <div className="w-16 h-16 rounded-full skeleton-shimmer" />
              <div className="w-14 h-14 rounded-full skeleton-shimmer" />
              <div className="w-16 h-16 rounded-full skeleton-shimmer" />
            </div>
          </div>
        ) : filteredUsers.length === 0 || deckIndex >= filteredUsers.length ? (
          /* ─────────── NO PROFILES REMAINING ─────────── */
          <div className="text-center py-28 border-4 border-dashed border-gray-200 dark:border-neutral-800 rounded-[3rem] bg-white dark:bg-neutral-900 animate-card opacity-0 max-w-2xl mx-auto shadow-sm">
            <div className="w-24 h-24 bg-gray-50 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-6 relative">
               <User size={48} className="text-gray-300 dark:text-neutral-600" />
               <div className="absolute inset-0 rounded-full border-2 border-gray-200 dark:border-neutral-700 animate-ping opacity-30" />
            </div>
            <h2 className="text-4xl font-black tracking-tighter uppercase italic mb-3 text-black dark:text-white">You&apos;re All Caught Up!</h2>
            <p className="text-gray-400 dark:text-neutral-500 font-bold uppercase tracking-[0.2em] text-[10px] mb-8 max-w-sm mx-auto leading-loose">
              You have explored all matching profiles in your area. Rewind or adjust filters to discover more!
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {swipeHistory.length > 0 && (
                <button 
                  onClick={handleRewind}
                  className="px-8 py-4 bg-white dark:bg-neutral-800 border-2 border-black dark:border-neutral-600 text-black dark:text-white rounded-full font-black uppercase tracking-widest text-xs hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all shadow-xl flex items-center gap-2"
                >
                  <RotateCcw size={16} /> Rewind Last Swipe
                </button>
              )}
              <button 
                onClick={() => {
                  setFilters({ district: "All", gender: "All", minAge: 18, maxAge: 50, religion: "" });
                  setFilteredUsers(allUsers);
                  setDeckIndex(0);
                  setSwipeHistory([]);
                }}
                className="px-8 py-4 bg-black dark:bg-white text-white dark:text-black rounded-full font-black uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-xl"
              >
                Reset All Filters
              </button>
            </div>
          </div>
        ) : viewMode === "deck" ? (
          /* ─────────── 2. 3D FLUID GESTURE SWIPE DECK ─────────── */
          <div className="flex flex-col items-center justify-center py-4 select-none perspective-1000">
            <div className="relative w-full max-w-md aspect-[3/4.2] flex items-center justify-center">

              {/* Background Card (Preview of next profile) */}
              {nextCandidate && (
                <div className="absolute inset-0 w-full h-full bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 rounded-[3rem] overflow-hidden shadow-xl scale-[0.93] translate-y-6 opacity-60 pointer-events-none transition-all duration-300">
                  <div className="absolute inset-0 bg-gray-100 dark:bg-neutral-800">
                    {nextCandidate.photoURL ? (
                      <img src={nextCandidate.photoURL} alt={nextCandidate.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-neutral-600"><User size={96} /></div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                    <h3 className="text-3xl font-black italic uppercase">{nextCandidate.name}, {nextCandidate.age}</h3>
                    <p className="text-xs text-white/70 font-bold uppercase tracking-widest">{nextCandidate.district}</p>
                  </div>
                </div>
              )}

              {/* Active Top Card (Draggable with 3D Physics & Stamps) */}
              {currentCandidate && (
                <div
                  ref={cardRef}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  style={{
                    transform: `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0) rotate(${cardRotation}deg)`,
                    cursor: isDragging ? "grabbing" : "grab",
                    transition: isDragging ? "none" : "transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                    touchAction: "none"
                  }}
                  className="absolute inset-0 w-full h-full bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 rounded-[3rem] overflow-hidden shadow-2xl z-20 transition-shadow hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]"
                >
                  {/* Photo & Gradient Layer */}
                  <div className="absolute inset-0 bg-gray-100 dark:bg-neutral-800 pointer-events-none">
                    {currentCandidate.photoURL ? (
                      <img src={currentCandidate.photoURL} alt={currentCandidate.name} className="w-full h-full object-cover select-none" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-200 dark:text-neutral-700"><User size={120} /></div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-95" />
                  </div>

                  {/* 🌟 Dynamic Compatibility Score Badge */}
                  <div className="absolute top-6 left-6 z-30 pointer-events-none">
                    <div className="px-4 py-2 bg-black/80 backdrop-blur-md border border-white/20 rounded-full flex items-center gap-2 shadow-2xl">
                      <Sparkles size={14} className="text-yellow-400" />
                      <span className="text-xs font-black text-white tracking-tight">
                        {calculateCompatibility(profile, currentCandidate)}% Vibe Match
                      </span>
                    </div>
                  </div>

                  {/* 💚 Dynamic LIKE Stamp (Swiping Right) */}
                  <div 
                    style={{ opacity: likeOpacity }} 
                    className="absolute top-10 right-8 border-4 border-emerald-500 bg-emerald-500/20 text-emerald-400 font-black text-4xl uppercase tracking-tighter px-6 py-2 rounded-2xl rotate-12 pointer-events-none z-30 transition-opacity"
                  >
                    LIKE
                  </div>

                  {/* ❌ Dynamic NOPE Stamp (Swiping Left) */}
                  <div 
                    style={{ opacity: nopeOpacity }} 
                    className="absolute top-10 left-8 border-4 border-red-500 bg-red-500/20 text-red-500 font-black text-4xl uppercase tracking-tighter px-6 py-2 rounded-2xl -rotate-12 pointer-events-none z-30 transition-opacity"
                  >
                    NOPE
                  </div>

                  {/* ⭐ Dynamic SUPER LIKE Stamp (Swiping Up) */}
                  <div 
                    style={{ opacity: superLikeOpacity }} 
                    className="absolute bottom-32 left-1/2 -translate-x-1/2 border-4 border-blue-400 bg-blue-500/20 text-blue-300 font-black text-3xl uppercase tracking-tighter px-8 py-2 rounded-2xl pointer-events-none z-30 transition-opacity whitespace-nowrap shadow-2xl"
                  >
                    SUPER LIKE
                  </div>

                  {/* Profile Details Layer */}
                  <div className="absolute bottom-0 left-0 right-0 p-8 text-white z-20 pointer-events-none">
                    <div className="mb-3">
                      <div className="flex flex-wrap items-center gap-3 mb-1">
                        <h3 className="text-4xl font-black italic tracking-tighter uppercase">{currentCandidate.name}, {currentCandidate.age}</h3>
                        {currentCandidate.photoVerified && <VerifiedBadge size="md" />}
                        {currentCandidate.profession && (
                          <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                            <Briefcase size={10} /> {currentCandidate.profession}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs font-black text-white/80 uppercase tracking-widest">
                        <span className="flex items-center gap-1"><MapPin size={14} className="text-red-400" /> {currentCandidate.district}</span>
                        {currentCandidate.education && <span className="flex items-center gap-1"><GraduationCap size={14} /> {currentCandidate.education}</span>}
                      </div>
                    </div>

                    {/* Bio */}
                    <p className="text-sm text-white/90 font-medium mb-4 italic line-clamp-2 leading-relaxed">
                      &quot;{currentCandidate.bio || "Looking for spontaneous adventures and great conversations..."}&quot;
                    </p>

                    {/* Interests Tags */}
                    {currentCandidate.interests && currentCandidate.interests.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {currentCandidate.interests.slice(0, 4).map((tag: string) => {
                          const isShared = profile?.interests?.includes(tag);
                          return (
                            <span 
                              key={tag} 
                              className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${isShared ? "bg-yellow-400 text-black shadow-md font-bold" : "bg-white/10 text-white backdrop-blur-sm"}`}
                            >
                              {isShared && "✨ "}{tag}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ─────────── 3. ACTION BUTTONS TRAY ─────────── */}
            <div className="flex items-center justify-center gap-5 mt-8 z-30">
              {/* Rewind / Undo Button */}
              <button
                onClick={handleRewind}
                disabled={swipeHistory.length === 0}
                title="Rewind / Undo Last Swipe"
                className="w-14 h-14 rounded-full bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-neutral-800 flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all disabled:opacity-40 disabled:hover:scale-100"
              >
                <RotateCcw size={20} />
              </button>

              {/* Pass Button */}
              <button
                onClick={() => handlePass(currentCandidate)}
                title="Pass"
                className="w-16 h-16 rounded-full bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all"
              >
                <X size={28} />
              </button>

              {/* Super Like Button */}
              <button
                onClick={() => handleLike(currentCandidate, true)}
                title="Super Like"
                className="w-14 h-14 rounded-full bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 text-blue-500 hover:bg-blue-500 hover:text-white flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all"
              >
                <Star size={22} className="fill-current" />
              </button>

              {/* Like Button */}
              <button
                onClick={() => handleLike(currentCandidate)}
                title="Like"
                className="w-16 h-16 rounded-full bg-black dark:bg-white text-white dark:text-black hover:bg-emerald-500 dark:hover:bg-emerald-500 dark:hover:text-white flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all"
              >
                <Heart size={28} className="fill-current" />
              </button>
            </div>
          </div>
        ) : (
          /* ─────────── 4. CURATED GALLERY GRID VIEW ─────────── */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredUsers.slice(deckIndex).map((item) => (
              <div key={item.uid} className="animate-card opacity-0 group relative aspect-[3/4.2] bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 rounded-[2.5rem] overflow-hidden shadow-xl hover:scale-[1.02] transition-all">
                <div className="absolute inset-0 bg-gray-100 dark:bg-neutral-800">
                  {item.photoURL ? (
                    <img src={item.photoURL} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-200 dark:text-neutral-700"><User size={80} /></div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-90" />
                </div>

                <div className="absolute top-4 left-4 z-20">
                  <div className="px-3 py-1 bg-black/80 backdrop-blur-md border border-white/20 rounded-full flex items-center gap-1.5 shadow-md">
                    <Sparkles size={12} className="text-yellow-400" />
                    <span className="text-[10px] font-black text-white">{calculateCompatibility(profile, item)}% Match</span>
                  </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-6 text-white z-20">
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-2xl font-black italic tracking-tighter uppercase">{item.name}, {item.age}</h3>
                      {item.photoVerified && <VerifiedBadge size="sm" />}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-black text-white/70 uppercase tracking-widest">
                       <MapPin size={12} className="text-red-400" /> {item.district}
                    </div>
                  </div>
                  <p className="text-xs text-white/80 font-medium mb-5 line-clamp-2 italic">&quot;{item.bio || "Looking for someone special..."}&quot;</p>
                  
                  <div className="flex gap-3">
                    <button 
                      onClick={() => handleLike(item)}
                      className="flex-1 py-3.5 bg-white text-black rounded-2xl flex items-center justify-center gap-2 hover:bg-emerald-500 hover:text-white transition-all shadow-xl font-black text-xs uppercase"
                    >
                      <Heart size={16} className="fill-current text-red-500" /> Like
                    </button>
                    <button 
                      onClick={() => handlePass(item)}
                      className="p-3.5 bg-black/40 backdrop-blur-md border border-white/20 text-white rounded-2xl flex items-center justify-center hover:bg-red-500 transition-all"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* ─────────── 5. FILTERS DRAWER ─────────── */}
      {showFilters && (
        <div className="fixed inset-0 z-[100] flex justify-end animate-fade-in">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowFilters(false)} />
           <div className="relative w-full max-w-md bg-white dark:bg-neutral-900 border-l border-gray-100 dark:border-neutral-800 text-black dark:text-white h-full shadow-2xl p-10 flex flex-col animate-slide-left">
              <div className="flex justify-between items-center mb-10">
                 <h2 className="text-4xl font-black italic tracking-tighter uppercase">Filters</h2>
                 <button onClick={() => setShowFilters(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full transition-all"><X size={32} /></button>
              </div>

              <div className="flex-1 space-y-8 overflow-y-auto no-scrollbar pb-10">
                 <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-neutral-500">Looking For</label>
                    <div className="flex flex-wrap gap-2.5">
                       {GENDERS.map(g => (
                         <button key={g} onClick={() => setFilters({...filters, gender: g})} className={`px-5 py-2.5 rounded-full border-2 font-black text-[10px] uppercase tracking-widest transition-all ${filters.gender === g ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white" : "border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-neutral-300 hover:border-black dark:hover:border-white"}`}>{g}</button>
                       ))}
                    </div>
                 </div>

                 <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-neutral-500">Location (District)</label>
                    <select 
                      value={filters.district} 
                      onChange={(e) => setFilters({...filters, district: e.target.value})}
                      className="w-full p-4 border-2 border-black dark:border-neutral-700 rounded-2xl font-black uppercase text-xs appearance-none bg-white dark:bg-neutral-800 text-black dark:text-white"
                    >
                       {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                 </div>

                 <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-neutral-500">Age Range ({filters.minAge} - {filters.maxAge})</label>
                    <div className="flex items-center gap-4">
                       <input type="range" min="18" max="50" value={filters.minAge} onChange={(e) => setFilters({...filters, minAge: parseInt(e.target.value)})} className="flex-1 accent-black dark:accent-white" />
                       <input type="range" min="18" max="50" value={filters.maxAge} onChange={(e) => setFilters({...filters, maxAge: parseInt(e.target.value)})} className="flex-1 accent-black dark:accent-white" />
                    </div>
                 </div>

                 <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-neutral-500">Religion / Community</label>
                    <input type="text" placeholder="e.g. Hindu, Christian, Muslim..." value={filters.religion} onChange={(e) => setFilters({...filters, religion: e.target.value})} className="w-full p-4 border-2 border-black dark:border-neutral-700 rounded-2xl font-bold italic text-sm focus:outline-none bg-gray-50 dark:bg-neutral-800 text-black dark:text-white" />
                 </div>
              </div>

              <button onClick={applyFilters} className="w-full py-5 bg-black dark:bg-white text-white dark:text-black rounded-full font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl hover:scale-[1.02] transition-all">
                Apply Preferences <Check size={18} />
              </button>
           </div>
        </div>
      )}

      {/* ─────────── 6. IT'S A MATCH OVERLAY ─────────── */}
      {matchingWith && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl animate-fade-in">
          <div className="text-center space-y-8 max-w-lg w-full">
            <div className="space-y-2">
              <span className="px-4 py-1.5 bg-yellow-400 text-black text-[9px] font-black uppercase tracking-widest rounded-full inline-block">
                Mutual Attraction
              </span>
              <h2 className="text-7xl font-black italic tracking-tighter text-white uppercase">It&apos;s a Match!</h2>
              <p className="text-gray-400 font-bold uppercase tracking-[0.3em] text-[10px]">You and {matchingWith.name} liked each other</p>
            </div>

            <div className="flex items-center justify-center gap-8 py-8">
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

            <div className="flex flex-col gap-3">
              <button 
                onClick={() => {
                  const mId = [user?.uid, matchingWith.uid].sort().join("_");
                  router.push(`/chat/${mId}`);
                }} 
                className="w-full py-5 bg-white text-black rounded-full font-black uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-2xl flex items-center justify-center gap-2"
              >
                Send First Message <ArrowRight size={16} />
              </button>
              <button onClick={() => setMatchingWith(null)} className="w-full py-4 text-white/50 hover:text-white font-black uppercase tracking-widest text-[10px] transition-all">
                Keep Swiping
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────── 7. FIRST-LOGIN PROFILE SETUP MODAL ─────────── */}
      {isProfileIncomplete && !dismissModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="max-w-md w-full bg-white dark:bg-neutral-900 rounded-[3rem] p-10 shadow-2xl border-2 border-black dark:border-neutral-700 text-center space-y-6 text-black dark:text-white">
            <div className="w-20 h-20 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center mx-auto shadow-2xl">
              <Sparkles size={36} className="text-yellow-400 animate-pulse" />
            </div>

            <div className="space-y-2">
              <span className="px-4 py-1.5 bg-yellow-400 text-black text-[9px] font-black uppercase tracking-widest rounded-full inline-block">
                Welcome to Datie
              </span>
              <h3 className="text-3xl font-black italic tracking-tighter uppercase">Fill Out Your Profile!</h3>
              <p className="text-gray-500 dark:text-neutral-400 text-xs font-medium leading-relaxed">
                Profiles with photos and bios receive <strong className="text-black dark:text-white font-bold">5x more matches</strong>. Complete yours now to unlock full discovery!
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-neutral-800/80 rounded-2xl p-4 space-y-3 text-left">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-2">📸 Profile Photo</span>
                {profile?.photoURL ? (
                  <span className="text-green-600 dark:text-green-400 font-black flex items-center gap-1 text-[10px] uppercase">Done <Check size={12} /></span>
                ) : (
                  <span className="text-red-500 font-black text-[10px] uppercase">Missing</span>
                )}
              </div>
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-2">✍️ About You (Bio)</span>
                {profile?.bio ? (
                  <span className="text-green-600 dark:text-green-400 font-black flex items-center gap-1 text-[10px] uppercase">Done <Check size={12} /></span>
                ) : (
                  <span className="text-red-500 font-black text-[10px] uppercase">Missing</span>
                )}
              </div>
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-2">🎨 Interests & Vibe</span>
                {profile?.interests && profile.interests.length > 0 ? (
                  <span className="text-green-600 dark:text-green-400 font-black flex items-center gap-1 text-[10px] uppercase">Done <Check size={12} /></span>
                ) : (
                  <span className="text-red-500 font-black text-[10px] uppercase">Missing</span>
                )}
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={() => router.push("/profile")}
                className="w-full py-5 bg-black dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 rounded-full font-black uppercase tracking-widest text-xs transition-all shadow-xl flex items-center justify-center gap-2 hover:scale-[1.02]"
              >
                Complete Profile Now <ArrowRight size={16} />
              </button>
              <button
                onClick={() => setDismissModal(true)}
                className="text-gray-400 dark:text-neutral-500 hover:text-black dark:hover:text-white font-black uppercase tracking-widest text-[10px] transition-all py-1"
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
