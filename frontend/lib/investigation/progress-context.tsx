"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { discoverSessionEvidence, getSessionEvidence } from "@/lib/api";
import { useInvestigationSession } from "@/lib/investigation/session-context";
import type { ApiEvidence } from "@/types/api";
import type { Case } from "@/types/investigation";

type ProgressContextValue = {
  discoveredIds: string[];
  discoveredItems: ApiEvidence[];
  ready: boolean;
  discoveringId: string | null;
  discover: (evidenceId: string) => Promise<boolean>;
};

const ProgressContext = createContext<ProgressContextValue>({
  discoveredIds: [],
  discoveredItems: [],
  ready: false,
  discoveringId: null,
  discover: async () => false,
});

export function InvestigationProgressProvider({ children }: { children: ReactNode }) {
  const { sessionId, ready: sessionReady } = useInvestigationSession();
  const [discovered, setDiscovered] = useState<ApiEvidence[]>([]);
  const [ready, setReady] = useState(false);
  const [discoveringId, setDiscoveringId] = useState<string | null>(null);
  const discoveredIds = discovered.map((item) => item.id);

  useEffect(() => {
    let cancelled = false;
    if (!sessionReady) return;
    if (!sessionId) {
      void Promise.resolve().then(() => {
        if (cancelled) return;
        setDiscovered([]);
        setReady(true);
      });
      return () => {
        cancelled = true;
      };
    }

    setReady(false);
    getSessionEvidence(sessionId)
      .then((items) => {
        if (!cancelled) setDiscovered(items);
      })
      .catch(() => {
        if (!cancelled) setDiscovered([]);
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [sessionId, sessionReady]);

  async function discover(evidenceId: string) {
    if (!sessionId || discoveredIds.includes(evidenceId)) {
      return Boolean(sessionId && discoveredIds.includes(evidenceId));
    }
    setDiscoveringId(evidenceId);
    try {
      const item = await discoverSessionEvidence(sessionId, evidenceId);
      setDiscovered((current) =>
        current.some((entry) => entry.id === item.id) ? current : [...current, item]
      );
      return true;
    } catch {
      return false;
    } finally {
      setDiscoveringId(null);
    }
  }

  return (
    <ProgressContext.Provider
      value={{ discoveredIds, discoveredItems: discovered, ready, discoveringId, discover }}
    >
      {children}
    </ProgressContext.Provider>
  );
}

export function useInvestigationProgress() {
  return useContext(ProgressContext);
}

export function useProgressCase(caseFile: Case): Case {
  const { discoveredIds, discoveredItems } = useInvestigationProgress();
  return useMemo(
    () => ({
      ...caseFile,
      evidence: caseFile.evidence.map((item) => {
        const live = discoveredItems.find((entry) => entry.id === item.id);
        return {
          ...item,
          description: live?.description || item.description,
          location: live?.location_found ?? item.location,
          discovered: item.discovered || discoveredIds.includes(item.id),
        };
      }),
    }),
    [caseFile, discoveredIds, discoveredItems]
  );
}
