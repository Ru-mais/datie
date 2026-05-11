"use client";

import { useEffect, useState } from "react";
import { Trash2, User, Clock, ArrowRight, ShieldCheck, Flag } from "lucide-react";
import { collection, query, orderBy, onSnapshot, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import toast from "react-hot-toast";
import { animate } from "animejs";

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminPass, setAdminPass] = useState("");
  const [requests, setRequests] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [isPurging, setIsPurging] = useState<string | null>(null);

  // --- Login Logic ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would check against a secure env variable
    if (adminPass === process.env.NEXT_PUBLIC_ADMIN_KEY) {
       setIsAuthenticated(true);
       toast.success("Welcome back, Commander.");
    } else {
       toast.error("Invalid Administrative Key.");
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      animate('.admin-login', {
        opacity: [0, 1],
        scale: [0.95, 1],
        duration: 1000,
        easing: 'outExpo'
      });
      return;
    }

    // Fetch Deletion Requests
    const q = query(collection(db, "deletion_requests"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Fetch Reports
    const qReports = query(collection(db, "reports"), orderBy("timestamp", "desc"));
    const unsubReports = onSnapshot(qReports, (snapshot) => {
      setReports(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubscribe(); unsubReports(); };
  }, [isAuthenticated]);

  const handlePurgeUser = async (uid: string, requestId: string) => {
    if (!confirm("CRITICAL ACTION: This will permanently wipe all matches, messages, and profile data for this user. Continue?")) return;
    
    setIsPurging(uid);
    try {
      const res = await fetch("/api/admin/cleanup-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          uid, 
          adminSecret: process.env.NEXT_PUBLIC_ADMIN_KEY
        })
      });

      if (res.ok) {
        // Delete the request record
        await deleteDoc(doc(db, "deletion_requests", requestId));
        toast.success("User Purged Successfully.");
      } else {
        toast.error("Purge Failed.");
      }
    } catch (err) {
      toast.error("System Error.");
    } finally {
      setIsPurging(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="admin-login opacity-0 max-w-md w-full bg-white/5 border border-white/10 p-12 rounded-[3rem] backdrop-blur-2xl">
           <div className="flex justify-center mb-8">
              <ShieldCheck size={64} className="text-white" />
           </div>
           <h1 className="text-3xl font-black italic tracking-tighter text-white uppercase text-center mb-8">Admin Gate.</h1>
           <form onSubmit={handleLogin} className="space-y-4">
              <input 
                type="password" 
                value={adminPass}
                onChange={(e) => setAdminPass(e.target.value)}
                placeholder="Enter Administrative Key..."
                className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl text-white font-bold focus:outline-none focus:border-white transition-all text-center"
              />
              <button type="submit" className="w-full p-6 bg-white text-black font-black uppercase text-[10px] tracking-widest rounded-2xl hover:scale-105 transition-all flex items-center justify-center gap-3">
                 Access Dashboard <ArrowRight size={16} />
              </button>
           </form>
           <p className="mt-8 text-center text-white/20 text-[8px] font-black uppercase tracking-[0.4em]">Secure Administrative Protocol v1.0</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 pt-32 pb-20 px-6">
      <div className="max-w-6xl mx-auto">
        
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-20">
           <div>
              <span className="px-4 py-1.5 bg-black text-white text-[8px] font-black uppercase tracking-[0.3em] rounded-full mb-4 inline-block">System Administrator</span>
              <h1 className="text-6xl font-black italic tracking-tighter uppercase text-black">Control Center.</h1>
           </div>
           <div className="flex gap-4">
              <StatCard label="Pending Deletions" value={requests.length} />
              <StatCard label="Active Reports" value={reports.length} />
           </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
           
           {/* Deletion Requests */}
           <section className="space-y-8">
              <h2 className="text-xs font-black uppercase tracking-[0.4em] text-gray-400 flex items-center gap-3">
                 <Trash2 size={16} /> Deletion Requests
              </h2>
              {requests.length === 0 ? (
                <div className="p-12 bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-gray-300 italic font-medium">
                   All clear. No pending requests.
                </div>
              ) : (
                <div className="space-y-4">
                  {requests.map(req => (
                    <div key={req.id} className="p-8 bg-white rounded-[2.5rem] shadow-sm border border-gray-100 flex items-center justify-between group hover:border-black transition-all">
                       <div className="flex items-center gap-6">
                          <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center shadow-inner">
                             <User size={20} />
                          </div>
                          <div>
                             <h3 className="font-black italic uppercase tracking-tighter text-lg">{req.email}</h3>
                             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Clock size={10} /> Requested {new Date(req.timestamp?.seconds * 1000).toLocaleDateString()}
                             </p>
                          </div>
                       </div>
                       <button 
                         disabled={isPurging === req.uid}
                         onClick={() => handlePurgeUser(req.uid, req.id)}
                         className="p-4 bg-red-500 text-white rounded-2xl hover:scale-110 active:scale-95 transition-all shadow-lg disabled:opacity-50"
                       >
                         {isPurging === req.uid ? "Purging..." : <Trash2 size={20} />}
                       </button>
                    </div>
                  ))}
                </div>
              )}
           </section>

           {/* User Reports */}
           <section className="space-y-8">
              <h2 className="text-xs font-black uppercase tracking-[0.4em] text-gray-400 flex items-center gap-3">
                 <Flag size={16} /> User Reports
              </h2>
              {reports.length === 0 ? (
                <div className="p-12 bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-gray-300 italic font-medium">
                   No active user reports.
                </div>
              ) : (
                <div className="space-y-4">
                  {reports.map(rep => (
                    <div key={rep.id} className="p-8 bg-white rounded-[2.5rem] shadow-sm border border-gray-100 group hover:border-orange-500 transition-all">
                       <div className="flex items-center justify-between mb-4">
                          <span className="px-3 py-1 bg-orange-100 text-orange-600 text-[8px] font-black uppercase tracking-widest rounded-full">Reported</span>
                          <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{new Date(rep.timestamp?.seconds * 1000).toLocaleDateString()}</span>
                       </div>
                       <p className="text-gray-500 font-medium leading-relaxed mb-6 italic">&quot;{rep.reason}&quot;</p>
                       <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Target UID: {rep.reportedId.substring(0, 10)}...</span>
                          <button 
                            onClick={() => handlePurgeUser(rep.reportedId, rep.id)}
                            className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:underline"
                          >
                            Purge Reported User
                          </button>
                       </div>
                    </div>
                  ))}
                </div>
              )}
           </section>

        </div>
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string, value: number }) {
  return (
    <div className="px-10 py-6 bg-white rounded-[2rem] border border-gray-100 shadow-sm flex flex-col items-center justify-center">
       <span className="text-3xl font-black italic tracking-tighter text-black mb-1">{value}</span>
       <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">{label}</span>
    </div>
  );
}
