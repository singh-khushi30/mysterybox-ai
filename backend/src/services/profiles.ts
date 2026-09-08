import { supabase } from "../config/supabase.js";
import { CASE_CATALOG, publishedCaseCount } from "./progression.js";
import { rankFromScore } from "./scoring.js";
import { HttpError } from "../utils/http.js";

const PROFILE_FIELDS = "id, display_name, detective_rank, avatar_url, created_at, updated_at";

export type ProfileRow = {
  id: string;
  display_name: string;
  detective_rank: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

function displayNameFromEmail(email: string | null) {
  const local = email?.split("@")[0]?.trim();
  return local && local.length > 0 ? local : "Detective";
}

export function careerRank(completed: number, averageScore: number) {
  if (completed === 0) return "Rookie Detective";
  return rankFromScore(averageScore);
}

export async function ensureProfile(userId: string, email: string | null, displayName?: string) {
  const existing = await supabase
    .from("profiles")
    .select(PROFILE_FIELDS)
    .eq("id", userId)
    .maybeSingle();

  if (existing.error) {
    throw new HttpError(500, "Unable to open your file");
  }
  if (existing.data) {
    return existing.data as ProfileRow;
  }

  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: userId,
      display_name: displayName?.trim() || displayNameFromEmail(email),
      detective_rank: "Rookie Detective",
    })
    .select(PROFILE_FIELDS)
    .single();

  if (error || !data) {
    const retry = await supabase
      .from("profiles")
      .select(PROFILE_FIELDS)
      .eq("id", userId)
      .maybeSingle();
    if (retry.data) {
      return retry.data as ProfileRow;
    }
    throw new HttpError(500, "Unable to open your file");
  }

  return data as ProfileRow;
}

export async function updateProfile(userId: string, input: { displayName: string }) {
  const { data, error } = await supabase
    .from("profiles")
    .update({ display_name: input.displayName })
    .eq("id", userId)
    .select(PROFILE_FIELDS)
    .single();

  if (error || !data) {
    throw new HttpError(500, "Unable to update your file");
  }

  return data as ProfileRow;
}

export async function refreshDetectiveRank(userId: string) {
  const stats = await loadProfileStats(userId);
  const rank = careerRank(stats.completedCases, stats.averageScore);
  await supabase.from("profiles").update({ detective_rank: rank }).eq("id", userId);
  return rank;
}

export async function loadProfileStats(userId: string) {
  const { data: sessions, error } = await supabase
    .from("game_sessions")
    .select("id, case_id, status, score, completed_at, started_at")
    .eq("user_id", userId)
    .order("started_at", { ascending: false });

  if (error) {
    throw new HttpError(500, "Unable to load your record");
  }

  const rows = sessions ?? [];
  const completed = rows.filter((row) => row.status === "completed");
  const scored = completed.filter((row): row is typeof row & { score: number } => row.score != null);
  const averageScore =
    scored.length === 0
      ? 0
      : Math.round(scored.reduce((sum, row) => sum + row.score, 0) / scored.length);

  const sessionIds = completed.map((row) => row.id);
  const correctBySession = new Map<string, boolean>();
  if (sessionIds.length > 0) {
    const accusations = await supabase
      .from("accusations")
      .select("session_id, culprit_correct")
      .in("session_id", sessionIds);
    if (!accusations.error) {
      for (const row of accusations.data ?? []) {
        correctBySession.set(row.session_id, row.culprit_correct);
      }
    }
  }
  const correct = completed.filter((row) => correctBySession.get(row.id) === true).length;

  const caseIds = [...new Set(rows.map((row) => row.case_id))];
  let cases: Array<{ id: string; title: string; slug: string; case_number?: number | null }> = [];
  if (caseIds.length > 0) {
    const withNumber = await supabase
      .from("cases")
      .select("id, title, slug, case_number")
      .in("id", caseIds);
    if (withNumber.error) {
      const legacy = await supabase.from("cases").select("id, title, slug").in("id", caseIds);
      cases = legacy.data ?? [];
    } else {
      cases = withNumber.data ?? [];
    }
  }
  const caseById = new Map(
    cases.map((item) => [
      item.id,
      {
        ...item,
        case_number: item.case_number ?? CASE_CATALOG[item.id]?.caseNumber ?? null,
      },
    ])
  );
  const totalCases = await publishedCaseCount();

  const current = rows.find((row) => row.status === "in_progress");
  const currentCase = current ? caseById.get(current.case_id) : null;

  return {
    completedCases: completed.length,
    totalCases,
    averageScore,
    accuracy: completed.length === 0 ? 0 : Math.round((correct / completed.length) * 100),
    currentInvestigation:
      current && currentCase
        ? {
            sessionId: current.id,
            caseId: current.case_id,
            title: currentCase.title,
            slug: currentCase.slug,
            caseNumber: currentCase.case_number ?? null,
          }
        : null,
    recentlySolved: [...completed]
      .sort((left, right) => {
        const leftAt = left.completed_at ? Date.parse(left.completed_at) : 0;
        const rightAt = right.completed_at ? Date.parse(right.completed_at) : 0;
        return rightAt - leftAt;
      })
      .slice(0, 3)
      .map((row) => ({
        id: row.id,
        caseId: row.case_id,
        title: caseById.get(row.case_id)?.title ?? "Closed case",
        year: row.completed_at ? String(new Date(row.completed_at).getUTCFullYear()) : "",
        completedAt: row.completed_at,
        score: row.score ?? 0,
        correct: correctBySession.get(row.id) === true,
      })),
  };
}

export async function getProfileForUser(userId: string, email: string | null) {
  const profile = await ensureProfile(userId, email);
  const stats = await loadProfileStats(userId);
  const rank = careerRank(stats.completedCases, stats.averageScore);

  if (profile.detective_rank !== rank) {
    await supabase.from("profiles").update({ detective_rank: rank }).eq("id", userId);
    profile.detective_rank = rank;
  }

  return {
    id: profile.id,
    displayName: profile.display_name,
    detectiveRank: profile.detective_rank,
    avatarUrl: profile.avatar_url,
    createdAt: profile.created_at,
    stats,
    achievements: achievementsFor(stats),
  };
}

function achievementsFor(stats: Awaited<ReturnType<typeof loadProfileStats>>) {
  const items: Array<{ id: string; title: string; detail: string }> = [];
  items.push({
    id: "archive-key",
    title: "Archive Key",
    detail: "Admitted to the private cabinet.",
  });
  if (stats.completedCases >= 1) {
    items.push({
      id: "first-accusation",
      title: "First Accusation",
      detail: "Closed a case on the first desk.",
    });
  }
  if (stats.recentlySolved.some((item) => item.score >= 80)) {
    items.push({
      id: "quiet-hour",
      title: "Quiet Hour",
      detail: "Solved without raising the house.",
    });
  }
  if (stats.completedCases >= 3) {
    items.push({
      id: "thread-puller",
      title: "Thread-puller",
      detail: "Returned to the archive with more than one sealed file.",
    });
  }
  return items;
}
