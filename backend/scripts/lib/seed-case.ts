import { supabase } from "../../src/config/supabase.ts";

export async function assertOk<T>(
  label: string,
  result: { data: T; error: { message: string } | null }
): Promise<T> {
  if (result.error) {
    throw new Error(`Seed failed at ${label}: ${result.error.message}`);
  }
  return result.data;
}

function withoutProgressionFields(row: object) {
  const copy = { ...row } as Record<string, unknown>;
  delete copy.case_number;
  delete copy.unlock_order;
  delete copy.teaser;
  return copy;
}

export async function upsertRows(label: string, table: string, rows: object[]) {
  const result = await supabase.from(table).upsert(rows, { onConflict: "id" });
  if (
    result.error &&
    table === "cases" &&
    (result.error.code === "42703" || /case_number|unlock_order|teaser/i.test(result.error.message))
  ) {
    const retry = await supabase
      .from(table)
      .upsert(rows.map(withoutProgressionFields), { onConflict: "id" });
    if (retry.error) {
      throw new Error(`Seed failed at ${label}: ${retry.error.message}`);
    }
    return;
  }
  if (result.error) {
    throw new Error(`Seed failed at ${label}: ${result.error.message}`);
  }
}

export async function countSessionsForCase(caseId: string) {
  const { count, error } = await supabase
    .from("game_sessions")
    .select("id", { count: "exact", head: true })
    .eq("case_id", caseId);

  if (error) {
    throw new Error(`Seed failed while counting sessions: ${error.message}`);
  }

  return count ?? 0;
}
