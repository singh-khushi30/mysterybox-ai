"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { discoverSessionEvidence, getSessionEvidence } from "@/lib/api";
import { useInvestigationSession } from "@/lib/investigation/session-context";
import type { Case } from "@/types/investigation";

type ProgressContextValue = {
  discoveredIds: string[];
  ready: boolean;
  discoveringId: string | null;
  discover: (evidenceId: string) => Promise<boolean>;
};

const ProgressContext = createContext<ProgressContextValue>({
  discoveredIds: [],
  ready: false,
  discoveringId: null,
  discover: async () => false,
});

export function InvestigationProgressProvider({ children }: { children: ReactNode }) {
  const { sessionId, ready: sessionReady } = useInvestigationSession();
  const [discoveredIds, setDiscoveredIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [discoveringId, setDiscoveringId] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionReady) return;
    if (!sessionId) {
      setDiscoveredIds([]);
      setReady(true);
      return;
    }

    let cancelled = false;
    setReady(false);
    getSessionEvidence(sessionId)
      .then((items) => {
        if (!cancelled) setDiscoveredIds(items.map((item) => item.id));
      })
      .catch(() => {
        if (!cancelled) setDiscoveredIds([]);
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
      await discoverSessionEvidence(sessionId, evidenceId);
      setDiscoveredIds((current) =>
        current.includes(evidenceId) ? current : [...current, evidenceId]
      );
      return true;
    } catch {
      return false;
    } finally {
      setDiscoveringId(null);
    }
  }

  return (
    <ProgressContext.Provider value={{ discoveredIds, ready, discoveringId, discover }}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useInvestigationProgress() {
  return useContext(ProgressContext);
}

export function useProgressCase(caseFile: Case): Case {
  const { discoveredIds } = useInvestigationProgress();
  return useMemo(
    () => ({
      ...caseFile,
      evidence: caseFile.evidence.map((item) => ({
        ...item,
        discovered: item.discovered || discoveredIds.includes(item.id),
      })),
    }),
    [caseFile, discoveredIds]
  );
}
