-- Final accusation ledger. Apply in the Supabase SQL editor if not already present.
-- Ground truth must never be read from this table by the frontend; only scores
-- and the player's own submission are stored here. The solution is revealed
-- through GET /api/sessions/:id/result after the session is completed.

create table if not exists accusations (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique references game_sessions (id) on delete cascade,
  suspect_id uuid not null references suspects (id) on delete restrict,
  motive text not null,
  method text not null,
  reasoning text not null,
  submitted_evidence uuid[] not null default '{}',
  culprit_correct boolean not null,
  culprit_score integer not null
    check (culprit_score >= 0 and culprit_score <= 40),
  evidence_score integer not null
    check (evidence_score >= 0 and evidence_score <= 25),
  motive_score integer not null
    check (motive_score >= 0 and motive_score <= 15),
  reasoning_score integer not null
    check (reasoning_score >= 0 and reasoning_score <= 20),
  total_score integer not null
    check (total_score >= 0 and total_score <= 100),
  created_at timestamptz not null default now(),
  constraint accusations_total_matches_parts
    check (
      total_score = culprit_score + evidence_score + motive_score + reasoning_score
    )
);

create index if not exists idx_accusations_session_id on accusations (session_id);
create index if not exists idx_accusations_suspect_id on accusations (suspect_id);

alter table accusations enable row level security;

revoke all on table accusations from public, anon, authenticated;
grant all on table accusations to service_role;
