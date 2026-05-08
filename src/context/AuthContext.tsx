"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface User {
  _id: string;
  name: string;
  email: string;
  district: string;
  isPremium: boolean;
  images: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const api = axios.create({
    baseURL: 'http://localhost:5000/api/v1',
    withCredentials: true,
  });

  const checkAuth = async () => {
    try {
      // Assuming we have a /auth/me or similar endpoint, or just check cookies
      // For now, let's mock it or just set loading false
      setLoading(false);
    } catch (err) {
      setUser(null);
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      setUser(data.data.user);
      toast.success('Welcome back to MalluLove!');
      router.push('/discover');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed');
      throw err;
    }
  };

  const logout = async () => {
    try {
      await api.get('/auth/logout');
      setUser(null);
      router.push('/login');
      toast.success('Logged out successfully');
    } catch (err) {
      toast.error('Logout failed');
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
