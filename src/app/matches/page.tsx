"use client";

import { useEffect, useState } from "react";
import { animate } from "animejs";
import { Heart, MessageCircle, User, Loader2, Calendar, ArrowRight, X, Check } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { collection, query, where, getDocs, doc, getDoc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function MatchesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"matches" | "likedMe">("matches");
  const [matches, setMatches] = useState<any[]>([]);
  const [likedMe, setLikedMe] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    if (loading === false && !user) router.push("/login");

    const fetchData = async () => {
      if (!user) return;
      try {
        // 1. Fetch Matches
        const matchesRef = collection(db, "matches");
        const mq = query(matchesRef, where("users", "array-contains", user.uid));
        const matchSnap = await getDocs(mq);
        const matchData = await Promise.all(matchSnap.docs.map(async (d) => {
          const data = d.data();
          const otherId = data.users.find((id: string) => id !== user.uid);
          const uSnap = await getDoc(doc(db, "users", otherId));
          return { id: d.id, otherUser: { ...uSnap.data(), uid: otherId }, ...data };
        }));
        setMatches(matchData);

        // 2. Fetch people who liked me but are not matches yet
        const likesRef = collection(db, "likes");
        const lq = query(likesRef, where("to", "==", user.uid));
        const likeSnap = await getDocs(lq);

        // Filter out those who are already matched
        const matchedIds = matchData.map(m => m.otherUser.uid);
        const admirerData = await Promise.all(likeSnap.docs
          .map(d => d.data().from)
          .filter(id => !matchedIds.includes(id))
          .map(async (id) => {
            const uSnap = await getDoc(doc(db, "users", id));
            return { uid: id, ...uSnap.data() };
          })
        );
        setLikedMe(admirerData);

      } catch (error) {
        console.error(error);
      } finally {
        setIsFetching(false);
      }
    };

    if (loading === false && user) fetchData();
  }, [user, loading, router]);

  useEffect(() => {
    animate('.animate-match-card', {
      opacity: [0, 1],
      translateY: [20, 0],
      delay: (el: any, i: number) => i * 100,
      duration: 800,
      ease: 'outExpo'
    });
  }, [activeTab, isFetching]);

  const handleLikeBack = async (admirerUid: string) => {
    if (!user) return;
    try {
      const matchId = [user.uid, admirerUid].sort().join("_");
      // Create match
      await setDoc(doc(db, "matches", matchId), {
        users: [user.uid, admirerUid],
        timestamp: serverTimestamp(),
        lastMessage: "It's a Match! Start the magic..."
      });
      // Delete the 'Like' record so they leave Star Gazers
      const likesRef = collection(db, "likes");
      const q = query(likesRef, where("from", "==", admirerUid), where("to", "==", user.uid));
      const snap = await getDocs(q);
      await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));

      toast.success("It's a Match!");
      router.push(`/chat/${matchId}`);
    } catch (err) {
      toast.error("Failed to match");
    }
  };

  const handleReject = async (admirerUid: string) => {
    if (!user) return;
    if (!confirm("Remove this admirer?")) return;
    try {
      // Find and delete the like from them to me
      const likesRef = collection(db, "likes");
      const q = query(likesRef, where("from", "==", admirerUid), where("to", "==", user.uid));
      const snap = await getDocs(q);
      await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));

      setLikedMe(prev => prev.filter(u => u.uid !== admirerUid));
      toast.success("Admirer removed");
    } catch (err) {
      toast.error("Failed to remove");
    }
  };

  if (loading || isFetching) return (
    <div className="min-h-screen flex items-center justify-center bg-white font-black italic text-3xl text-black">Datie.</div>
  );

  return (
    <main className="min-h-screen bg-white pt-32 pb-20 px-6">
      <div className="max-w-4xl mx-auto">

        {/* Header & Tabs */}
        <div className="mb-12">
          <h1 className="text-6xl font-black tracking-tighter italic uppercase mb-8">Connections</h1>
          <div className="flex gap-8 border-b-2 border-gray-100">
            <button
              onClick={() => setActiveTab("matches")}
              className={`pb-4 px-2 font-black uppercase text-[10px] tracking-widest transition-all relative ${activeTab === "matches" ? "text-black" : "text-gray-300"}`}
            >
              Matches ({matches.length})
              {activeTab === "matches" && <div className="absolute bottom-[-2px] left-0 right-0 h-1 bg-black" />}
            </button>
            <button
              onClick={() => setActiveTab("likedMe")}
              className={`pb-4 px-2 font-black uppercase text-[10px] tracking-widest transition-all relative ${activeTab === "likedMe" ? "text-black" : "text-gray-300"}`}
            >
              Star Gazers ({likedMe.length})
              {activeTab === "likedMe" && <div className="absolute bottom-[-2px] left-0 right-0 h-1 bg-black" />}
            </button>
          </div>
        </div>

        {activeTab === "matches" ? (
          <div className="space-y-4">
            {matches.length === 0 ? (
              <EmptyState title="No Matches Yet" desc="Start swiping to find your spark." onAction={() => router.push("/discover")} />
            ) : (
              matches.map((m) => (
                <div key={m.id} onClick={() => router.push(`/chat/${m.id}`)} className="animate-match-card opacity-0 p-6 border-2 border-black rounded-[2.5rem] flex items-center justify-between hover:bg-gray-50 transition-all cursor-pointer group shadow-sm">
                  <div className="flex items-center gap-6">
                    <Avatar url={m.otherUser.photoURL} />
                    <div>
                      <h3 className="text-2xl font-black italic uppercase tracking-tighter leading-tight">{m.otherUser.name}</h3>
                      <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest italic line-clamp-1 opacity-60">{m.lastMessage || "Start the magic..."}</p>
                    </div>
                  </div>
                  <button className="p-4 bg-black text-white rounded-2xl group-hover:scale-110 transition-all shadow-xl">
                    <MessageCircle size={20} />
                  </button>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-10">
            {likedMe.length === 0 ? (
              <div className="col-span-full">
                <EmptyState title="No Admirers Yet" desc="Patience is key. Your stars are aligning." onAction={() => router.push("/discover")} />
              </div>
            ) : (
              likedMe.map((u) => (
                <div key={u.uid} className="animate-match-card opacity-0 group relative">
                  <div onClick={() => router.push(`/profile/${u.uid}`)} className="aspect-[3/4] rounded-[3rem] overflow-hidden border-2 border-black relative shadow-lg cursor-pointer">
                    {u.photoURL ? (
                      <img src={u.photoURL} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 ease-in-out" />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-200">
                        <User size={64} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-6">
                      <h3 className="text-white font-black italic uppercase tracking-tighter text-2xl mb-1">{u.name}, {u.age}</h3>
                      <p className="text-white/40 text-[9px] font-black uppercase tracking-[0.2em]">{u.district}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 z-20">
                    <button
                      onClick={() => handleReject(u.uid)}
                      className="w-12 h-12 bg-white border-2 border-black rounded-2xl flex items-center justify-center hover:bg-black hover:text-white transition-all shadow-xl active:scale-90"
                    >
                      <X size={20} />
                    </button>
                    <button
                      onClick={() => handleLikeBack(u.uid)}
                      className="w-12 h-12 bg-black text-white border-2 border-black rounded-2xl flex items-center justify-center hover:scale-110 transition-all shadow-xl active:scale-90"
                    >
                      <Heart size={20} className="fill-white" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </main>
  );
}

function Avatar({ url }: { url?: string }) {
  return (
    <div className="w-20 h-20 rounded-full border-2 border-black overflow-hidden bg-gray-50 shrink-0 shadow-md">
      {url ? <img src={url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-200"><User size={32} /></div>}
    </div>
  );
}

function EmptyState({ title, desc, onAction }: { title: string; desc: string; onAction: () => void }) {
  return (
    <div className="text-center py-24 border-4 border-dashed border-gray-100 rounded-[3.5rem] animate-match-card opacity-0 bg-white">
      <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8">
        <Heart size={40} className="text-gray-100 animate-pulse" />
      </div>
      <h2 className="text-5xl font-black italic uppercase tracking-tighter mb-2">{title}</h2>
      <p className="text-gray-400 font-black uppercase text-[10px] tracking-[0.3em] mb-10 max-w-xs mx-auto leading-loose">{desc}</p>
      <button onClick={onAction} className="px-12 py-5 bg-black text-white rounded-full font-black uppercase text-[10px] tracking-widest hover:scale-110 active:scale-95 transition-all shadow-2xl">Discover Stars</button>
    </div>
  );
}
