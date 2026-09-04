-- Auth, profiles, and user-owned session security.
-- Apply in the Supabase SQL editor if not already present.
-- case_ground_truth must never become readable by anon or authenticated roles.

create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default 'Detective',
  detective_rank text not null default 'Rookie Detective',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_created_at on profiles (created_at);

drop trigger if exists profiles_set_updated_at on profiles;
create trigger profiles_set_updated_at
before update on profiles
for each row
execute procedure set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  chosen_name text;
begin
  chosen_name := nullif(trim(new.raw_user_meta_data ->> 'display_name'), '');
  if chosen_name is null then
    chosen_name := nullif(split_part(coalesce(new.email, ''), '@', 1), '');
  end if;
  if chosen_name is null then
    chosen_name := 'Detective';
  end if;

  insert into public.profiles (id, display_name, detective_rank)
  values (new.id, chosen_name, 'Rookie Detective')
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table game_sessions
  add column if not exists user_id uuid references auth.users (id) on delete cascade;

create index if not exists idx_game_sessions_user_id on game_sessions (user_id);
create index if not exists idx_game_sessions_user_case_status
  on game_sessions (user_id, case_id, status);

-- Lock user-owned tables. Service role still bypasses RLS; Express must
-- also check session ownership before touching another detective's file.

alter table profiles enable row level security;
alter table game_sessions enable row level security;
alter table detective_notes enable row level security;
alter table session_evidence enable row level security;
alter table interrogation_messages enable row level security;
alter table detected_contradictions enable row level security;
alter table accusations enable row level security;
alter table case_ground_truth enable row level security;

revoke all on table profiles from public, anon, authenticated;
revoke all on table game_sessions from public, anon, authenticated;
revoke all on table detective_notes from public, anon, authenticated;
revoke all on table session_evidence from public, anon, authenticated;
revoke all on table interrogation_messages from public, anon, authenticated;
revoke all on table detected_contradictions from public, anon, authenticated;
revoke all on table accusations from public, anon, authenticated;
revoke all on table case_ground_truth from public, anon, authenticated;

grant all on table profiles to service_role;
grant all on table game_sessions to service_role;
grant all on table detective_notes to service_role;
grant all on table session_evidence to service_role;
grant all on table interrogation_messages to service_role;
grant all on table detected_contradictions to service_role;
grant all on table accusations to service_role;
grant all on table case_ground_truth to service_role;

grant select, insert, update on table profiles to authenticated;
grant select, insert, update on table game_sessions to authenticated;
grant select, insert, update on table detective_notes to authenticated;
grant select, insert, update on table session_evidence to authenticated;
grant select, insert on table interrogation_messages to authenticated;
grant select, insert on table detected_contradictions to authenticated;
grant select, insert on table accusations to authenticated;

drop policy if exists profiles_select_own on profiles;
create policy profiles_select_own
  on profiles for select
  to authenticated
  using (id = auth.uid());

drop policy if exists profiles_update_own on profiles;
create policy profiles_update_own
  on profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists profiles_insert_own on profiles;
create policy profiles_insert_own
  on profiles for insert
  to authenticated
  with check (id = auth.uid());

drop policy if exists game_sessions_select_own on game_sessions;
create policy game_sessions_select_own
  on game_sessions for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists game_sessions_insert_own on game_sessions;
create policy game_sessions_insert_own
  on game_sessions for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists game_sessions_update_own on game_sessions;
create policy game_sessions_update_own
  on game_sessions for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists detective_notes_select_own on detective_notes;
create policy detective_notes_select_own
  on detective_notes for select
  to authenticated
  using (
    exists (
      select 1 from game_sessions
      where game_sessions.id = detective_notes.session_id
        and game_sessions.user_id = auth.uid()
    )
  );

drop policy if exists detective_notes_write_own on detective_notes;
create policy detective_notes_write_own
  on detective_notes for insert
  to authenticated
  with check (
    exists (
      select 1 from game_sessions
      where game_sessions.id = detective_notes.session_id
        and game_sessions.user_id = auth.uid()
    )
  );

drop policy if exists detective_notes_update_own on detective_notes;
create policy detective_notes_update_own
  on detective_notes for update
  to authenticated
  using (
    exists (
      select 1 from game_sessions
      where game_sessions.id = detective_notes.session_id
        and game_sessions.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from game_sessions
      where game_sessions.id = detective_notes.session_id
        and game_sessions.user_id = auth.uid()
    )
  );

drop policy if exists session_evidence_select_own on session_evidence;
create policy session_evidence_select_own
  on session_evidence for select
  to authenticated
  using (
    exists (
      select 1 from game_sessions
      where game_sessions.id = session_evidence.session_id
        and game_sessions.user_id = auth.uid()
    )
  );

drop policy if exists session_evidence_insert_own on session_evidence;
create policy session_evidence_insert_own
  on session_evidence for insert
  to authenticated
  with check (
    exists (
      select 1 from game_sessions
      where game_sessions.id = session_evidence.session_id
        and game_sessions.user_id = auth.uid()
    )
  );

drop policy if exists interrogation_messages_select_own on interrogation_messages;
create policy interrogation_messages_select_own
  on interrogation_messages for select
  to authenticated
  using (
    exists (
      select 1 from game_sessions
      where game_sessions.id = interrogation_messages.session_id
        and game_sessions.user_id = auth.uid()
    )
  );

drop policy if exists interrogation_messages_insert_own on interrogation_messages;
create policy interrogation_messages_insert_own
  on interrogation_messages for insert
  to authenticated
  with check (
    exists (
      select 1 from game_sessions
      where game_sessions.id = interrogation_messages.session_id
        and game_sessions.user_id = auth.uid()
    )
  );

drop policy if exists detected_contradictions_select_own on detected_contradictions;
create policy detected_contradictions_select_own
  on detected_contradictions for select
  to authenticated
  using (
    exists (
      select 1 from game_sessions
      where game_sessions.id = detected_contradictions.session_id
        and game_sessions.user_id = auth.uid()
    )
  );

drop policy if exists detected_contradictions_insert_own on detected_contradictions;
create policy detected_contradictions_insert_own
  on detected_contradictions for insert
  to authenticated
  with check (
    exists (
      select 1 from game_sessions
      where game_sessions.id = detected_contradictions.session_id
        and game_sessions.user_id = auth.uid()
    )
  );

drop policy if exists accusations_select_own on accusations;
create policy accusations_select_own
  on accusations for select
  to authenticated
  using (
    exists (
      select 1 from game_sessions
      where game_sessions.id = accusations.session_id
        and game_sessions.user_id = auth.uid()
    )
  );

drop policy if exists accusations_insert_own on accusations;
create policy accusations_insert_own
  on accusations for insert
  to authenticated
  with check (
    exists (
      select 1 from game_sessions
      where game_sessions.id = accusations.session_id
        and game_sessions.user_id = auth.uid()
    )
  );

-- No policies on case_ground_truth: anon/authenticated cannot read the solution.
