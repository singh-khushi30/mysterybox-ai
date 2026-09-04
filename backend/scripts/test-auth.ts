import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";
import { supabase } from "../src/config/supabase.ts";
import { getSession } from "../src/services/sessions.ts";
import { HttpError } from "../src/utils/http.ts";

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

const CASE_ID = "a1000001-0001-4000-8000-000000000001";
const API = `http://127.0.0.1:${process.env.PORT || 5050}`;

function check(title: string, passed: boolean, detail: string) {
  console.log(`  ${passed ? "PASS" : "FAIL"}  ${title}${detail ? ` — ${detail}` : ""}`);
  return { title, passed, detail };
}

async function api(
  path: string,
  init?: RequestInit & { token?: string }
) {
  const headers: Record<string, string> = {
    ...(init?.body ? { "Content-Type": "application/json" } : {}),
    ...(init?.token ? { Authorization: `Bearer ${init.token}` } : {}),
  };
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: { ...headers, ...(init?.headers as Record<string, string> | undefined) },
  });
  const payload = (await response.json()) as { success: boolean; data?: unknown; error?: string };
  return { status: response.status, payload };
}

async function createTestUser(label: string) {
  const email = `mb-auth-${label}-${Date.now()}@example.com`;
  const password = "ArchiveKey-1928";
  const created = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: label === "a" ? "Detective A" : "Detective B" },
  });
  if (created.error || !created.data.user) {
    throw new Error(`Unable to create test user ${label}.`);
  }
  const signed = await passwordClient().auth.signInWithPassword({ email, password });
  if (signed.error || !signed.data.session) {
    throw new Error(`Unable to sign in test user ${label}.`);
  }
  return {
    id: created.data.user.id,
    email,
    token: signed.data.session.access_token,
  };
}

async function main() {
  const checks: Array<{ title: string; passed: boolean }> = [];

  const probe = await supabase.from("profiles").select("id").limit(1);
  if (probe.error && (probe.error.code === "PGRST205" || /profiles/i.test(probe.error.message))) {
    console.log("SKIP  profiles table is missing. Apply 006_auth_profiles.sql in Supabase.");
    process.exit(1);
  }

  const health = await api("/api/health");
  if (health.status >= 500) {
    console.log("SKIP  API is not running. Start backend with npm run dev.");
    process.exit(1);
  }

  const userA = await createTestUser("a");
  const userB = await createTestUser("b");

  const noToken = await api("/api/sessions", {
    method: "POST",
    body: JSON.stringify({ caseId: CASE_ID }),
  });
  checks.push(
    check("Missing token is rejected", noToken.status === 401, `${noToken.status}`)
  );

  const badToken = await api("/api/sessions", {
    method: "POST",
    token: "not-a-real-token",
    body: JSON.stringify({ caseId: CASE_ID }),
  });
  checks.push(
    check("Invalid token is rejected", badToken.status === 401, `${badToken.status}`)
  );

  const startA = await api("/api/sessions", {
    method: "POST",
    token: userA.token,
    body: JSON.stringify({ caseId: CASE_ID }),
  });
  const sessionA = startA.payload.data as { id?: string; user_id?: string } | undefined;
  checks.push(
    check(
      "User A can start a case",
      startA.payload.success === true && Boolean(sessionA?.id) && sessionA?.user_id === userA.id,
      startA.payload.error ?? sessionA?.id ?? ""
    )
  );

  const profileA = await api("/api/profile", { token: userA.token });
  const profileData = profileA.payload.data as { displayName?: string; detectiveRank?: string } | undefined;
  checks.push(
    check(
      "User A profile is created",
      profileA.status === 200 &&
        /Detective A/i.test(profileData?.displayName ?? "") &&
        profileData?.detectiveRank === "Rookie Detective",
      profileData?.displayName ?? profileA.payload.error ?? ""
    )
  );

  if (sessionA?.id) {
    const notesA = await api(`/api/sessions/${sessionA.id}/notes`, {
      method: "PUT",
      token: userA.token,
      body: JSON.stringify({ content: "A's private notes" }),
    });
    checks.push(check("User A can save notes", notesA.status === 200, `${notesA.status}`));

    const stolen = await api(`/api/sessions/${sessionA.id}`, { token: userB.token });
    checks.push(
      check(
        "User B cannot read User A's session",
        stolen.status === 404 && !/A's private/i.test(JSON.stringify(stolen.payload)),
        `${stolen.status} ${stolen.payload.error ?? ""}`
      )
    );

    const stolenNotes = await api(`/api/sessions/${sessionA.id}/notes`, { token: userB.token });
    checks.push(
      check(
        "User B cannot read User A's notes",
        stolenNotes.status === 404 && !/private notes/i.test(JSON.stringify(stolenNotes.payload)),
        `${stolenNotes.status}`
      )
    );

    const stolenInterview = await api(
      `/api/sessions/${sessionA.id}/interrogations/a1000001-0001-4000-8000-000000000014`,
      { token: userB.token }
    );
    checks.push(
      check(
        "User B cannot read User A's interrogation",
        stolenInterview.status === 404,
        `${stolenInterview.status}`
      )
    );

    const stolenResult = await api(`/api/sessions/${sessionA.id}/result`, { token: userB.token });
    checks.push(
      check(
        "User B cannot read User A's result",
        stolenResult.status === 404 &&
          !/Isolde Hart|ground truth|last guest/i.test(JSON.stringify(stolenResult.payload)),
        `${stolenResult.status}`
      )
    );

    const owned = await getSession(sessionA.id, userA.id);
    const foreign = await getSession(sessionA.id, userB.id).then(
      () => ({ leaked: true }),
      (error: unknown) => ({
        leaked: false,
        status: error instanceof HttpError ? error.status : 0,
      })
    );
    checks.push(
      check("Ownership helper keeps User A's session", owned.user_id === userA.id, owned.id)
    );
    checks.push(
      check(
        "Ownership helper hides the session from User B",
        "status" in foreign && foreign.status === 404 && !foreign.leaked,
        "status" in foreign ? String(foreign.status) : "leaked"
      )
    );
  }

  const startB = await api("/api/sessions", {
    method: "POST",
    token: userB.token,
    body: JSON.stringify({ caseId: CASE_ID }),
  });
  const sessionB = startB.payload.data as { id?: string } | undefined;
  checks.push(
    check(
      "User B starts a separate session",
      startB.payload.success === true && Boolean(sessionB?.id) && sessionB?.id !== sessionA?.id,
      sessionB?.id ?? startB.payload.error ?? ""
    )
  );

  const cases = await api("/api/cases");
  checks.push(check("Public case list remains open", cases.status === 200, `${cases.status}`));

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
