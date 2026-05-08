"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Heart, MessageCircle, X, Sparkles } from "lucide-react";

interface MatchOverlayProps {
  matchedUser: {
    name: string;
    images?: string[];
  };
  onClose: () => void;
}

export default function MatchOverlay({ matchedUser, onClose }: MatchOverlayProps) {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl transition-all duration-500">
      {/* Background Sparkles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div 
            key={i}
            className="absolute bg-primary rounded-full opacity-20 animate-pulse"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 10 + 2}px`,
              height: `${Math.random() * 10 + 2}px`,
              animationDelay: `${Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      <div className={`relative max-w-sm w-full p-8 text-center transition-all duration-700 transform ${showContent ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 scale-90'}`}>
        <button 
          onClick={onClose}
          className="absolute top-0 right-0 p-2 text-white/40 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        <div className="mb-8 relative flex justify-center">
            <div className="relative">
                <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center animate-bounce shadow-[0_0_50px_rgba(212,175,55,0.6)] overflow-hidden">
                    {matchedUser.images?.[0] ? (
                      <Image src={matchedUser.images[0]} alt={matchedUser.name} fill className="object-cover" />
                    ) : (
                      <Heart size={48} fill="black" className="text-black" />
                    )}
                </div>
                <Sparkles className="absolute -top-4 -right-4 text-primary animate-pulse" size={32} />
            </div>
        </div>

        <h2 className="text-5xl font-bold text-white mb-2 tracking-tighter">
          It's a <span className="gold-text">Match!</span>
        </h2>
        <p className="text-white/70 text-lg mb-10">
          You and <span className="text-primary font-bold">{matchedUser.name}</span> liked each other.
        </p>

        <div className="space-y-4">
          <button 
            className="w-full py-4 bg-primary text-black font-bold rounded-2xl flex items-center justify-center gap-3 hover:bg-primary-hover transition-all shadow-xl"
          >
            <MessageCircle size={20} />
            Send a Message
          </button>
          
          <button 
            onClick={onClose}
            className="w-full py-4 bg-white/5 border border-white/10 text-white font-bold rounded-2xl hover:bg-white/10 transition-all"
          >
            Keep Swiping
          </button>
        </div>
      </div>
    </div>
  );
}
