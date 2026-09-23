"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { animate } from "animejs";
import { 
  Send, ArrowLeft, User, Loader2, Trash2, Edit2, X, 
  Check, CheckCheck, ShieldAlert, Mic, Square, Play, Pause, Volume2, Sparkles 
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { 
  collection, query, orderBy, onSnapshot, addDoc, 
  serverTimestamp, doc, getDoc, updateDoc, deleteDoc, setDoc, writeBatch 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter, useParams } from "next/navigation";
import toast from "react-hot-toast";
import { sanitizeMessage } from "@/lib/contentFilter";
import VerifiedBadge from "@/components/VerifiedBadge";
import { validateMessage } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rateLimit";
import { showLocalNotification } from "@/lib/notifications";

export default function ChatPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const matchId = params.matchId as string;
  
  const [messages, setMessages] = useState<any[]>([]);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [editingMessage, setEditingMessage] = useState<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [isOtherTyping, setIsOtherTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Format message time
  const formatTime = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // 1. Fetch Match & Other User Info + Real-Time Typing Listener
  useEffect(() => {
    if (loading === false && !user) router.push("/login");

    const fetchMatchInfo = async () => {
      try {
        const matchSnap = await getDoc(doc(db, "matches", matchId));
        if (matchSnap.exists()) {
          const data = matchSnap.data();
          const otherId = data.users.find((id: string) => id !== user?.uid);
          if (otherId) {
            const userSnap = await getDoc(doc(db, "users", otherId));
            if (userSnap.exists()) setOtherUser({ ...userSnap.data(), uid: otherId });
          }
        }
      } catch (err) {
        toast.error("Could not load chat info");
      }
    };

    if (loading === false && user) fetchMatchInfo();

    // Listen to match doc for typing status & real-time updates
    const matchUnsub = onSnapshot(doc(db, "matches", matchId), (snap) => {
      if (snap.exists() && user) {
        const matchData = snap.data();
        const otherId = matchData.users?.find((id: string) => id !== user.uid);
        if (otherId && matchData.typing) {
          setIsOtherTyping(Boolean(matchData.typing[otherId]));
        }
      }
    });

    // 2. Real-Time Messages & Read Receipts Listener
    if (user && matchId) {
      const messagesRef = collection(db, "matches", matchId, "messages");
      const q = query(messagesRef, orderBy("timestamp", "asc"));
      const messagesUnsub = onSnapshot(q, async (snapshot) => {
        const fetchedMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMessages(fetchedMessages);
        scrollToBottom();

        // Automatically Mark Incoming Unread Messages as Read
        const unreadDocs = snapshot.docs.filter(
          doc => doc.data().senderId !== user.uid && !doc.data().read
        );

        if (unreadDocs.length > 0) {
          // If browser tab is in background, show web push notification
          if (typeof document !== "undefined" && document.hidden) {
            const latestUnread = unreadDocs[unreadDocs.length - 1].data();
            showLocalNotification(otherUser?.name || "New Message", {
              body: latestUnread.type === "voice" ? "🎙️ Sent you a voice note" : (latestUnread.text || "Sent you a message"),
              url: `/chat/${matchId}`
            });
          }

          const batch = writeBatch(db);
          unreadDocs.forEach(docSnap => {
            batch.update(docSnap.ref, { read: true, readAt: serverTimestamp() });
          });
          try {
            await batch.commit();
          } catch (e) {
            console.error("Read receipt batch update error:", e);
          }
        }
      });

      return () => {
        matchUnsub();
        messagesUnsub();
      };
    }

    return () => matchUnsub();
  }, [user, loading, matchId, router]);

  const scrollToBottom = () => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  // 3. Handle Typing Indicator with Debounce
  const handleTyping = (text: string) => {
    setNewMessage(text);
    if (!user || !matchId) return;

    // Send typing: true
    updateDoc(doc(db, "matches", matchId), {
      [`typing.${user.uid}`]: true
    }).catch(() => {});

    // Clear existing timeout
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    // Reset typing status after 1.8s of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      updateDoc(doc(db, "matches", matchId), {
        [`typing.${user.uid}`]: false
      }).catch(() => {});
    }, 1800);
  };

  const clearTypingStatus = () => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (user && matchId) {
      updateDoc(doc(db, "matches", matchId), {
        [`typing.${user.uid}`]: false
      }).catch(() => {});
    }
  };

  // Voice Note Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/ogg; codecs=opus" });
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          await sendVoiceNote(base64Audio);
        };
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      toast.error("Microphone access denied");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
      mediaRecorder.stream.getTracks().forEach((track: any) => track.stop());
    }
  };

  const sendVoiceNote = async (audioData: string) => {
    if (!user || isSending) return;
    setIsSending(true);
    try {
      const messagesRef = collection(db, "matches", matchId, "messages");
      await addDoc(messagesRef, { 
        senderId: user.uid, 
        type: "voice", 
        audioURL: audioData, 
        read: false,
        timestamp: serverTimestamp() 
      });
      await updateDoc(doc(db, "matches", matchId), { 
        lastMessage: "🎙️ Voice Note", 
        timestamp: serverTimestamp() 
      });
    } catch (err) {
      toast.error("Failed to send voice note");
    } finally {
      setIsSending(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isSending) return;

    // Validate message length and content
    const msgValidation = validateMessage(newMessage);
    if (!msgValidation.valid) {
      toast.error(msgValidation.error || "Please enter a message");
      return;
    }

    // Rate limit check: max 30 messages/minute
    const rateCheck = await checkRateLimit(`chat:${user.uid}`, 30, 60);
    if (!rateCheck.success) {
      toast.error(`Slow down! Too many messages. Please wait ${rateCheck.resetSeconds}s.`, { icon: "⏳" });
      return;
    }

    // Apply Smart Content Filter
    const { cleanText, isToxic, hasLinks } = sanitizeMessage(msgValidation.cleanText);

    if (isToxic) {
      toast("Inappropriate keywords were sanitized for safety.", { icon: "🛡️" });
    }

    if (hasLinks && !confirm("This message contains external links. Are you sure you want to send it?")) {
      return;
    }

    if (editingMessage) {
      await handleUpdateMessage(cleanText);
      return;
    }

    setIsSending(true);
    setNewMessage("");
    clearTypingStatus();

    try {
      const messagesRef = collection(db, "matches", matchId, "messages");
      await addDoc(messagesRef, { 
        senderId: user.uid, 
        type: "text", 
        text: cleanText, 
        read: false,
        timestamp: serverTimestamp() 
      });
      await updateDoc(doc(db, "matches", matchId), { 
        lastMessage: cleanText, 
        timestamp: serverTimestamp() 
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const handleUpdateMessage = async (filteredText: string) => {
    try {
      const msgRef = doc(db, "matches", matchId, "messages", editingMessage.id);
      await updateDoc(msgRef, { text: filteredText, edited: true });
      setEditingMessage(null);
      setNewMessage("");
      toast.success("Message updated");
    } catch (err) {
      toast.error("Failed to update");
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (!confirm("Delete this message?")) return;
    try {
      await deleteDoc(doc(db, "matches", matchId, "messages", msgId));
      toast.success("Message deleted");
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  const handleBlockUser = async () => {
    if (!confirm(`Block ${otherUser.name}? This will end the match permanently.`)) return;
    try {
      const blockId = `${user?.uid}_${otherUser.uid}`;
      await setDoc(doc(db, "blocks", blockId), {
        blocker: user?.uid,
        blocked: otherUser.uid,
        timestamp: serverTimestamp()
      });
      await deleteDoc(doc(db, "matches", matchId));
      toast.success("User blocked");
      router.push("/matches");
    } catch (err) {
      toast.error("Failed to block user");
    }
  };

  const handleDeleteChat = async () => {
    if (!confirm("Permanently delete this chat?")) return;
    try {
      await deleteDoc(doc(db, "matches", matchId));
      toast.success("Chat deleted");
      router.push("/matches");
    } catch (err) {
      toast.error("Failed to delete chat");
    }
  };

  if (loading || !otherUser) return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black font-black italic text-3xl text-black dark:text-white">Datie.</div>
  );

  return (
    <main className="h-screen bg-white dark:bg-neutral-950 text-black dark:text-white flex flex-col pt-24 overflow-hidden transition-colors duration-300">
      {/* Header */}
      <div className="p-6 border-b-2 border-gray-100 dark:border-neutral-800 flex items-center justify-between bg-white dark:bg-neutral-900 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-50 dark:hover:bg-neutral-800 rounded-full transition-all text-black dark:text-white">
            <ArrowLeft size={24} />
          </button>
          <div 
            onClick={() => router.push(`/profile/${otherUser.uid}`)}
            className="w-12 h-12 rounded-full border-2 border-black dark:border-neutral-700 overflow-hidden bg-gray-100 dark:bg-neutral-800 shrink-0 cursor-pointer hover:scale-110 transition-all active:scale-95 shadow-md relative"
          >
             {otherUser.photoURL ? <img src={otherUser.photoURL} className="w-full h-full object-cover" /> : <User size={24} className="m-auto mt-2 text-gray-300 dark:text-neutral-600" />}
          </div>
          <div 
            onClick={() => router.push(`/profile/${otherUser.uid}`)}
            className="cursor-pointer group"
          >
            <div className="flex items-center gap-1.5">
              <h2 className="font-black italic uppercase tracking-tighter text-lg leading-tight group-hover:text-gray-500 dark:group-hover:text-neutral-400 text-black dark:text-white transition-colors">{otherUser.name}</h2>
              <VerifiedBadge isVerified={otherUser.photoVerified} size="sm" />
            </div>
            <div className="flex items-center gap-1.5">
               {isOtherTyping ? (
                 <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 animate-pulse flex items-center gap-1">
                   Typing...
                 </span>
               ) : (
                 <>
                   <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-neutral-500">View Profile</span>
                 </>
               )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleDeleteChat} className="p-3 text-gray-400 dark:text-neutral-500 hover:bg-gray-50 dark:hover:bg-neutral-800 hover:text-black dark:hover:text-white rounded-2xl flex items-center gap-2 font-black text-[10px] uppercase tracking-widest transition-all">
             <Trash2 size={18} /> Delete Chat
          </button>
          <button onClick={handleBlockUser} className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-2xl flex items-center gap-2 font-black text-[10px] uppercase tracking-widest transition-all">
             <ShieldAlert size={18} /> Block
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar bg-gray-50/20 dark:bg-black/40">
        {messages.map((msg: any) => {
          const isMe = msg.senderId === user?.uid;
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className="relative group max-w-[80%]">
                <div className={`p-4 rounded-[2rem] text-sm font-medium shadow-sm transition-all ${
                  isMe 
                    ? "bg-black dark:bg-white text-white dark:text-black rounded-br-none" 
                    : "bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 text-black dark:text-white rounded-bl-none"
                }`}>
                  {msg.type === "voice" ? (
                    <VoicePlayer url={msg.audioURL} isMe={isMe} />
                  ) : (
                    msg.text
                  )}

                  {/* Message Meta: Time, Edited status, and Read Receipts */}
                  <div className={`flex items-center gap-1.5 justify-end mt-1 text-[9px] font-black uppercase ${
                    isMe ? "text-white/60 dark:text-black/60" : "text-gray-400 dark:text-neutral-500"
                  }`}>
                    {msg.edited && <span className="italic">Edited • </span>}
                    <span>{formatTime(msg.timestamp)}</span>
                    
                    {/* Read Receipts Checkmarks (For Outgoing Messages) */}
                    {isMe && (
                      <span title={msg.read ? "Read by " + otherUser.name : "Delivered"}>
                        {msg.read ? (
                          <CheckCheck size={13} className="text-cyan-400 dark:text-blue-600 stroke-[2.5]" />
                        ) : (
                          <Check size={13} className="text-white/40 dark:text-black/40 stroke-[2]" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
                
                {isMe && msg.type !== "voice" && (
                  <div className="absolute top-0 -left-12 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => { setEditingMessage(msg); setNewMessage(msg.text); }} className="p-2 bg-white dark:bg-neutral-800 border border-black/5 dark:border-neutral-700 text-black dark:text-white rounded-full shadow-lg hover:scale-110"><Edit2 size={12} /></button>
                    <button onClick={() => handleDeleteMessage(msg.id)} className="p-2 bg-white dark:bg-neutral-800 border border-black/5 dark:border-neutral-700 rounded-full shadow-lg hover:scale-110 text-red-500"><Trash2 size={12} /></button>
                  </div>
                )}
                {isMe && msg.type === "voice" && (
                  <div className="absolute top-0 -left-8 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => handleDeleteMessage(msg.id)} className="p-2 bg-white dark:bg-neutral-800 border border-black/5 dark:border-neutral-700 rounded-full shadow-lg hover:scale-110 text-red-500"><Trash2 size={12} /></button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Live Typing Bouncing Bubble */}
        {isOtherTyping && (
          <div className="flex justify-start animate-fade-in">
            <div className="px-5 py-3 rounded-[2rem] rounded-bl-none bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 text-black dark:text-white shadow-md flex items-center gap-2">
              <span className="text-xs font-bold italic">{otherUser.name} is typing</span>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-black dark:bg-white animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-1.5 h-1.5 rounded-full bg-black dark:bg-white animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-1.5 h-1.5 rounded-full bg-black dark:bg-white animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Tray */}
      <div className="p-6 bg-white dark:bg-neutral-900 border-t-2 border-gray-100 dark:border-neutral-800">
        <div className="flex items-center gap-4 max-w-5xl mx-auto">
          {editingMessage ? (
            <button type="button" onClick={() => { setEditingMessage(null); setNewMessage(""); }} className="p-4 bg-red-50 dark:bg-red-950/40 text-red-500 rounded-2xl"><X size={20} /></button>
          ) : isRecording ? (
             <div className="flex-1 flex items-center gap-4 p-4 bg-red-50 dark:bg-red-950/40 rounded-[2rem] text-red-500 font-black uppercase text-[10px] tracking-[0.2em] animate-pulse">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                Recording Voice Note...
             </div>
          ) : (
            <input 
              type="text" 
              value={newMessage}
              onChange={(e) => handleTyping(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(e as any)}
              placeholder={`Message ${otherUser?.name || '...'}`}
              className="flex-1 p-5 bg-gray-50 dark:bg-neutral-800 border-2 border-transparent focus:border-black dark:focus:border-neutral-500 text-black dark:text-white rounded-[2rem] font-bold text-sm focus:outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-neutral-500 shadow-inner"
            />
          )}

          <div className="flex items-center gap-2">
            {!newMessage.trim() && !editingMessage && (
              <button 
                onClick={isRecording ? stopRecording : startRecording}
                className={`p-5 rounded-2xl transition-all shadow-xl ${isRecording ? "bg-red-500 text-white animate-pulse" : "bg-gray-100 dark:bg-neutral-800 text-black dark:text-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black"}`}
              >
                {isRecording ? <Square size={24} /> : <Mic size={24} />}
              </button>
            )}
            
            {(newMessage.trim() || editingMessage) && (
              <button onClick={handleSendMessage} disabled={isSending} className="p-5 bg-black dark:bg-white text-white dark:text-black rounded-2xl disabled:opacity-20 hover:scale-105 transition-all shadow-xl">
                {editingMessage ? <Check size={24} /> : <Send size={24} />}
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function VoicePlayer({ url, isMe }: { url: string; isMe: boolean }) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const toggle = () => {
    if (playing) {
      audioRef.current?.pause();
    } else {
      audioRef.current?.play();
    }
    setPlaying(!playing);
  };

  return (
    <div className="flex items-center gap-4 min-w-[150px] py-1">
      <audio ref={audioRef} src={url} onEnded={() => setPlaying(false)} className="hidden" />
      <button onClick={toggle} className={`p-3 rounded-full transition-all ${isMe ? "bg-white dark:bg-black text-black dark:text-white" : "bg-black dark:bg-white text-white dark:text-black"}`}>
        {playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
      </button>
      <div className="flex-1 h-8 flex items-center gap-1">
         {[...Array(12)].map((_, i) => (
           <div key={i} className={`flex-1 rounded-full ${isMe ? "bg-white/40 dark:bg-black/30" : "bg-black/20 dark:bg-white/30"}`} style={{ height: `${Math.random() * 100}%`, minHeight: '20%' }} />
         ))}
      </div>
      <Volume2 size={14} className={isMe ? "text-white/60 dark:text-black/60" : "text-black/40 dark:text-white/60"} />
    </div>
  );
}


