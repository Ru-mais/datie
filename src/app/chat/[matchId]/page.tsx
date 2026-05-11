"use client";

import { useEffect, useState, useRef } from "react";
import { animate } from "animejs";
import { Send, ArrowLeft, User, Loader2, Trash2, Edit2, X, Check, ShieldAlert, Mic, Square, Play, Pause, Volume2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc, updateDoc, deleteDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter, useParams } from "next/navigation";
import toast from "react-hot-toast";

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (loading === false && !user) router.push("/login");

    const fetchMatchInfo = async () => {
      try {
        const matchSnap = await getDoc(doc(db, "matches", matchId));
        if (matchSnap.exists()) {
          const data = matchSnap.data();
          const otherId = data.users.find((id: string) => id !== user?.uid);
          const userSnap = await getDoc(doc(db, "users", otherId));
          if (userSnap.exists()) setOtherUser({ ...userSnap.data(), uid: otherId });
        }
      } catch (err) {
        toast.error("Could not load chat info");
      }
    };

    if (loading === false && user) fetchMatchInfo();

    if (user && matchId) {
      const messagesRef = collection(db, "matches", matchId, "messages");
      const q = query(messagesRef, orderBy("timestamp", "asc"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMessages(fetchedMessages);
        scrollToBottom();
      });
      return () => unsubscribe();
    }
  }, [user, loading, matchId, router]);

  const scrollToBottom = () => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

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

  const filterMessage = (text: string) => {
    const badWords = ["badword1", "badword2", "toxic", "abuse"];
    let filteredText = text;
    badWords.forEach(word => {
      const regex = new RegExp(word, "gi");
      filteredText = filteredText.replace(regex, "****");
    });
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const hasLinks = urlRegex.test(filteredText);
    return { filteredText, hasLinks };
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || isSending) return;

    const { filteredText, hasLinks } = filterMessage(newMessage);
    if (hasLinks && !confirm("Your message contains a link. Send anyway?")) return;

    if (editingMessage) {
      await handleUpdateMessage(filteredText);
      return;
    }

    setIsSending(true);
    setNewMessage("");
    try {
      const messagesRef = collection(db, "matches", matchId, "messages");
      await addDoc(messagesRef, { 
        senderId: user.uid, 
        type: "text", 
        text: filteredText, 
        timestamp: serverTimestamp() 
      });
      await updateDoc(doc(db, "matches", matchId), { lastMessage: filteredText, timestamp: serverTimestamp() });
    } catch (err) {
      toast.error("Failed to send");
      setNewMessage(filteredText);
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
    <div className="min-h-screen flex items-center justify-center bg-white font-black italic text-3xl text-black">Datie.</div>
  );

  return (
    <main className="h-screen bg-white flex flex-col pt-24 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b-2 border-gray-100 flex items-center justify-between bg-white z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-50 rounded-full transition-all">
            <ArrowLeft size={24} />
          </button>
          <div 
            onClick={() => router.push(`/profile/${otherUser.uid}`)}
            className="w-12 h-12 rounded-full border-2 border-black overflow-hidden bg-gray-100 shrink-0 cursor-pointer hover:scale-110 transition-all active:scale-95 shadow-md"
          >
             {otherUser.photoURL ? <img src={otherUser.photoURL} className="w-full h-full object-cover" /> : <User size={24} className="m-auto mt-2 text-gray-300" />}
          </div>
          <div 
            onClick={() => router.push(`/profile/${otherUser.uid}`)}
            className="cursor-pointer group"
          >
            <h2 className="font-black italic uppercase tracking-tighter text-lg leading-tight group-hover:text-gray-500 transition-colors">{otherUser.name}</h2>
            <div className="flex items-center gap-1.5">
               <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
               <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">View Profile</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleDeleteChat} className="p-3 text-gray-400 hover:bg-gray-50 hover:text-black rounded-2xl flex items-center gap-2 font-black text-[10px] uppercase tracking-widest transition-all">
             <Trash2 size={18} /> Delete Chat
          </button>
          <button onClick={handleBlockUser} className="p-3 text-red-500 hover:bg-red-50 rounded-2xl flex items-center gap-2 font-black text-[10px] uppercase tracking-widest transition-all">
             <ShieldAlert size={18} /> Block
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar bg-gray-50/20">
        {messages.map((msg: any) => {
          const isMe = msg.senderId === user?.uid;
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className="relative group max-w-[80%]">
                <div className={`p-4 rounded-[2rem] text-sm font-medium shadow-sm transition-all ${
                  isMe ? "bg-black text-white rounded-br-none" : "bg-white border-2 border-black text-black rounded-bl-none"
                }`}>
                  {msg.type === "voice" ? (
                    <VoicePlayer url={msg.audioURL} isMe={isMe} />
                  ) : (
                    msg.text
                  )}
                  {msg.edited && <span className="block text-[8px] opacity-40 mt-1 uppercase font-black italic">Edited</span>}
                </div>
                
                {isMe && msg.type !== "voice" && (
                  <div className="absolute top-0 -left-12 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => { setEditingMessage(msg); setNewMessage(msg.text); }} className="p-2 bg-white border border-black/5 rounded-full shadow-lg hover:scale-110"><Edit2 size={12} /></button>
                    <button onClick={() => handleDeleteMessage(msg.id)} className="p-2 bg-white border border-black/5 rounded-full shadow-lg hover:scale-110 text-red-500"><Trash2 size={12} /></button>
                  </div>
                )}
                {isMe && msg.type === "voice" && (
                  <div className="absolute top-0 -left-8 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => handleDeleteMessage(msg.id)} className="p-2 bg-white border border-black/5 rounded-full shadow-lg hover:scale-110 text-red-500"><Trash2 size={12} /></button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-6 bg-white border-t-2 border-gray-100">
        <div className="flex items-center gap-4 max-w-5xl mx-auto">
          {editingMessage ? (
            <button type="button" onClick={() => { setEditingMessage(null); setNewMessage(""); }} className="p-4 bg-red-50 text-red-500 rounded-2xl"><X size={20} /></button>
          ) : isRecording ? (
             <div className="flex-1 flex items-center gap-4 p-4 bg-red-50 rounded-[2rem] text-red-500 font-black uppercase text-[10px] tracking-[0.2em] animate-pulse">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                Recording Voice Note...
             </div>
          ) : (
            <input 
              type="text" 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(e as any)}
              placeholder="Type your message..."
              className="flex-1 p-5 bg-gray-50 border-2 border-transparent focus:border-black rounded-[2rem] font-bold text-sm focus:outline-none transition-all"
            />
          )}

          <div className="flex items-center gap-2">
            {!newMessage.trim() && !editingMessage && (
              <button 
                onClick={isRecording ? stopRecording : startRecording}
                className={`p-5 rounded-2xl transition-all shadow-xl ${isRecording ? "bg-red-500 text-white animate-pulse" : "bg-gray-100 text-black hover:bg-black hover:text-white"}`}
              >
                {isRecording ? <Square size={24} /> : <Mic size={24} />}
              </button>
            )}
            
            {(newMessage.trim() || editingMessage) && (
              <button onClick={handleSendMessage} disabled={isSending} className="p-5 bg-black text-white rounded-2xl disabled:opacity-20 hover:scale-105 transition-all shadow-xl">
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
      <button onClick={toggle} className={`p-3 rounded-full transition-all ${isMe ? "bg-white text-black" : "bg-black text-white"}`}>
        {playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
      </button>
      <div className="flex-1 h-8 flex items-center gap-1">
         {[...Array(12)].map((_, i) => (
           <div key={i} className={`flex-1 rounded-full ${isMe ? "bg-white/30" : "bg-black/10"}`} style={{ height: `${Math.random() * 100}%`, minHeight: '20%' }} />
         ))}
      </div>
      <Volume2 size={14} className={isMe ? "text-white/40" : "text-black/20"} />
    </div>
  );
}

