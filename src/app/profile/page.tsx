"use client";

import { useState, useEffect } from "react";
import { Camera, MapPin, Briefcase, Utensils, Heart, Save, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import toast from "react-hot-toast";
import Image from "next/image";

const DISTRICTS = [
  'Alappuzha', 'Ernakulam', 'Idukki', 'Kannur', 'Kasaragod', 
  'Kollam', 'Kottayam', 'Kozhikode', 'Malappuram', 'Palakkad', 
  'Pathanamthitta', 'Thiruvananthapuram', 'Thrissur', 'Wayanad'
];

export default function ProfilePage() {
  const { user, logout, checkAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    name: "",
    bio: "",
    district: "",
    profession: "",
    interests: [] as string[],
  });

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || "",
        bio: (user as any).bio || "",
        district: user.district || "",
        profession: (user as any).profession || "",
        interests: (user as any).interests || [],
      });
    }
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await axios.patch("http://localhost:5000/api/v1/users/updateMe", profile, {
        withCredentials: true,
      });
      toast.success("Profile updated successfully!");
      await checkAuth();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#FCFAFA] dark:bg-[#0F0F0F] pt-28 pb-12 px-4">
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Sidebar - Profile Picture & Quick Stats */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white dark:bg-[#1A1A1A] p-6 rounded-[2rem] shadow-xl border border-gray-100 dark:border-gray-800 text-center">
            <div className="relative w-32 h-32 mx-auto mb-4 group cursor-pointer">
              <div className="w-full h-full rounded-full bg-gradient-to-tr from-[#D4AF37] to-[#F5F5DC] p-1">
                <div className="w-full h-full rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center overflow-hidden relative">
                  {user.images?.[0] ? (
                    <Image src={user.images[0]} alt={user.name} fill className="object-cover" />
                  ) : (
                    <span className="text-4xl font-bold text-gray-400">{user.name[0]}</span>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="text-white" />
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#D4AF37] rounded-full border-4 border-white dark:border-[#1A1A1A] flex items-center justify-center">
                <Heart size={14} className="text-black" fill="currentColor" />
              </div>
            </div>
            
            <h2 className="text-xl font-bold mb-1">{user.name}</h2>
            <p className="text-gray-500 text-sm mb-6">{user.email}</p>
            
            <button 
              onClick={logout}
              className="w-full py-3 flex items-center justify-center gap-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all text-sm font-medium"
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </div>

          <div className="bg-[#D4AF37] p-6 rounded-[2rem] shadow-xl text-black">
            <h3 className="font-bold mb-2">Premium Status</h3>
            <p className="text-sm opacity-80 mb-4">
              {user.isPremium ? "You are a Gold member!" : "Upgrade to see who liked you and get unlimited swipes."}
            </p>
            {!user.isPremium && (
              <button className="w-full py-3 bg-black text-white rounded-xl font-bold text-sm hover:scale-105 transition-transform">
                Upgrade Now
              </button>
            )}
          </div>
        </div>

        {/* Main Content - Edit Form */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white dark:bg-[#1A1A1A] p-8 rounded-[2rem] shadow-xl border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-2xl font-bold">Complete Your <span className="gold-text">Profile</span></h1>
              <button 
                onClick={handleSave}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#D4AF37] hover:bg-[#B8860B] text-black font-bold rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-50"
              >
                <Save size={18} />
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">Current District</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D4AF37]" size={18} />
                    <select 
                      value={profile.district}
                      onChange={(e) => setProfile({...profile, district: e.target.value})}
                      className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-[#D4AF37]/50 appearance-none"
                    >
                      {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">Profession</label>
                  <div className="relative">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D4AF37]" size={18} />
                    <input 
                      type="text"
                      value={profile.profession}
                      onChange={(e) => setProfile({...profile, profession: e.target.value})}
                      placeholder="e.g. Software Engineer"
                      className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-[#D4AF37]/50"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">About Me</label>
                <textarea 
                  value={profile.bio}
                  onChange={(e) => setProfile({...profile, bio: e.target.value})}
                  rows={4}
                  placeholder="Tell others about your roots and what you're looking for..."
                  className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-2xl p-4 focus:ring-2 focus:ring-[#D4AF37]/50 resize-none"
                />
              </div>

              <div className="space-y-4">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">Interests</label>
                <div className="flex flex-wrap gap-2">
                  {['Photography', 'Traveling', 'Music', 'Cooking', 'Art', 'Dance', 'Cinema', 'Reading'].map(interest => (
                    <button
                      key={interest}
                      onClick={() => {
                        const newInterests = profile.interests.includes(interest)
                          ? profile.interests.filter(i => i !== interest)
                          : [...profile.interests, interest];
                        setProfile({...profile, interests: newInterests});
                      }}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        profile.interests.includes(interest)
                        ? 'bg-[#D4AF37] text-black shadow-md'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
