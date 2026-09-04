"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { reopenInvestigationSession } from "@/lib/investigation/session";
import type { ApiSession } from "@/types/api";

type SessionContextValue = {
  session: ApiSession | null;
  sessionId: string | null;
  ready: boolean;
  setSession: (session: ApiSession | null) => void;
};

const SessionContext = createContext<SessionContextValue>({
  session: null,
  sessionId: null,
  ready: false,
  setSession: () => undefined,
});

export function InvestigationSessionProvider({
  routeId,
  caseId,
  children,
}: {
  routeId: string;
  caseId: string;
  children: ReactNode;
}) {
  const [session, setSession] = useState<ApiSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    reopenInvestigationSession(routeId, caseId)
      .then((next) => {
        if (!cancelled) setSession(next);
      })
      .catch(() => {
        if (!cancelled) setSession(null);
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [routeId, caseId]);

  return (
    <SessionContext.Provider
      value={{ session, sessionId: session?.id ?? null, ready, setSession }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useInvestigationSession() {
  return useContext(SessionContext);
}
