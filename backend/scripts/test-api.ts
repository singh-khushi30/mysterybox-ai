import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";
import { supabase } from "../src/config/supabase.ts";

const CASE_ID = "a1000001-0001-4000-8000-000000000001";
const ISOLDE_ID = "a1000001-0001-4000-8000-000000000014";
const API = `http://127.0.0.1:${process.env.PORT || 5050}`;
const MISSING = "00000000-0000-4000-8000-000000000000";

function check(title: string, passed: boolean, detail: string) {
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

async function createTestUser() {
  const email = `mb-api-${Date.now()}@example.com`;
  const password = "ArchiveKey-1928";
  const created = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: "API Probe" },
  });
  if (created.error || !created.data.user) {
    throw new Error("Unable to create API probe user.");
  }
  const signed = await passwordClient().auth.signInWithPassword({ email, password });
  if (signed.error || !signed.data.session) {
    throw new Error("Unable to sign in API probe user.");
  }
  return {
    id: created.data.user.id,
    token: signed.data.session.access_token,
  };
}

type EvidenceRow = {
  id: string;
  description: string;
  discovered_by_default: boolean;
  location_found: string | null;
};

async function main() {
  const checks: Array<{ title: string; passed: boolean }> = [];
  const health = await api("/api/health");
  if (health.status >= 500) {
    console.log("SKIP  API is not running. Start backend with npm run dev.");
    process.exit(1);
  }

  checks.push(check("Health is open", health.status === 200 && health.payload.success === true, `${health.status}`));

  const cases = await api("/api/cases");
  checks.push(check("Case list is public", cases.status === 200, `${cases.status}`));

  const one = await api(`/api/cases/${CASE_ID}`);
  const caseBody = JSON.stringify(one.payload);
  checks.push(
    check(
      "Case detail does not expose ground truth",
      one.status === 200 && !/Isolde Hart is the last guest|solution_explanation|culprit_id/i.test(caseBody),
      `${one.status}`
    )
  );

  const badId = await api("/api/cases/not-a-uuid");
  checks.push(check("Invalid case id is 400", badId.status === 400, `${badId.status}`));

  const missing = await api(`/api/cases/${MISSING}`);
  checks.push(check("Missing case is 404", missing.status === 404, `${missing.status}`));

  const catalog = await api(`/api/cases/${CASE_ID}/evidence/all`);
  const rows = (catalog.payload.data as EvidenceRow[] | undefined) ?? [];
  const hidden = rows.filter((item) => !item.discovered_by_default);
  const hiddenLeaks = hidden.some((item) => item.description.trim().length > 0 || Boolean(item.location_found));
  checks.push(
    check(
      "Hidden evidence catalog is redacted",
      catalog.status === 200 && hidden.length > 0 && !hiddenLeaks,
      hiddenLeaks ? "description leaked" : `${hidden.length} sealed`
    )
  );

  const hiddenFile = hidden[0];
  if (hiddenFile) {
    const byId = await api(`/api/evidence/${hiddenFile.id}`);
    const item = byId.payload.data as EvidenceRow | undefined;
    checks.push(
      check(
        "Hidden evidence by id is redacted",
        byId.status === 200 && !item?.description && !item?.location_found,
        item?.description ? "description leaked" : `${byId.status}`
      )
    );
  }

  const noAuth = await api("/api/sessions", {
    method: "POST",
    body: JSON.stringify({ caseId: CASE_ID }),
  });
  checks.push(check("Session create requires auth", noAuth.status === 401, `${noAuth.status}`));

  const expired = await api("/api/profile", { token: "eyJhbGciOiJub25lIn0.e30." });
  checks.push(check("Expired/invalid token is 401", expired.status === 401, `${expired.status}`));

  const badJson = await fetch(`${API}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{not-json",
  });
  checks.push(check("Malformed JSON is 400", badJson.status === 400, `${badJson.status}`));

  const badRegister = await api("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email: "not-an-email", password: "1", displayName: "" }),
  });
  checks.push(check("Invalid register body is 400", badRegister.status === 400, `${badRegister.status}`));

  const user = await createTestUser();
  const session = await api("/api/sessions", {
    method: "POST",
    token: user.token,
    body: JSON.stringify({ caseId: CASE_ID }),
  });
  const sessionId = (session.payload.data as { id?: string } | undefined)?.id;
  checks.push(check("Authenticated session create", session.status === 201 && Boolean(sessionId), `${session.status}`));

  const replay = await api("/api/sessions", {
    method: "POST",
    token: user.token,
    body: JSON.stringify({ caseId: CASE_ID }),
  });
  const replayId = (replay.payload.data as { id?: string } | undefined)?.id;
  checks.push(
    check("Duplicate session reuses the open file", replay.status === 201 && replayId === sessionId, replayId ?? "")
  );

  if (sessionId) {
    const resultOpen = await api(`/api/sessions/${sessionId}/result`, { token: user.token });
    checks.push(
      check(
        "Result stays sealed while the case is open",
        resultOpen.status === 409 &&
          !/Isolde Hart|solution_explanation|unsigned letter/i.test(JSON.stringify(resultOpen.payload)),
        `${resultOpen.status}`
      )
    );

    const badNotes = await api(`/api/sessions/${sessionId}/notes`, {
      method: "PUT",
      token: user.token,
      body: JSON.stringify({ content: 12 }),
    });
    checks.push(check("Malformed notes are 400", badNotes.status === 400, `${badNotes.status}`));

    const notes = await api(`/api/sessions/${sessionId}/notes`, {
      method: "PUT",
      token: user.token,
      body: JSON.stringify({ content: "Blotter." }),
    });
    checks.push(check("Notes save", notes.status === 200, `${notes.status}`));

    const badAccusation = await api(`/api/sessions/${sessionId}/accusation`, {
      method: "POST",
      token: user.token,
      body: JSON.stringify({ suspectId: ISOLDE_ID }),
    });
    checks.push(check("Incomplete accusation is 400", badAccusation.status === 400, `${badAccusation.status}`));

    const missingSession = await api(`/api/sessions/${MISSING}`, { token: user.token });
    checks.push(check("Missing session is 404", missingSession.status === 404, `${missingSession.status}`));
  }

  const failed = checks.filter((item) => !item.passed);
  console.log("");
  console.log(`${checks.length - failed.length}/${checks.length} passed`);
  if (failed.length > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
