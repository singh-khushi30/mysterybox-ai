-- Contradiction file. Apply in the Supabase SQL editor if not already present.
-- Explanations must stay player-safe: never store ground truth or hidden solutions.

create table if not exists detected_contradictions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references game_sessions (id) on delete cascade,
  suspect_id uuid not null references suspects (id) on delete cascade,
  statement text not null,
  evidence_id uuid references evidence (id) on delete set null,
  explanation text not null,
  confidence numeric not null
    check (confidence >= 0 and confidence <= 1),
  fingerprint text not null,
  discovered_at timestamptz not null default now()
);

create unique index if not exists detected_contradictions_unique_fingerprint
  on detected_contradictions (session_id, suspect_id, fingerprint);

create index if not exists idx_detected_contradictions_session_id
  on detected_contradictions (session_id, discovered_at);

create index if not exists idx_detected_contradictions_session_suspect
  on detected_contradictions (session_id, suspect_id, discovered_at);

alter table detected_contradictions enable row level security;

revoke all on table detected_contradictions from public, anon, authenticated;
grant all on table detected_contradictions to service_role;
