"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { getProfile, registerAccount } from "@/lib/api";
import {
  clearAuthIssued,
  isAuthExpired,
  markAuthIssued,
} from "@/lib/auth/lifetime";
import { authErrorMessage } from "@/lib/auth/messages";
import { adoptUserDesk, clearUserSessionKeys } from "@/lib/investigation/session";
import { createBrowserSupabase } from "@/lib/supabase/client";
import type { ApiProfile } from "@/types/api";

type AuthContextValue = {
  user: User | null;
  profile: ApiProfile | null;
  profileError: string | null;
  ready: boolean;
  profileReady: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: { email: string; password: string; displayName: string }) => Promise<"ready" | "confirm">;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  profileError: null,
  ready: false,
  profileReady: false,
  signIn: async () => undefined,
  signUp: async () => "ready",
  signOut: async () => undefined,
  refreshProfile: async () => undefined,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => createBrowserSupabase(), []);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ApiProfile | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [profileReady, setProfileReady] = useState(false);
  const userRef = useRef<User | null>(null);
  userRef.current = user;

  const loadProfile = useCallback(async () => {
    try {
      const next = await getProfile();
      setProfile(next);
      setProfileError(null);
    } catch (error) {
      setProfile(null);
      setProfileError(error instanceof Error ? error.message : "The bureau could not be reached.");
    } finally {
      setProfileReady(true);
    }
  }, []);

  async function endSession(expired = false) {
    const current = userRef.current;
    clearUserSessionKeys(current?.id);
    clearAuthIssued(current?.id);
    setProfile(null);
    setProfileError(null);
    setProfileReady(true);
    setUser(null);
    await supabase.auth.signOut();
    if (expired && typeof window !== "undefined") {
      const next = `${window.location.pathname}${window.location.search}`;
      const dest = next.startsWith("/") ? next : "/cases";
      window.location.replace(`/login?next=${encodeURIComponent(dest)}&reason=timeout`);
    }
  }

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(async ({ data }) => {
      if (cancelled) return;
      const next = data.user ?? null;
      if (next) {
        adoptUserDesk(next.id);
        markAuthIssued(next.id, false);
        if (isAuthExpired(next.id)) {
          await endSession(true);
          setReady(true);
          return;
        }
      }
      setUser(next);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      const next = session?.user ?? null;
      if (next) {
        adoptUserDesk(next.id);
        if (event === "SIGNED_IN") {
          markAuthIssued(next.id, false);
        }
      }
      setUser(next);
      setReady(true);
    });
    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      void Promise.resolve().then(() => {
        setProfile(null);
        setProfileError(null);
        setProfileReady(true);
      });
      return;
    }
    setProfileReady(false);
    void loadProfile();
  }, [loadProfile, ready, user]);

  useEffect(() => {
    if (!user) return;

    const expireIfNeeded = () => {
      if (isAuthExpired(user.id)) {
        void endSession(true);
      }
    };

    expireIfNeeded();
    const timer = window.setInterval(expireIfNeeded, 15000);
    window.addEventListener("focus", expireIfNeeded);
    document.addEventListener("visibilitychange", expireIfNeeded);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", expireIfNeeded);
      document.removeEventListener("visibilitychange", expireIfNeeded);
    };
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        profileError,
        ready,
        profileReady,
        async signIn(email, password) {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) {
            throw new Error(authErrorMessage(error, "Login failed. Please try again."));
          }
          if (data.user) {
            adoptUserDesk(data.user.id);
            markAuthIssued(data.user.id, true);
          }
        },
        async signUp({ email, password, displayName }) {
          await registerAccount({ email, password, displayName });
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) {
            throw new Error(authErrorMessage(error, "Account created. Please log in."));
          }
          if (data.user) {
            adoptUserDesk(data.user.id);
            markAuthIssued(data.user.id, true);
          }
          return "ready";
        },
        async signOut() {
          await endSession(false);
        },
        refreshProfile: loadProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
