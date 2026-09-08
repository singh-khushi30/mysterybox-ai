import { supabase } from "../config/supabase.js";
import { HttpError } from "../utils/http.js";
import { getPlayableCase } from "./cases.js";

type SessionProgress = {
  case_id: string;
  status: string;
  score: number | null;
  completed_at: string | null;
};

async function listUserProgress(userId: string): Promise<SessionProgress[]> {
  const { data, error } = await supabase
    .from("game_sessions")
    .select("case_id, status, score, completed_at")
    .eq("user_id", userId)
    .order("started_at", { ascending: false });

  if (error) {
    throw new HttpError(500, "Unable to load your files");
  }

  return data ?? [];
}

export const LOCKED_CASE_MESSAGE = "Complete the previous case to unlock this file.";

export const CASE_CATALOG: Record<
  string,
  { caseNumber: number; unlockOrder: number; teaser: string }
> = {
  "a1000001-0001-4000-8000-000000000001": {
    caseNumber: 1,
    unlockOrder: 1,
    teaser: "A private supper at Blackwood Manor. The last guest never signed the letter.",
  },
  "a1000002-0002-4000-8000-000000000002": {
    caseNumber: 2,
    unlockOrder: 2,
    teaser:
      "A private experimental station in London, 1931. A midnight broadcast ends in silence — and a locked room.",
  },
  "a1000003-0003-4000-8000-000000000003": {
    caseNumber: 3,
    unlockOrder: 3,
    teaser:
      "An overnight train from Paris toward Vienna, 1933. A first-class berth is locked. The passenger may never have boarded.",
  },
};

export type ArchiveStatus = "locked" | "available" | "in_progress" | "completed";

export type ArchiveCase = {
  id: string;
  title: string;
  slug: string;
  description: string;
  teaser: string;
  difficulty: "easy" | "medium" | "hard";
  estimated_minutes: number;
  cover_image_url: string | null;
  publicationStatus: "draft" | "published" | "archived";
  caseNumber: number;
  unlockOrder: number;
  status: ArchiveStatus;
  score: number | null;
  completedAt: string | null;
  created_at: string;
};

type CaseRow = {
  id: string;
  title: string;
  slug: string;
  description: string;
  teaser: string | null;
  difficulty: "easy" | "medium" | "hard";
  estimated_minutes: number;
  cover_image_url: string | null;
  status: "draft" | "published" | "archived";
  case_number: number;
  unlock_order: number;
  created_at: string;
};

const ARCHIVE_FIELDS =
  "id, title, slug, description, teaser, difficulty, estimated_minutes, cover_image_url, status, case_number, unlock_order, created_at";
const LEGACY_FIELDS =
  "id, title, slug, description, difficulty, estimated_minutes, cover_image_url, status, created_at";

function teaserFor(row: CaseRow) {
  const text = row.teaser?.trim();
  if (text) return text;
  const sentence = row.description.split(/(?<=[.!?])\s+/)[0] ?? row.description;
  return sentence;
}

function withCatalogMeta(
  row: {
    id: string;
    title: string;
    slug: string;
    description: string;
    teaser?: string | null;
    difficulty: "easy" | "medium" | "hard";
    estimated_minutes: number;
    cover_image_url: string | null;
    status: "draft" | "published" | "archived";
    case_number?: number | null;
    unlock_order?: number | null;
    created_at: string;
  },
  index: number
): CaseRow {
  const fallback = CASE_CATALOG[row.id];
  return {
    ...row,
    teaser: row.teaser ?? fallback?.teaser ?? null,
    case_number: row.case_number ?? fallback?.caseNumber ?? index + 1,
    unlock_order: row.unlock_order ?? fallback?.unlockOrder ?? index + 1,
  };
}

function missingProgressionColumn(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return (
    error.code === "42703" ||
    /case_number|unlock_order|teaser/i.test(error.message ?? "")
  );
}

