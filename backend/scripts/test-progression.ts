import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";
import { supabase } from "../src/config/supabase.ts";
import { retrieveKnowledge } from "../src/services/rag/retrieve.ts";

const CASE_1 = "a1000001-0001-4000-8000-000000000001";
const CASE_2 = "a1000002-0002-4000-8000-000000000002";
const CASE_3 = "a1000003-0003-4000-8000-000000000003";
const API = `http://127.0.0.1:${process.env.PORT || 5050}`;

function check(title: string, passed: boolean, detail = "") {
  console.log(`  ${passed ? "PASS" : "FAIL"}  ${title}${detail ? ` — ${detail}` : ""}`);
  return { title, passed, detail };
}

async function api(path: string, init?: RequestInit & { token?: string }) {
  const headers: Record<string, string> = {
    ...(init?.body ? { "Content-Type": "application/json" } : {}),
    ...(init?.token ? { Authorization: `Bearer ${init.token}` } : {}),
  };
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: { ...headers, ...(init?.headers as Record<string, string> | undefined) },
  });
  let payload: { success?: boolean; data?: unknown; error?: string } = {};
  try {
    payload = (await response.json()) as typeof payload;
  } catch {
    payload = {};
  }
  return { status: response.status, payload };
}

function passwordClient() {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY.");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    realtime: { transport: WebSocket as never },
  });
}

async function createTestUser(label: string) {
  const email = `mb-prog-${label}-${Date.now()}@example.com`;
  const password = "ArchiveKey-1928";
  const created = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: `Progress ${label}` },
  });
  if (created.error || !created.data.user) {
    throw new Error("Unable to create progression probe user.");
  }
  const signed = await passwordClient().auth.signInWithPassword({ email, password });
  if (signed.error || !signed.data.session) {
    throw new Error("Unable to sign in progression probe user.");
  }
  return {
    id: created.data.user.id,
    token: signed.data.session.access_token,
  };
}

type ArchiveCase = {
  id: string;
  title: string;
  caseNumber: number;
  status: string;
};

function statuses(rows: ArchiveCase[]) {
  return Object.fromEntries(rows.map((row) => [row.caseNumber, row.status]));
}

