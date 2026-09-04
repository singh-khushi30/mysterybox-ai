"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { getProfile, registerAccount } from "@/lib/api";
import { authErrorMessage } from "@/lib/auth/messages";
import { clearUserSessionKeys } from "@/lib/investigation/session";
import { createBrowserSupabase } from "@/lib/supabase/client";
import type { ApiProfile } from "@/types/api";

type AuthContextValue = {
  user: User | null;
  profile: ApiProfile | null;
  ready: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: { email: string; password: string; displayName: string }) => Promise<"ready" | "confirm">;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  ready: false,
  signIn: async () => undefined,
  signUp: async () => "ready",
  signOut: async () => undefined,
  refreshProfile: async () => undefined,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => createBrowserSupabase(), []);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ApiProfile | null>(null);
  const [ready, setReady] = useState(false);

  async function loadProfile() {
    try {
      const next = await getProfile();
      setProfile(next);
    } catch {
      setProfile(null);
    }
  }

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      setUser(data.user ?? null);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
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
      void Promise.resolve().then(() => setProfile(null));
      return;
    }
    void loadProfile();
  }, [ready, user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        ready,
        async signIn(email, password) {
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) {
            throw new Error(authErrorMessage(error, "Login failed. Please try again."));
          }
        },
        async signUp({ email, password, displayName }) {
          await registerAccount({ email, password, displayName });
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) {
            throw new Error(authErrorMessage(error, "Account created. Please log in."));
          }
          return "ready";
        },
        async signOut() {
          clearUserSessionKeys(user?.id);
          setProfile(null);
          await supabase.auth.signOut();
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
