"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { 
  onAuthStateChanged, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  sendEmailVerification
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import toast from "react-hot-toast";

interface UserProfile {
  uid: string;
  name: string;
  email: string;
  age?: number;
  district?: string;
  phone?: string;
  phoneVerified?: boolean;
  photoURL?: string;
  bio?: string;
  interests?: string[];
  languages?: string[];
  gender?: string;
  lookingFor?: string;
  profession?: string;
  education?: string;
  religion?: string;
  height?: string;
  vibe?: string[];
}

interface CustomUser {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  emailVerified: boolean;
}

interface AuthContextType {
  user: CustomUser | null;
  profile: UserProfile | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signupWithEmail: (email: string, pass: string, name: string, extra: Partial<UserProfile>) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  logout: () => Promise<void>;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CustomUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch profile from Firestore
        try {
          const profileDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (profileDoc.exists()) {
            const customUser: CustomUser = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || "",
              displayName: firebaseUser.displayName || undefined,
              photoURL: firebaseUser.photoURL || undefined,
              emailVerified: firebaseUser.emailVerified
            };
            setUser(customUser);
            setProfile(profileDoc.data() as UserProfile);
          } else {
            // Profile document does not exist (account purged). Auto log out.
            await signOut(auth);
            setUser(null);
            setProfile(null);
          }
        } catch (error) {
          console.error("Failed to fetch user profile:", error);
          setUser(null);
          setProfile(null);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    toast.error("Google Sign-In is not currently enabled.");
  };

  const loginWithEmail = async (email: string, pass: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    const profileDoc = await getDoc(doc(db, "users", cred.user.uid));
    if (!profileDoc.exists()) {
      await signOut(auth);
      throw new Error("This account does not exist or has been permanently deleted.");
    }
    setProfile(profileDoc.data() as UserProfile);
  };

  const signupWithEmail = async (email: string, pass: string, name: string, extra: Partial<UserProfile>) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const user = userCredential.user;
    
    // Create the profile in Firestore
    const userProfile: UserProfile = {
      uid: user.uid,
      name,
      email: user.email || email,
      phoneVerified: true, // matching original behaviour
      ...extra
    };
    
    await setDoc(doc(db, "users", user.uid), userProfile);
    
    // Reserve the phone number
    if (extra.phone) {
      await setDoc(doc(db, "used_phones", extra.phone), { uid: user.uid });
    }

    // Send email verification
    try {
      await sendEmailVerification(user);
    } catch (err) {
      console.error("Failed to send verification email", err);
    }

    setProfile(userProfile);
  };

  const resendVerificationEmail = async () => {
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        toast.success("Verification email resent! Please check your inbox.");
      } else {
        toast.error("Please sign in first to receive a verification email.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to resend verification email";
      toast.error(msg);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      toast.success("Successfully logged out.");
    } catch (e) {
      console.error("Logout request failed:", e);
      toast.error("Failed to log out.");
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, loginWithGoogle, loginWithEmail, signupWithEmail, resendVerificationEmail, logout, setProfile }}>
      {loading ? (
        <div className="min-h-screen flex items-center justify-center bg-white font-black italic text-3xl text-black animate-pulse">
          Datie.
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
