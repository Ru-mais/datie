"use client";

import { useEffect, useState } from "react";
import { Trash2, User, Clock, ArrowRight, ShieldCheck, Flag, Users, Search, RefreshCw, AlertTriangle } from "lucide-react";
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, getDocs, where, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import toast from "react-hot-toast";
import { animate } from "animejs";

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminPass, setAdminPass] = useState("");
  const [activeTab, setActiveTab] = useState<"users" | "requests" | "reports">("users");
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [requests, setRequests] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [isPurging, setIsPurging] = useState<string | null>(null);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // --- Login Logic ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminSecret: adminPass }),
      });
      if (res.ok) {
        setIsAuthenticated(true);
        toast.success("Welcome back, Administrator.");
      } else {
        toast.error("Invalid Administrative Key.");
      }
    } catch {
      toast.error("System Error.");
    }
  };

  const fetchAllUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const snap = await getDocs(collection(db, "users"));
      setAllUsers(snap.docs.map(d => ({ uid: d.id, ...d.data() })));
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setIsLoadingUsers(false);
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

    fetchAllUsers();

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

  const handlePurgeUser = async (uid: string, requestId?: string) => {
    if (!confirm(`CRITICAL PERMANENT PURGE: This will completely vanish user (${uid}) from Firestore, deleting their profile, messages, matches, likes, and phone reservation. Continue?`)) return;
    
    setIsPurging(uid);
    try {
      // 1. Release used_phones if phone number is present
      const targetUser = allUsers.find(u => u.uid === uid);
      if (targetUser?.phone) {
        try {
          await deleteDoc(doc(db, "used_phones", targetUser.phone));
        } catch (phoneErr) {
          console.warn("Could not delete used_phones doc:", phoneErr);
        }
      }

      // 2. Delete the user profile doc directly from Firestore (Instant)
      await deleteDoc(doc(db, "users", uid));

      // 3. Delete all deletion requests for this user
      try {
        const delReqs = await getDocs(query(collection(db, "deletion_requests"), where("uid", "==", uid)));
        const batch = writeBatch(db);
        delReqs.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
      } catch (reqErr) {
        console.warn("Could not batch delete requests:", reqErr);
      }

      // 4. Cascading delete for likes, matches, blocks, reports
      try {
        const matchesQuery = query(collection(db, "matches"), where("users", "array-contains", uid));
        const matchSnap = await getDocs(matchesQuery);
        for (const mDoc of matchSnap.docs) {
          try {
            await deleteDoc(mDoc.ref);
          } catch {}
        }

        const sentLikes = await getDocs(query(collection(db, "likes"), where("from", "==", uid)));
        const recvLikes = await getDocs(query(collection(db, "likes"), where("to", "==", uid)));
        const sentBlocks = await getDocs(query(collection(db, "blocks"), where("blocker", "==", uid)));
        const recvBlocks = await getDocs(query(collection(db, "blocks"), where("blocked", "==", uid)));
        const userReports = await getDocs(query(collection(db, "reports"), where("reportedId", "==", uid)));

        const batch = writeBatch(db);
        sentLikes.docs.forEach(d => batch.delete(d.ref));
        recvLikes.docs.forEach(d => batch.delete(d.ref));
        sentBlocks.docs.forEach(d => batch.delete(d.ref));
        recvBlocks.docs.forEach(d => batch.delete(d.ref));
        userReports.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
      } catch (cascadeErr) {
        console.warn("Cascade cleanup non-blocking note:", cascadeErr);
      }

      // 5. Update UI instantly
      setAllUsers(prev => prev.filter(u => u.uid !== uid));
      setRequests(prev => prev.filter(r => r.uid !== uid));
      setReports(prev => prev.filter(rep => rep.reportedId !== uid));

      toast.success("User Entirely Vanished & Purged from Firestore!");
    } catch (err: unknown) {
      console.error("Purge error:", err);
      const msg = err instanceof Error ? err.message : "Purge failed.";
      toast.error(msg);
    } finally {
      setIsPurging(null);
    }
  };

  const filteredUsers = allUsers.filter(u => {
    const q = searchQuery.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phone?.includes(q) ||
      u.uid?.toLowerCase().includes(q)
    );
  });

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
        
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
           <div>
              <span className="px-4 py-1.5 bg-black text-white text-[8px] font-black uppercase tracking-[0.3em] rounded-full mb-4 inline-block">System Administrator</span>
              <h1 className="text-6xl font-black italic tracking-tighter uppercase text-black">Control Center.</h1>
           </div>
           <div className="flex gap-4">
              <StatCard label="Total Registered" value={allUsers.length} />
              <StatCard label="Pending Deletions" value={requests.length} />
              <StatCard label="Active Reports" value={reports.length} />
           </div>
        </header>

        {/* Tab Navigation */}
        <div className="flex gap-3 mb-8 border-b border-gray-200 pb-4">
          <button
            onClick={() => setActiveTab("users")}
            className={`px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === "users" ? "bg-black text-white" : "bg-white text-gray-400 hover:text-black"}`}
          >
            <Users size={16} /> All Registered Users ({allUsers.length})
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={`px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === "requests" ? "bg-black text-white" : "bg-white text-gray-400 hover:text-black"}`}
          >
            <Trash2 size={16} /> Deletion Requests ({requests.length})
          </button>
          <button
            onClick={() => setActiveTab("reports")}
            className={`px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === "reports" ? "bg-black text-white" : "bg-white text-gray-400 hover:text-black"}`}
          >
            <Flag size={16} /> Reports ({reports.length})
          </button>
        </div>

        {/* Tab Content: All Users */}
        {activeTab === "users" && (
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, email, phone, or UID..."
                  className="w-full pl-14 pr-6 py-4 bg-white border border-gray-200 rounded-full font-bold text-sm focus:outline-none focus:border-black shadow-sm"
                />
              </div>
              <button
                onClick={fetchAllUsers}
                disabled={isLoadingUsers}
                className="px-6 py-4 bg-white border border-gray-200 rounded-full font-black text-xs uppercase tracking-widest hover:border-black flex items-center gap-2 shadow-sm"
              >
                <RefreshCw size={14} className={isLoadingUsers ? "animate-spin" : ""} /> Refresh List
              </button>
            </div>

            {filteredUsers.length === 0 ? (
              <div className="p-16 bg-white rounded-[2.5rem] border-2 border-dashed border-gray-200 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">
                {allUsers.length === 0 ? "No registered users in Firestore yet." : "No users matched your search query."}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredUsers.map((u) => (
                  <div key={u.uid} className="p-6 bg-white rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between hover:border-black transition-all">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-14 h-14 rounded-2xl bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center font-black">
                        {u.photoURL ? (
                          <img src={u.photoURL} alt={u.name} className="w-full h-full object-cover" />
                        ) : (
                          <User size={24} className="text-gray-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-black italic uppercase tracking-tight text-base truncate">{u.name || "Unnamed"} ({u.age || "—"})</h3>
                        <p className="text-xs text-gray-500 font-medium truncate">{u.email}</p>
                        <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">{u.phone || "No Phone"} • {u.district || "Kerala"}</p>
                      </div>
                    </div>
                    <button
                      disabled={isPurging === u.uid}
                      onClick={() => handlePurgeUser(u.uid)}
                      className="ml-4 p-4 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-2xl transition-all shadow-sm shrink-0 disabled:opacity-50"
                      title="Permanently erase user and all records"
                    >
                      {isPurging === u.uid ? "Purging..." : <Trash2 size={18} />}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Tab Content: Deletion Requests */}
        {activeTab === "requests" && (
          <section className="space-y-6">
            {requests.length === 0 ? (
              <div className="p-16 bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-gray-300 italic font-medium">
                 All clear. No pending deletion requests.
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
                              <Clock size={10} /> Requested {req.timestamp?.seconds ? new Date(req.timestamp.seconds * 1000).toLocaleDateString() : "Recently"}
                           </p>
                           <p className="text-[10px] font-mono text-gray-300">UID: {req.uid}</p>
                        </div>
                     </div>
                     <button 
                       disabled={isPurging === req.uid}
                       onClick={() => handlePurgeUser(req.uid, req.id)}
                       className="px-6 py-4 bg-red-600 text-white rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg font-black uppercase text-[10px] tracking-widest flex items-center gap-2 disabled:opacity-50"
                     >
                       {isPurging === req.uid ? "Purging..." : <><Trash2 size={16} /> Permanently Wipe User</>}
                     </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Tab Content: User Reports */}
        {activeTab === "reports" && (
          <section className="space-y-6">
            {reports.length === 0 ? (
              <div className="p-16 bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-gray-300 italic font-medium">
                 No active user reports.
              </div>
            ) : (
              <div className="space-y-4">
                {reports.map(rep => (
                  <div key={rep.id} className="p-8 bg-white rounded-[2.5rem] shadow-sm border border-gray-100 group hover:border-orange-500 transition-all">
                     <div className="flex items-center justify-between mb-4">
                        <span className="px-3 py-1 bg-orange-100 text-orange-600 text-[8px] font-black uppercase tracking-widest rounded-full">Reported</span>
                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{rep.timestamp?.seconds ? new Date(rep.timestamp.seconds * 1000).toLocaleDateString() : "Recent"}</span>
                     </div>
                     <p className="text-gray-600 font-medium leading-relaxed mb-6 italic">&quot;{rep.reason}&quot;</p>
                     <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 font-mono">Target: {rep.reportedId}</span>
                        <button 
                          onClick={() => handlePurgeUser(rep.reportedId, rep.id)}
                          className="px-5 py-3 bg-red-500 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all flex items-center gap-2"
                        >
                          <AlertTriangle size={14} /> Purge Reported User
                        </button>
                     </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string, value: number }) {
  return (
    <div className="px-8 py-5 bg-white rounded-[2rem] border border-gray-100 shadow-sm flex flex-col items-center justify-center">
       <span className="text-2xl font-black italic tracking-tighter text-black mb-1">{value}</span>
       <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">{label}</span>
    </div>
  );
}
