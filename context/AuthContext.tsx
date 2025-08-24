"use client";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "@/lib/api";

type User = {
  id?: string;
  _id?: string;
  name?: string;
  email?: string;
  address?: string;
  phone?: string;
} | null;

type AuthCtx = {
  user: User;
  setUser: (u: User) => void;
  cartCount: number;
  setCartCount: React.Dispatch<React.SetStateAction<number>>;
  isLoading: boolean;
  login: (p: { email: string; password: string; rememberMe?: boolean }) => Promise<void>;
  signup: (p: { name: string; email: string; password: string; confirmPassword: string; address: string; phone: string }) => Promise<void>;
  logout: () => void;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [cartCount, setCartCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const persistToken = (token: string) => {
    localStorage.setItem("userToken", token);
    localStorage.setItem("token", token);
    document.cookie = `userToken=${token}; Path=/; Max-Age=86400; SameSite=Lax`;
    document.cookie = `token=${token}; Path=/; Max-Age=86400; SameSite=Lax`;
  };

  const clearToken = () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    document.cookie = "userToken=; Path=/; Max-Age=0; SameSite=Lax";
    document.cookie = "token=; Path=/; Max-Age=0; SameSite=Lax";
  };

  useEffect(() => {
    const token =
      typeof window !== "undefined" &&
      (localStorage.getItem("userToken") || localStorage.getItem("token"));

    if (!token) {
      setIsLoading(false);
      return;
    }

    (async () => {
      try {
        try {
          const me = await api.user.me();
          if (me) setUser(me);
        } catch {
          const raw = localStorage.getItem("user");
          if (raw) setUser(JSON.parse(raw));
        }
        try {
          const landing = await api.user.getLandingData();
          const cc = landing?.data?.cartCount ?? (landing as any)?.cartCount ?? 0;
          setCartCount(cc);
        } catch {}
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login: AuthCtx["login"] = async ({ email, password }) => {
    const data = await api.user.login({ email, password }); 
    persistToken(data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
    setCartCount(0);
  };

  const signup: AuthCtx["signup"] = async (payload) => {
    const data = await api.user.signup(payload); 
    persistToken(data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
    setCartCount(0);
  };

  const logout = () => {
    clearToken();
    setUser(null);
    setCartCount(0);
    api.user.logout().catch(() => {});
  };

  const value = useMemo(
    () => ({ user, setUser, cartCount, setCartCount, isLoading, login, signup, logout }),
    [user, cartCount, isLoading]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
