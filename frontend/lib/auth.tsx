"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { login, logout, refresh, type PublicUser } from "./api";

interface AuthContextValue {
  accessToken: string | null;
  user: PublicUser | null;
  loading: boolean;
  signIn(email: string, password: string): Promise<PublicUser>;
  signOut(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    refresh()
      .then((payload) => {
        setAccessToken(payload.accessToken);
        setUser(payload.user);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      accessToken,
      user,
      loading,
      async signIn(email, password) {
        const payload = await login(email, password);
        setAccessToken(payload.accessToken);
        setUser(payload.user);
        return payload.user;
      },
      async signOut() {
        await logout().catch(() => undefined);
        setAccessToken(null);
        setUser(null);
      },
    }),
    [accessToken, loading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
