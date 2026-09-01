-- MysteryBox core schema
-- Apply in the Supabase SQL editor or via the CLI.
-- case_ground_truth is secret game data and must never be queried from the frontend.

create extension if not exists pgcrypto;

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table cases (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text not null,
  difficulty text not null default 'medium'
    check (difficulty in ('easy', 'medium', 'hard')),
  estimated_minutes integer not null default 25
    check (estimated_minutes > 0),
  cover_image_url text,
  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now()
);

create table suspects (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases (id) on delete cascade,
  name text not null,
  age integer check (age is null or (age > 0 and age < 130)),
  occupation text,
  relationship_to_victim text,
  bio text,
  public_alibi text,
  portrait_url text,
  personality text,
  created_at timestamptz not null default now()
);

create table evidence (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases (id) on delete cascade,
  title text not null,
  type text not null
    check (type in ('cctv', 'receipt', 'phone', 'photograph', 'statement', 'object')),
  description text not null,
  file_url text,
  location_found text,
  discovered_by_default boolean not null default false,
  is_red_herring boolean not null default false,
  importance text not null default 'medium'
    check (importance in ('low', 'medium', 'high', 'critical')),
  created_at timestamptz not null default now()
);

create table timeline_events (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases (id) on delete cascade,
  event_time timestamptz not null,
  public_description text not null,
  hidden_description text,
  related_suspect_id uuid references suspects (id) on delete set null,
  related_evidence_id uuid references evidence (id) on delete set null,
  sequence integer not null default 0,
  created_at timestamptz not null default now()
);

create table case_ground_truth (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null unique references cases (id) on delete cascade,
  culprit_id uuid not null references suspects (id) on delete restrict,
  motive text not null,
  method text not null,
  time_of_crime timestamptz not null,
  location text not null,
  solution_explanation text not null,
  created_at timestamptz not null default now()
);

create table game_sessions (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases (id) on delete cascade,
  status text not null default 'in_progress'
    check (status in ('in_progress', 'completed', 'abandoned')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  score integer check (score is null or score >= 0),
  constraint completed_session_has_timestamp check (
    status <> 'completed' or completed_at is not null
  )
);

create table interrogation_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references game_sessions (id) on delete cascade,
  suspect_id uuid not null references suspects (id) on delete cascade,
  role text not null
    check (role in ('detective', 'suspect')),
  content text not null,
  created_at timestamptz not null default now()
);

create table detective_notes (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references game_sessions (id) on delete cascade,
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger detective_notes_set_updated_at
before update on detective_notes
for each row
execute procedure set_updated_at();

create index idx_cases_status on cases (status);
create index idx_suspects_case_id on suspects (case_id);
create index idx_evidence_case_id on evidence (case_id);
create index idx_evidence_case_id_type on evidence (case_id, type);
create index idx_timeline_events_case_id_sequence on timeline_events (case_id, sequence);
create index idx_timeline_events_related_suspect_id on timeline_events (related_suspect_id);
create index idx_timeline_events_related_evidence_id on timeline_events (related_evidence_id);
create index idx_case_ground_truth_culprit_id on case_ground_truth (culprit_id);
create index idx_game_sessions_case_id on game_sessions (case_id);
create index idx_game_sessions_status on game_sessions (status);
create index idx_interrogation_messages_session_id on interrogation_messages (session_id);
create index idx_interrogation_messages_session_suspect
  on interrogation_messages (session_id, suspect_id, created_at);
create index idx_detective_notes_session_id on detective_notes (session_id);
