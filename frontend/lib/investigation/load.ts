import { cache } from "react";
import {
  ApiError,
  getCase,
  getCaseEvidence,
  getCaseSuspects,
  getCases,
  getCaseTimeline,
  getSuspect,
  resolveCaseId,
} from "@/lib/api";
import { nightFromTimeline, toCaseFile, toInvestigation } from "@/lib/investigation/from-api";
import type { CaseFile } from "@/types/case";
import type { Case, Suspect } from "@/types/investigation";

export type LoadResult<T> =
  | { status: "ok"; data: T }
  | { status: "not_found" }
  | { status: "error"; message: string };

function asLoadError(error: unknown): LoadResult<never> {
  if (error instanceof ApiError && error.status === 404) {
    return { status: "not_found" };
  }
  if (error instanceof ApiError) {
    return { status: "error", message: error.message };
  }
  return { status: "error", message: "The file could not be opened." };
}

export const loadPlayableCases = cache(async (): Promise<LoadResult<CaseFile[]>> => {
  try {
    const cases = await getCases();
    const files = await Promise.all(
      cases.map(async (item, index) => {
        const [suspects, evidence] = await Promise.all([
          getCaseSuspects(item.id),
          getCaseEvidence(item.id),
        ]);
        return toCaseFile(item, index, suspects, evidence);
      })
    );
    return { status: "ok", data: files };
  } catch (error) {
    return asLoadError(error);
  }
});

export const loadCaseFile = cache(async (idOrSlug: string): Promise<LoadResult<CaseFile>> => {
  try {
    const caseId = await resolveCaseId(idOrSlug);
    if (!caseId) return { status: "not_found" };
    const [item, suspects, evidence, timeline, catalog] = await Promise.all([
      getCase(caseId),
      getCaseSuspects(caseId),
      getCaseEvidence(caseId),
      getCaseTimeline(caseId),
      getCases(),
    ]);
    const index = Math.max(
      0,
      catalog.findIndex((entry) => entry.id === item.id)
    );
    return {
      status: "ok",
      data: toCaseFile(
        item,
        index,
        suspects,
        evidence,
        idOrSlug,
        nightFromTimeline(timeline)
      ),
    };
  } catch (error) {
    return asLoadError(error);
  }
});

export const loadInvestigation = cache(async (idOrSlug: string): Promise<LoadResult<Case>> => {
  try {
    const caseId = await resolveCaseId(idOrSlug);
    if (!caseId) return { status: "not_found" };
    const [item, suspects, evidence, timeline, catalog] = await Promise.all([
      getCase(caseId),
      getCaseSuspects(caseId),
      getCaseEvidence(caseId),
      getCaseTimeline(caseId),
      getCases(),
    ]);
    const index = Math.max(
      0,
      catalog.findIndex((entry) => entry.id === item.id)
    );
    return {
      status: "ok",
      data: toInvestigation(item, index, suspects, evidence, timeline, idOrSlug),
    };
  } catch (error) {
    return asLoadError(error);
  }
});

export const loadSuspectForCase = cache(
  async (
    idOrSlug: string,
    suspectId: string
  ): Promise<LoadResult<{ caseFile: Case; suspect: Suspect }>> => {
    const investigation = await loadInvestigation(idOrSlug);
    if (investigation.status !== "ok") return investigation;

    const listed = investigation.data.suspects.find((suspect) => suspect.id === suspectId);
    if (!listed) return { status: "not_found" };

    try {
      const apiSuspect = await getSuspect(suspectId);
      return {
        status: "ok",
        data: {
          caseFile: investigation.data,
          suspect: {
            ...listed,
            name: apiSuspect.name,
            role: apiSuspect.occupation ?? listed.role,
            relationship: apiSuspect.relationship_to_victim ?? listed.relationship,
            bio: apiSuspect.bio ?? listed.bio,
            background: apiSuspect.personality ?? listed.background,
            alibi: apiSuspect.public_alibi ?? listed.alibi,
          },
        },
      };
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return { status: "not_found" };
      }
      return {
        status: "ok",
        data: { caseFile: investigation.data, suspect: listed },
      };
    }
  }
);
