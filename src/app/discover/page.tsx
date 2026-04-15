"use client";

import { useState } from "react";
import ProfileCard from "@/components/ProfileCard";
import { Sparkles, Filter, Settings2, Heart } from "lucide-react";

const MOCK_PROFILES = [
  {
    name: "Meera",
    age: 24,
    location: "Kochi, Ernakulam",
    profession: "Software Architect",
    education: "B.Tech, NIT Calicut",
    favoriteFood: "Appam & Stew",
    bio: "Love capturing the beauty of Kerala through my lens. Looking for someone who enjoys long chats by the backwaters and appreciates a good Sadya.",
  },
  {
    name: "Rahul",
    age: 27,
    location: "Kottayam",
    profession: "Nature Photographer",
    education: "Visual Communication",
    favoriteFood: "Kappa & Meen Curry",
    bio: "Adventurous soul from the land of letters. Usually found in the high ranges of Idukki. Swipe right if you're up for a Munnar trip!",
  },
  {
    name: "Anjali",
    age: 25,
    location: "Trivandrum",
    profession: "Classical Dancer",
    education: "MA Mohiniyattam",
    favoriteFood: "Puttu & Kadala",
    bio: "Traditional at heart but modern in outlook. I believe in the magic of simple things. Let's find some rhythm together.",
  },
  {
    name: "Arjun",
    age: 28,
    location: "Thrissur",
    profession: "Business Owner",
    education: "MBA",
    favoriteFood: "Thrissur Biryani",
    bio: "Die-hard fan of Thrissur Pooram. I run a family business and love exploring local cafes. Looking for a partner who is family-oriented.",
  }
];

export default function DiscoverPage() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextProfile = () => {
    setCurrentIndex((prev) => (prev + 1) % MOCK_PROFILES.length);
  };

  return (
    <div className="min-h-screen bg-[#FCFAFA] dark:bg-[#0F0F0F] pt-24 pb-12 px-4">
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
           <ProfileCard profile={MOCK_PROFILES[currentIndex]} />
        </div>

        {/* Swipe Instructions */}
        <div className="mt-12 flex items-center gap-8 text-gray-400">
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center">←</div>
            <span className="text-[10px] uppercase tracking-widest">Next</span>
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
      </div>
    </div>
  );
}
