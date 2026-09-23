"use client";

import { useEffect, useState } from "react";
import { Download, X, Smartphone, Share, PlusSquare } from "lucide-react";

export default function PWAHandler() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => console.log("Datie. PWA Service Worker Registered"))
        .catch((err) => console.log("SW Registration Error:", err));
    }

    // 2. Check if already running in standalone mode (installed app)
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone;
    if (isStandalone) return;

    // 3. Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // 4. Capture Chrome / Android install prompt
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show prompt after a short delay if not dismissed previously in this session
      const dismissed = sessionStorage.getItem("pwa_dismissed");
      if (!dismissed) {
        setTimeout(() => setShowPrompt(true), 3000);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem("pwa_dismissed", "true");
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-6 left-6 right-6 sm:left-auto sm:right-6 sm:max-w-sm z-[250] animate-slide-up">
      <div className="bg-black dark:bg-neutral-900 text-white p-5 rounded-[2rem] border-2 border-white/20 dark:border-neutral-700 shadow-2xl relative">
        <button 
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center shrink-0 shadow-lg">
            <Smartphone size={24} />
          </div>
          <div className="flex-1 pr-4">
            <h4 className="font-black uppercase tracking-tight text-sm">Install Datie. App</h4>
            <p className="text-white/70 text-xs font-medium mt-0.5 leading-relaxed">
              Get fullscreen swiping, instant haptics & background notifications.
            </p>
          </div>
        </div>

        {isIOS ? (
          <div className="mt-4 p-3 bg-white/10 rounded-xl text-[11px] text-white/90 flex items-center gap-2">
            <span>Tap</span>
            <Share size={14} className="text-blue-400" />
            <span>then select</span>
            <strong className="text-white">"Add to Home Screen"</strong>
            <PlusSquare size={14} />
          </div>
        ) : (
          <button
            onClick={handleInstall}
            className="mt-4 w-full py-3 bg-white text-black font-black uppercase text-xs tracking-widest rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2"
          >
            <Download size={14} /> Add to Home Screen
          </button>
        )}
      </div>
    </div>
  );
}
