"use client";

import { useState, useEffect } from "react";
import ProfileCard from "@/components/ProfileCard";
import { Sparkles, Filter, Settings2, Heart, Loader2 } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import MatchOverlay from "@/components/MatchOverlay";

export default function DiscoverPage() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [matchData, setMatchData] = useState<any>(null);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("http://localhost:5000/api/v1/matches/discovery", {
        withCredentials: true,
      });
      setProfiles(data.data.profiles);
    } catch (err: any) {
      toast.error("Failed to fetch matches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleSwipe = async (direction: 'right' | 'left') => {
    if (profiles.length === 0) return;
    
    const targetUserId = profiles[currentIndex]._id;
    
    try {
      const { data } = await axios.post("http://localhost:5000/api/v1/matches/swipe", {
        targetUserId,
        direction
      }, { withCredentials: true });

      if (data.match) {
        setMatchData(data.data.user);
      }

      // Move to next profile
      if (currentIndex < profiles.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        // Fetch more if at the end
        fetchProfiles();
        setCurrentIndex(0);
      }
    } catch (err) {
      toast.error("Swipe failed");
    }
  };

  if (loading && profiles.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FCFAFA] dark:bg-[#0F0F0F]">
        <Loader2 className="w-12 h-12 text-[#D4AF37] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FCFAFA] dark:bg-[#0F0F0F] pt-24 pb-12 px-4">
      {matchData && (
        <MatchOverlay 
          matchedUser={matchData} 
          onClose={() => setMatchData(null)} 
        />
      )}

      {/* Header */}
      <div className="max-w-4xl mx-auto flex items-center justify-between mb-12">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            Discover <span className="gold-text">Matches</span>
            <Sparkles className="w-6 h-6 text-[#D4AF37]" />
          </h1>
          <p className="text-gray-500 text-sm mt-1">Handpicked profiles just for you in Kerala</p>
        </div>
        <div className="flex gap-3">
          <button className="p-3 bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-800 rounded-2xl hover:border-[#D4AF37]/50 transition-all">
            <Filter size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
          <button className="p-3 bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-800 rounded-2xl hover:border-[#D4AF37]/50 transition-all">
            <Settings2 size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Discovery Area */}
      <div className="max-w-4xl mx-auto flex flex-col items-center">
        <div className="relative w-full flex justify-center perspective-1000">
           {profiles.length > 0 ? (
             <ProfileCard 
               profile={{
                 ...profiles[currentIndex],
                 location: profiles[currentIndex].district,
                 onLike: () => handleSwipe('right'),
                 onDislike: () => handleSwipe('left')
               }} 
             />
           ) : (
             <div className="text-center py-20">
               <Heart size={48} className="mx-auto text-gray-300 mb-4" />
               <h3 className="text-xl font-bold">No more profiles found</h3>
               <p className="text-gray-500">Try expanding your filters or come back later.</p>
             </div>
           )}
        </div>

        {/* Swipe Instructions */}
        {profiles.length > 0 && (
          <div className="mt-12 flex items-center gap-8 text-gray-400">
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center">←</div>
              <span className="text-[10px] uppercase tracking-widest">Pass</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Heart size={20} className="text-[#D4AF37]/30" />
              <span className="text-[10px] uppercase tracking-widest font-bold text-[#D4AF37]">Select</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center">→</div>
              <span className="text-[10px] uppercase tracking-widest">Later</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
