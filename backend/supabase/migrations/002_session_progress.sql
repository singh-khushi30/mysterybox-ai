-- Session evidence progress. Apply in the Supabase SQL editor if not already present.
-- Never expose case_ground_truth from this change.

create table if not exists session_evidence (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references game_sessions (id) on delete cascade,
  evidence_id uuid not null references evidence (id) on delete cascade,
  discovered_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (session_id, evidence_id)
);

create index if not exists idx_session_evidence_session_id
  on session_evidence (session_id);

create index if not exists idx_session_evidence_evidence_id
  on session_evidence (evidence_id);

create unique index if not exists detective_notes_session_id_uidx
  on detective_notes (session_id);
