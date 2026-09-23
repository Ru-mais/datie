"use client";

import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { app, db } from "@/lib/firebase";
import toast from "react-hot-toast";

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

export async function requestNotificationPermission(userId?: string): Promise<{ granted: boolean; token?: string }> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    toast.error("Push notifications are not supported in this browser");
    return { granted: false };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      toast.error("Notification permission denied");
      return { granted: false };
    }

    const supported = await isSupported();
    if (!supported) {
      toast.success("Notifications enabled (browser native mode)");
      return { granted: true };
    }

    const messaging = getMessaging(app);
    let currentToken: string | null = null;

    try {
      currentToken = await getToken(messaging, {
        vapidKey: VAPID_KEY || undefined,
      });
    } catch (tokenErr) {
      console.warn("FCM getToken note (using native push if VAPID not configured):", tokenErr);
    }

    if (userId) {
      const userRef = doc(db, "users", userId);
      const updateData: any = {
        notificationsEnabled: true,
        notificationsUpdatedAt: new Date().toISOString()
      };
      if (currentToken) {
        updateData.fcmTokens = arrayUnion(currentToken);
        updateData.fcmToken = currentToken;
      }
      await updateDoc(userRef, updateData).catch(() => {});
    }

    toast.success("Push notifications enabled!");
    return { granted: true, token: currentToken || undefined };
  } catch (error) {
    console.error("Error requesting notifications:", error);
    toast.error("Could not enable notifications");
    return { granted: false };
  }
}

export function subscribeToForegroundNotifications(onReceive?: (payload: any) => void) {
  if (typeof window === "undefined") return () => {};

  let unsubscribe = () => {};

  isSupported().then((supported) => {
    if (supported) {
      try {
        const messaging = getMessaging(app);
        unsubscribe = onMessage(messaging, (payload) => {
          console.log("Foreground FCM notification received:", payload);
          if (onReceive) {
            onReceive(payload);
          } else {
            const title = payload.notification?.title || "New Notification";
            const body = payload.notification?.body || "You have a new activity on Datie.";
            toast(`${title}: ${body}`, { icon: "✨", duration: 4000 });
          }
        });
      } catch (err) {
        console.warn("Could not attach FCM foreground listener:", err);
      }
    }
  });

  return () => {
    unsubscribe();
  };
}

export function showLocalNotification(title: string, options?: NotificationOptions & { url?: string }) {
  if (typeof window === "undefined" || !("Notification" in window)) return;

  if (Notification.permission === "granted") {
    try {
      if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification(title, {
            icon: "/icon-192.png",
            badge: "/icon-192.png",
            vibrate: [100, 50, 100],
            data: { url: options?.url || "/matches" },
            ...options,
          } as any);
        });
      } else {
        new Notification(title, {
          icon: "/icon-192.png",
          ...options,
        });
      }
    } catch (e) {
      console.warn("Local notification display error:", e);
    }
  }
}