async function completeCase(userId: string, caseId: string, score: number) {
  const existing = await supabase
    .from("game_sessions")
    .select("id, status")
    .eq("user_id", userId)
    .eq("case_id", caseId);
  const open = existing.data?.find((row) => row.status === "in_progress");
  const closed = existing.data?.find((row) => row.status === "completed");
  if (closed) {
    return closed.id;
  }
  if (open) {
    const updated = await supabase
      .from("game_sessions")
      .update({
        status: "completed",
        score,
        completed_at: new Date().toISOString(),
      })
      .eq("id", open.id)
      .select("id")
      .single();
    if (updated.error || !updated.data) {
      throw new Error(`Unable to close ${caseId}: ${updated.error?.message ?? "missing row"}`);
    }
    return updated.data.id;
  }
  const { data, error } = await supabase
    .from("game_sessions")
    .insert({
      case_id: caseId,
      user_id: userId,
      status: "completed",
      score,
      completed_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error || !data) {
    throw new Error(`Unable to complete ${caseId}: ${error?.message ?? "missing row"}`);
  }
  return data.id;
}

async function main() {
  const checks: Array<{ title: string; passed: boolean }> = [];
  const health = await api("/api/health");
  if (health.status >= 500) {
    console.log("SKIP  API is not running. Start backend with npm run dev.");
    process.exit(1);
  }

  const catalog = await api("/api/cases");
  const publicRows = (catalog.payload.data as ArchiveCase[] | undefined) ?? [];
  checks.push(
    check(
      "Archive lists three published cases",
      catalog.status === 200 && publicRows.length >= 3,
      `${publicRows.length}`
    )
  );
  const publicStatus = statuses(publicRows);
  checks.push(
    check(
      "Anonymous: 001 available, 002/003 locked",
      publicStatus[1] === "available" && publicStatus[2] === "locked" && publicStatus[3] === "locked",
      JSON.stringify(publicStatus)
    )
  );

  const userA = await createTestUser("a");
  const userB = await createTestUser("b");

  const startA2 = await api("/api/sessions", {
    method: "POST",
    token: userA.token,
    body: JSON.stringify({ caseId: CASE_2 }),
  });
  checks.push(
    check(
      "User A cannot start Case #002 before #001",
      startA2.status === 403 && startA2.payload.error === "Complete the previous case to unlock this file.",
      `${startA2.status} ${startA2.payload.error ?? ""}`
    )
  );

  const startA3 = await api("/api/sessions", {
    method: "POST",
    token: userA.token,
    body: JSON.stringify({ caseId: CASE_3 }),
  });
  checks.push(
    check(
      "User A cannot start Case #003 before #002",
      startA3.status === 403,
      `${startA3.status}`
    )
  );

  await completeCase(userA.id, CASE_1, 72);
  const afterOne = await api("/api/cases", { token: userA.token });
  const afterOneStatus = statuses((afterOne.payload.data as ArchiveCase[]) ?? []);
  checks.push(
    check(
      "After Case #001: 002 available, 003 locked",
      afterOneStatus[1] === "completed" &&
        afterOneStatus[2] === "available" &&
        afterOneStatus[3] === "locked",
      JSON.stringify(afterOneStatus)
    )
  );

  const startA2b = await api("/api/sessions", {
    method: "POST",
    token: userA.token,
    body: JSON.stringify({ caseId: CASE_2 }),
  });
  checks.push(
    check("User A can start Case #002 after #001", startA2b.status === 201, `${startA2b.status}`)
  );

  await completeCase(userA.id, CASE_2, 64);
  const afterTwo = await api("/api/cases", { token: userA.token });
  const afterTwoStatus = statuses((afterTwo.payload.data as ArchiveCase[]) ?? []);
  checks.push(
    check(
      "After Case #002: 003 available",
      afterTwoStatus[1] === "completed" &&
        afterTwoStatus[2] === "completed" &&
        afterTwoStatus[3] === "available",
      JSON.stringify(afterTwoStatus)
    )
  );

  await completeCase(userA.id, CASE_3, 81);
  const afterThree = await api("/api/cases", { token: userA.token });
  const afterThreeStatus = statuses((afterThree.payload.data as ArchiveCase[]) ?? []);
  checks.push(
    check(
      "After Case #003: all completed",
      afterThreeStatus[1] === "completed" &&
        afterThreeStatus[2] === "completed" &&
        afterThreeStatus[3] === "completed",
      JSON.stringify(afterThreeStatus)
    )
  );

  const profileA = await api("/api/profile", { token: userA.token });
  const statsA = (profileA.payload.data as { stats?: { completedCases?: number; totalCases?: number } })
    ?.stats;
  checks.push(
    check(
      "User A profile counts 3 / 3",
      statsA?.completedCases === 3 && statsA?.totalCases === 3,
      JSON.stringify(statsA)
    )
  );

  const archiveB = await api("/api/cases", { token: userB.token });
  const statusB = statuses((archiveB.payload.data as ArchiveCase[]) ?? []);
  checks.push(
    check(
      "User B still locked on 002/003",
      statusB[1] === "available" && statusB[2] === "locked" && statusB[3] === "locked",
      JSON.stringify(statusB)
    )
  );

  const startB2 = await api("/api/sessions", {
    method: "POST",
    token: userB.token,
    body: JSON.stringify({ caseId: CASE_2 }),
  });
  checks.push(
    check("User B cannot start Case #002", startB2.status === 403, `${startB2.status}`)
  );

  const lockedDetail = await api(`/api/cases/${CASE_2}/suspects`, { token: userB.token });
  checks.push(
    check("Locked case does not leak suspects", lockedDetail.status === 403, `${lockedDetail.status}`)
  );

  const freqHits = await retrieveKnowledge({
    caseId: CASE_2,
    query: "Who killed Julian Crowe in the transmission room?",
  });
  const leakedBlackwood = freqHits.some((hit) =>
    /Blackwood|Isolde|Edmund Vale|conservatory/i.test(hit.content)
  );
  const wrongCase = freqHits.some((hit) => hit.case_id !== CASE_2);
  checks.push(
    check(
      "RAG Case #002 does not return Case #001",
      !leakedBlackwood && !wrongCase,
      `${freqHits.length} hits`
    )
  );

  const trainHits = await retrieveKnowledge({
    caseId: CASE_3,
    query: "Did René Marchand board the Paris train?",
  });
  const leakedFreq = trainHits.some((hit) =>
    /Vox-9|Vera Lang|Julian Crowe|OSC-3|Limehouse/i.test(hit.content)
  );
  const leakedManor = trainHits.some((hit) => /Blackwood|Isolde Hart|Edmund Vale/i.test(hit.content));
  const trainWrong = trainHits.some((hit) => hit.case_id !== CASE_3);
  checks.push(
    check(
      "RAG Case #003 does not return Case #001/#002",
      !leakedFreq && !leakedManor && !trainWrong,
      `${trainHits.length} hits`
    )
  );

  const manorHits = await retrieveKnowledge({
    caseId: CASE_1,
    query: "Who was the last guest at Blackwood Manor?",
  });
  const leakedForward = manorHits.some((hit) =>
    /Dead Frequency|Vera Lang|Annette Croft|Marchand|Vox-9/i.test(hit.content)
  );
  checks.push(
    check(
      "RAG Case #001 does not return later cases",
      !leakedForward && manorHits.every((hit) => hit.case_id === CASE_1),
      `${manorHits.length} hits`
    )
  );

  await supabase.auth.admin.deleteUser(userA.id);
  await supabase.auth.admin.deleteUser(userB.id);

  const failed = checks.filter((item) => !item.passed);
  console.log("");
  console.log(`${checks.length - failed.length}/${checks.length} progression checks passed.`);
  if (failed.length > 0) {
    process.exit(1);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Progression test failed.");
  process.exit(1);
});
