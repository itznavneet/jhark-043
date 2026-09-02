"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  changePassword,
  login,
  logout,
  refresh,
  type LoginAccountType,
  type PublicUser,
} from "./api";

interface AuthContextValue {
  accessToken: string | null;
  user: PublicUser | null;
  loading: boolean;
  signIn(
    email: string,
    password: string,
    accountType: LoginAccountType,
  ): Promise<PublicUser>;
  signOut(): Promise<void>;
  changePassword(
    currentPassword: string,
    newPassword: string,
  ): Promise<PublicUser>;
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
      async signIn(email, password, accountType) {
        const payload = await login(email, password, accountType);
        setAccessToken(payload.accessToken);
        setUser(payload.user);
        return payload.user;
      },
      async signOut() {
        await logout().catch(() => undefined);
        setAccessToken(null);
        setUser(null);
      },
      async changePassword(currentPassword, newPassword) {
        if (!accessToken) throw new Error("Authentication is required");
        const updatedUser = await changePassword(
          currentPassword,
          newPassword,
          accessToken,
        );
        setUser(updatedUser);
        return updatedUser;
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
