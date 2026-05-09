"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import toast from "react-hot-toast";
import Image from "next/image";
import Link from "next/link";
import { MessageCircle, Heart, MapPin, Loader2, Sparkles } from "lucide-react";

export default function MatchesPage() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMatches = async () => {
    try {
      const { data } = await axios.get("http://localhost:5000/api/v1/matches/matches", {
        withCredentials: true,
      });
      setMatches(data.data.matches);
    } catch (err: any) {
      toast.error("Failed to fetch matches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMatches();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FCFAFA] dark:bg-[#0F0F0F]">
        <Loader2 className="w-12 h-12 text-[#D4AF37] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FCFAFA] dark:bg-[#0F0F0F] pt-28 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3">
              Your <span className="gold-text">Matches</span>
              <Heart className="w-8 h-8 text-[#D4AF37] fill-[#D4AF37]" />
            </h1>
            <p className="text-gray-500 mt-2">These people liked you back! Start a conversation.</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-[#D4AF37]/10 rounded-full border border-[#D4AF37]/20">
            <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-[#D4AF37] text-xs font-bold uppercase tracking-widest">{matches.length} Mutual Matches</span>
          </div>
        </div>

        {matches.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.map((match) => (
              <div 
                key={match._id}
                className="group relative bg-white dark:bg-[#1A1A1A] rounded-[2rem] overflow-hidden shadow-xl border border-gray-100 dark:border-gray-800 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
              >
                {/* Image Section */}
                <div className="relative h-64 w-full overflow-hidden">
                  {match.images?.[0] ? (
                    <Image 
                      src={match.images[0]} 
                      alt={match.name} 
                      fill 
                      className="object-cover transition-transform duration-700 group-hover:scale-110" 
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-4xl font-bold text-gray-400">
                      {match.name[0]}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <h3 className="text-white text-xl font-bold">{match.name}, {match.age}</h3>
                    <div className="flex items-center gap-1 text-white/80 text-xs">
                      <MapPin size={12} />
                      {match.district}
                    </div>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-6">
                  <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2 mb-6">
                    {match.bio || "No bio added yet."}
                  </p>
                  
                  <Link 
                    href={`/chat/${match._id}`}
                    className="w-full py-3.5 bg-[#D4AF37] hover:bg-[#B8860B] text-black font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
                  >
                    <MessageCircle size={18} />
                    Send Message
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-white dark:bg-[#1A1A1A] rounded-[3rem] border border-dashed border-gray-200 dark:border-gray-800">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart size={40} className="text-gray-300" />
            </div>
            <h3 className="text-2xl font-bold mb-2">No matches yet</h3>
            <p className="text-gray-500 max-w-xs mx-auto mb-8">
              Keep discovering! Your perfect Malayali match is just a swipe away.
            </p>
            <Link 
              href="/discover" 
              className="px-8 py-3 bg-[#D4AF37] text-black font-bold rounded-full hover:shadow-lg transition-all inline-flex items-center gap-2"
            >
              <Sparkles size={18} />
              Start Discovering
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
