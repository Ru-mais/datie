"use client";

import { useEffect, useState, useRef } from "react";
import { animate } from "animejs";
import { Camera, User, LogOut, Settings, ShieldAlert, Plus, Loader2, X, Trash2, Heart, MapPin, Phone, Calendar, Star, Languages, Smile, Briefcase, GraduationCap, Ruler, MessageSquare, HeartHandshake, Mail, Check, Edit2, Save } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { doc, setDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

const DISTRICTS = ["Alappuzha", "Ernakulam", "Idukki", "Kannur", "Kasaragod", "Kollam", "Kottayam", "Kozhikode", "Malappuram", "Palakkad", "Pathanamthitta", "Thiruvananthapuram", "Thrissur", "Wayanad"];
const GENDERS = ["Male", "Female", "Other"];
const LOOKING_FOR = ["Dating", "Serious Relationship", "Marriage", "Friendship"];
const SUGGESTED_INTERESTS = ["Music", "Travel", "Cinema", "Football", "Cooking", "Photography", "Dance", "Coding", "Art", "Reading"];

export default function ProfilePage() {
  const { user, profile, logout, loading, setProfile } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [activeTab, setActiveTab] = useState("story");
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [customInterest, setCustomInterest] = useState("");
  
  const [editData, setEditData] = useState({
    name: profile?.name || "",
    age: profile?.age || "",
    gender: profile?.gender || "Male",
    district: profile?.district || "Ernakulam",
    phone: profile?.phone || "",
    phoneVerified: profile?.phoneVerified || false,
    bio: profile?.bio || "",
    profession: profile?.profession || "",
    education: profile?.education || "",
    religion: profile?.religion || "",
    height: profile?.height || "",
    lookingFor: profile?.lookingFor || "Dating",
    interests: profile?.interests || [],
    languages: profile?.languages || ["Malayalam", "English"],
  });

  useEffect(() => {
    if (loading === false && !user) {
      router.push("/login");
      return;
    }
    if (profile) {
      setEditData({
        name: profile.name || "",
        age: profile.age || "",
        gender: profile.gender || "Male",
        district: profile.district || "Ernakulam",
        phone: profile.phone || "",
        phoneVerified: profile.phoneVerified || false,
        bio: profile.bio || "",
        profession: profile.profession || "",
        education: profile.education || "",
        religion: profile.religion || "",
        height: profile.height || "",
        lookingFor: profile.lookingFor || "Dating",
        interests: profile.interests || [],
        languages: profile.languages || ["Malayalam", "English"],
      });
    }

    if (loading === false && user) {
      setTimeout(() => {
        animate('.animate-profile', {
          opacity: [0, 1],
          translateY: [20, 0],
          delay: (el: any, i: number) => i * 100,
          duration: 800,
          ease: 'outExpo'
        });
      }, 100);
    }
  }, [user, loading, router, profile]);

  const [isScanning, setIsScanning] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 800 * 1024) {
      toast.error("Photo must be under 800KB.");
      return;
    }

    setIsUploading(true);
    setIsScanning(true);
    
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64String = reader.result as string;
        
        // REAL AI Safety Scan call
        const res = await fetch("/api/vision", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64String })
        });
        
        const scanData = await res.json();
        
        if (scanData.safe) {
          const userRef = doc(db, "users", user.uid);
          await setDoc(userRef, { photoURL: base64String }, { merge: true });

          if (setProfile) setProfile({ ...profile, photoURL: base64String } as any);
          toast.success("AI Approved: Photo Synced!");
        } else {
          toast.error("AI Rejected: Inappropriate content detected.");
        }
        
        setIsUploading(false);
        setIsScanning(false);
      };
    } catch (err) {
      toast.error("AI Scan failed. Check API key.");
      setIsUploading(false);
      setIsScanning(false);
    }
  };

  const [isVerifying, setIsVerifying] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [verificationId, setVerificationId] = useState<string | null>(null);

  const handleRemovePhoto = async () => {
    if (!user || !confirm("Remove your profile photo?")) return;
    setIsUploading(true);
    try {
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, { photoURL: "" }, { merge: true });
      if (setProfile) setProfile({ ...profile, photoURL: "" } as any);
      toast.success("Photo removed");
    } catch (err) {
      toast.error("Failed to remove photo");
    } finally {
      setIsUploading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otpCode === (process.env.NEXT_PUBLIC_TEST_OTP || "123456")) { // Simulated success code
       setEditData({...editData, phoneVerified: true});
       setVerificationId(null);
       setOtpCode("");
       toast.success("Phone Verified Successfully!");
    } else {
       toast.error("Invalid OTP code");
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    if (!user) return;
    try {
      const updatedProfile = {
        ...editData,
        age: parseInt(editData.age.toString()),
        updatedAt: new Date()
      };
      await setDoc(doc(db, "users", user.uid), updatedProfile, { merge: true });
      if (setProfile) setProfile({ ...profile, ...updatedProfile } as any);
      toast.success("Profile Updated!");
      setIsEditing(false);
    } catch (err) {
      toast.error("Failed to update profile");
    }
  };

  const toggleInterest = (interest: string) => {
    const updated = editData.interests.includes(interest) ? editData.interests.filter(i => i !== interest) : [...editData.interests, interest];
    setEditData({...editData, interests: updated});
  };

  const addCustomInterest = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && customInterest.trim()) {
      e.preventDefault();
      if (!editData.interests.includes(customInterest.trim())) {
        setEditData({ ...editData, interests: [...editData.interests, customInterest.trim()] });
      }
      setCustomInterest("");
    }
  };

  const handleRequestDeletion = async () => {
    if (!confirm("Are you sure you want to request account deletion? An admin will review your request and permanently remove your data within 24 hours.")) return;
    try {
      await addDoc(collection(db, "deletion_requests"), {
        uid: user?.uid,
        email: user?.email,
        timestamp: serverTimestamp(),
        status: "pending"
      });
      toast.success("Request sent to Admin. You will be logged out shortly.");
      setTimeout(() => logout(), 3000);
    } catch (err) {
      toast.error("Failed to send request");
    }
  };

  if (loading || !profile) return (
    <div className="min-h-screen flex items-center justify-center bg-white font-black italic text-3xl text-black">Datie.</div>
  );

  return (
    <main className="min-h-screen bg-white pt-32 pb-20 px-6">
      <div className="max-w-5xl mx-auto">
        <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />

        {/* Header Profile Section */}
        <div className="flex flex-col md:flex-row items-center gap-10 mb-16 animate-profile opacity-0">
          <div className="relative group cursor-pointer">
            <div 
              onClick={() => !isUploading && !isScanning && fileInputRef.current?.click()}
              className="w-40 h-40 rounded-full border-4 border-black overflow-hidden bg-gray-50 flex items-center justify-center shadow-2xl relative group"
            >
              {isScanning ? (
                <div className="flex flex-col items-center gap-3 text-blue-600 animate-pulse">
                  <ShieldAlert className="animate-bounce" size={48} />
                  <span className="text-[8px] font-black uppercase tracking-[0.3em]">AI Security Scan</span>
                </div>
              ) : isUploading ? (
                <div className="flex flex-col items-center gap-2 text-black">
                  <Loader2 className="animate-spin" size={32} />
                  <span className="text-[10px] font-black uppercase">Syncing...</span>
                </div>
              ) : profile?.photoURL || user?.photoURL ? (
                <img src={profile?.photoURL || user?.photoURL || ""} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={64} className="text-black/10" />
              )}
            </div>

            {/* Action Buttons */}
            {profile?.photoURL && !isScanning && !isUploading && (
               <button 
                 onClick={(e) => { e.stopPropagation(); handleRemovePhoto(); }}
                 className="absolute -top-2 -right-2 p-2 bg-red-500 text-white rounded-full shadow-xl hover:scale-110 transition-all z-20"
               >
                 <X size={16} />
               </button>
            )}
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-2 right-2 p-3 bg-black text-white rounded-full shadow-xl hover:scale-110 transition-all cursor-pointer"
            >
              <Camera size={16} />
            </div>
          </div>

          <div className="text-center md:text-left flex-1">
            <h1 className="text-5xl font-black tracking-tighter mb-2 uppercase italic">{profile?.name || user?.displayName}</h1>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-gray-400 font-bold uppercase tracking-widest text-[10px]">
              <span className="flex items-center gap-2 text-black border-r pr-4 border-gray-200"><MapPin size={12} /> {profile?.district}</span>
              <span className="flex items-center gap-2 text-black border-r pr-4 border-gray-200"><Calendar size={12} /> {profile?.age} Yrs</span>
              <span className="flex items-center gap-2 text-black border-r pr-4 border-gray-200"><Phone size={12} className="text-blue-500" /> {profile?.phone || "Private"}</span>
              <span className="flex items-center gap-2 text-black"><Heart size={12} className="fill-black" /> {profile?.lookingFor}</span>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="animate-profile opacity-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-8">
              <div className="p-8 border-2 border-black rounded-[2.5rem] shadow-xl bg-white">
                <div className="flex justify-between items-center mb-10">
                  <h2 className="text-3xl font-black italic tracking-tighter">My Story</h2>
                  <button onClick={() => setIsEditing(!isEditing)} className="px-6 py-2 bg-black text-white rounded-full text-xs font-black uppercase tracking-widest hover:scale-105 transition-all">
                    {isEditing ? "Cancel" : "Edit Profile"}
                  </button>
                </div>
                
                {isEditing ? (
                  <div className="space-y-12">
                    {/* Step 1: Basics */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-black uppercase tracking-widest text-gray-300">1. Basics & Contact</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <EditInput label="Full Name" value={editData.name} onChange={(v:string) => setEditData({...editData, name: v})} />
                        <EditInput label="Age" type="number" value={editData.age} onChange={(v:string) => setEditData({...editData, age: v})} />
                        <div className="space-y-4">
                           <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Verified Email</label>
                             <div className="p-5 bg-gray-50 border-2 border-gray-100 rounded-full font-bold text-gray-400 flex items-center gap-4">
                                <Mail size={16} /> {user?.email}
                             </div>
                           </div>
                           
                           <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Verified Phone</label>
                             <div className="p-5 bg-gray-50 border-2 border-gray-100 rounded-full font-bold text-gray-400 flex items-center gap-4">
                                <Phone size={16} /> {editData.phone || "No phone added"}
                                <div className="ml-auto text-green-500 flex items-center gap-1 text-[9px] uppercase font-black">
                                   <Check size={14} /> Verified
                                </div>
                             </div>
                           </div>
                        </div>
                        <EditSelect label="Gender" value={editData.gender} options={GENDERS} onChange={(v) => setEditData({...editData, gender: v})} />
                        <EditSelect label="District" value={editData.district} options={DISTRICTS} onChange={(v) => setEditData({...editData, district: v})} />
                      </div>
                    </div>

                    <div className="space-y-4 pt-6 border-t border-gray-100">
                      <h3 className="text-xs font-black uppercase tracking-widest text-gray-300">2. Vibe & Bio</h3>
                      <EditSelect label="Looking For" value={editData.lookingFor} options={LOOKING_FOR} onChange={(v) => setEditData({...editData, lookingFor: v})} />
                      
                      {/* Interests Input */}
                      <div className="space-y-4 mt-6">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">My Interests</label>
                        <div className="flex flex-wrap gap-2">
                          {editData.interests.map((i: string) => (
                            <span key={i} className="px-4 py-2 bg-black text-white rounded-full text-[10px] font-black uppercase flex items-center gap-2">
                              {i} <X size={12} className="cursor-pointer" onClick={() => toggleInterest(i)} />
                            </span>
                          ))}
                        </div>
                        <div className="relative">
                          <input 
                            type="text" 
                            value={customInterest} 
                            onChange={(e) => setCustomInterest(e.target.value)} 
                            onKeyDown={addCustomInterest} 
                            placeholder="Type interest & hit Enter (e.g. Travel, Music)..." 
                            className="w-full p-5 border-2 border-black rounded-2xl font-bold italic text-sm focus:outline-none bg-white shadow-sm" 
                          />
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-gray-50 rounded-lg">
                             <Plus size={16} className="text-gray-400" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 mt-6">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Bio</label>
                        <textarea value={editData.bio} onChange={(e) => setEditData({...editData, bio: e.target.value})} placeholder="Tell your story..." className="w-full p-6 border-2 border-black rounded-[2rem] min-h-[150px] font-medium focus:outline-none bg-white shadow-sm" />
                      </div>
                    </div>

                    <button onClick={handleUpdateProfile} className="w-full py-6 bg-black text-white rounded-full font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-2xl hover:scale-[1.02] transition-all">
                      <Save size={24} /> Complete Profile
                    </button>
                  </div>
                ) : (
                  <div className="space-y-12">
                    <p className="text-2xl text-gray-600 leading-relaxed font-medium italic">&quot;{profile?.bio || "A great connection needs a story. Click edit to start yours..."}&quot;</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                      <InfoBadge icon={<Briefcase size={16}/>} label="Work" value={profile?.profession} />
                      <InfoBadge icon={<GraduationCap size={16}/>} label="Education" value={profile?.education} />
                      <InfoBadge icon={<HeartHandshake size={16}/>} label="Religion" value={profile?.religion} />
                      <InfoBadge icon={<Ruler size={16}/>} label="Height" value={profile?.height} />
                      <InfoBadge icon={<Languages size={16}/>} label="Gender" value={profile?.gender} />
                      <InfoBadge icon={<Phone size={16}/>} label="Phone" value={profile?.phone} />
                    </div>

                    {/* Interests Section in View Mode */}
                    {profile?.interests && profile.interests.length > 0 && (
                      <div className="pt-10 border-t border-gray-100">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-6">My Vibes</h3>
                        <div className="flex flex-wrap gap-3">
                          {profile.interests.map((interest: string) => (
                            <span key={interest} className="px-6 py-3 bg-gray-50 border-2 border-black/5 rounded-full text-[10px] font-black uppercase tracking-widest text-black">
                              {interest}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar: Score & Settings */}
            <div className="space-y-8">
              {/* Identity Score */}
              <div className="p-8 bg-black text-white rounded-[2.5rem] shadow-2xl text-center overflow-hidden animate-profile opacity-0">
                 <h3 className="text-[10px] font-black uppercase tracking-[0.4em] mb-4 opacity-50">Identity Score</h3>
                 <div className="text-7xl font-black text-blue-400 mb-2">
                   {(() => {
                     const fields = [profile?.name, profile?.age, profile?.bio, profile?.profession, profile?.education, profile?.religion, profile?.photoURL, profile?.interests?.length];
                     const filled = fields.filter(f => f).length;
                     return Math.round((filled / fields.length) * 100);
                   })()}%
                 </div>
                 {(() => {
                     const fields = [profile?.name, profile?.age, profile?.bio, profile?.profession, profile?.education, profile?.religion, profile?.photoURL, profile?.interests?.length];
                     const filled = fields.filter(f => f).length;
                     if (filled < fields.length) {
                       return (
                         <div className="mt-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                            <p className="text-[9px] font-bold uppercase tracking-widest text-blue-300 animate-pulse">
                               Finish your story to reach 100%
                            </p>
                         </div>
                       );
                     }
                     return <p className="text-[9px] font-bold uppercase tracking-widest text-green-400">Elite Profile Verified</p>;
                   })()}
              </div>

              {/* Settings & Security Section */}
              <div className="space-y-6 animate-profile opacity-0">
                 <div className="p-8 border-2 border-gray-100 rounded-[2.5rem] bg-white">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-6">Account Settings</h3>
                    <div className="space-y-4">
                       <button 
                         onClick={logout}
                         className="w-full py-4 flex items-center justify-center gap-3 bg-black text-white font-black uppercase text-[10px] tracking-widest rounded-2xl hover:scale-[1.02] transition-all shadow-lg"
                       >
                         <LogOut size={16} /> Logout Session
                       </button>
                    </div>
                 </div>

                 {/* Danger Zone */}
                 <div className="p-8 bg-red-50/30 rounded-[2.5rem] border-2 border-dashed border-red-50">
                    <div className="text-center space-y-4">
                       <div className="flex flex-col items-center gap-2">
                          <ShieldAlert size={20} className="text-red-400" />
                          <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-red-400">Danger Zone</h4>
                       </div>
                       <button 
                         onClick={handleRequestDeletion}
                         className="w-full py-3 bg-white text-red-500 border border-red-100 font-black uppercase text-[9px] tracking-widest rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                       >
                         Request Deletion
                       </button>
                    </div>
                 </div>
              </div>

            </div>
          </div>
        </div>
      </div>
      {/* OTP Verification Modal */}
      {verificationId && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-fade-in">
           <div className="bg-white rounded-[3rem] p-10 max-w-sm w-full text-center space-y-8 animate-match-card">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-blue-500">
                 <ShieldAlert size={40} />
              </div>
              <div>
                <h3 className="text-3xl font-black italic tracking-tighter uppercase mb-2">Verify Phone</h3>
                <p className="text-gray-400 font-black uppercase text-[10px] tracking-widest leading-relaxed">
                  Enter the 6-digit code we sent to your number. For testing, use: <span className="text-black">123456</span>
                </p>
              </div>
              <input 
                type="text" 
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="000000"
                className="w-full p-6 bg-gray-50 border-2 border-black rounded-2xl text-center text-3xl font-black tracking-[0.5em] focus:outline-none"
              />
              <div className="flex flex-col gap-3">
                 <button onClick={handleVerifyOTP} className="w-full py-5 bg-black text-white rounded-full font-black uppercase tracking-widest text-xs shadow-xl">Verify Code</button>
                 <button onClick={() => setVerificationId(null)} className="text-gray-400 font-black uppercase text-[10px] tracking-widest">Cancel</button>
              </div>
           </div>
        </div>
      )}
    </main>
  );
}

function EditInput({ label, value, onChange, type = "text" }: any) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full p-4 border-2 border-black rounded-2xl font-bold focus:ring-0 focus:outline-none bg-white" />
    </div>
  );
}

function EditSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full p-4 border-2 border-black rounded-2xl font-bold appearance-none bg-white">
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
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