export async function listPublishedCases() {
  const withMeta = await supabase
    .from("cases")
    .select(ARCHIVE_FIELDS)
    .eq("status", "published")
    .order("unlock_order", { ascending: true });

  if (!withMeta.error) {
    return ((withMeta.data ?? []) as CaseRow[]).map((row, index) => withCatalogMeta(row, index));
  }
  if (!missingProgressionColumn(withMeta.error)) {
    throw new HttpError(500, "Unable to load cases");
  }

  const legacy = await supabase
    .from("cases")
    .select(LEGACY_FIELDS)
    .eq("status", "published")
    .order("created_at", { ascending: true });

  if (legacy.error) {
    throw new HttpError(500, "Unable to load cases");
  }

  return (legacy.data ?? [])
    .map((row, index) => withCatalogMeta(row, index))
    .sort((left, right) => left.unlock_order - right.unlock_order);
}

export async function getPublishedCaseRow(id: string) {
  const catalog = await listPublishedCases();
  const row = catalog.find((item) => item.id === id);
  if (!row) {
    throw new HttpError(404, "Case not found");
  }
  return row;
}

export async function publishedCaseCount() {
  const { count, error } = await supabase
    .from("cases")
    .select("id", { count: "exact", head: true })
    .eq("status", "published");

  if (error) {
    throw new HttpError(500, "Unable to load your record");
  }

  return count ?? 0;
}

export function archiveStatusFor(
  row: CaseRow,
  catalog: CaseRow[],
  sessions: Array<{
    case_id: string;
    status: string;
    score: number | null;
    completed_at: string | null;
  }>
): Pick<ArchiveCase, "status" | "score" | "completedAt"> {
  const prior = catalog.find((item) => item.unlock_order === row.unlock_order - 1);
  const unlocked = row.unlock_order <= 1 || Boolean(prior && sessions.some((session) => session.case_id === prior.id && session.status === "completed"));

  const mine = sessions.filter((session) => session.case_id === row.id);
  const completed = mine.find((session) => session.status === "completed");
  const active = mine.find((session) => session.status === "in_progress");

  if (!unlocked) {
    return { status: "locked", score: null, completedAt: null };
  }
  if (completed && !active) {
    return {
      status: "completed",
      score: completed.score,
      completedAt: completed.completed_at,
    };
  }
  if (active) {
    return { status: "in_progress", score: completed?.score ?? null, completedAt: completed?.completed_at ?? null };
  }
  return { status: "available", score: null, completedAt: null };
}

export function toArchiveCase(
  row: CaseRow,
  catalog: CaseRow[],
  sessions: Array<{
    case_id: string;
    status: string;
    score: number | null;
    completed_at: string | null;
  }>
): ArchiveCase {
  const progress = archiveStatusFor(row, catalog, sessions);
  const locked = progress.status === "locked";
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: locked ? teaserFor(row) : row.description,
    teaser: teaserFor(row),
    difficulty: row.difficulty,
    estimated_minutes: row.estimated_minutes,
    cover_image_url: row.cover_image_url,
    publicationStatus: row.status,
    caseNumber: row.case_number,
    unlockOrder: row.unlock_order,
    status: progress.status,
    score: progress.score,
    completedAt: progress.completedAt,
    created_at: row.created_at,
  };
}

export async function listArchiveForUser(userId: string | null) {
  const catalog = await listPublishedCases();
  const sessions = userId ? await listUserProgress(userId) : [];
  return catalog.map((row) => toArchiveCase(row, catalog, sessions));
}

export async function getArchiveCase(id: string, userId: string | null) {
  await getPlayableCase(id);
  const catalog = await listPublishedCases();
  const row = catalog.find((item) => item.id === id);
  if (!row) {
    throw new HttpError(404, "Case not found");
  }
  const sessions = userId ? await listUserProgress(userId) : [];
  return toArchiveCase(row, catalog, sessions);
}

export async function assertCaseUnlocked(caseId: string, userId: string) {
  const entry = await getArchiveCase(caseId, userId);
  if (entry.status === "locked") {
    throw new HttpError(403, LOCKED_CASE_MESSAGE);
  }
  return entry;
}

export async function assertCaseReadable(caseId: string, userId: string | null) {
  const entry = await getArchiveCase(caseId, userId);
  if (entry.status === "locked") {
    throw new HttpError(403, LOCKED_CASE_MESSAGE);
  }
  return entry;
}
