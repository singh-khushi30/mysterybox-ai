-- RAG knowledge base. Apply in the Supabase SQL editor if not already present.
-- Ground-truth rows must never be queried by frontend or default suspect retrieval.

create extension if not exists vector;

create table if not exists case_knowledge (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases (id) on delete cascade,
  suspect_id uuid references suspects (id) on delete set null,
  source_type text not null
    check (source_type in ('case', 'suspect', 'evidence', 'timeline', 'ground_truth')),
  source_id uuid,
  content text not null,
  visibility text not null
    check (visibility in ('PUBLIC', 'PRIVATE', 'SECRET', 'GROUND_TRUTH')),
  importance text not null default 'medium'
    check (importance in ('low', 'medium', 'high', 'critical')),
  metadata jsonb not null default '{}'::jsonb,
  embedding vector(768),
  created_at timestamptz not null default now()
);

create index if not exists idx_case_knowledge_case_id
  on case_knowledge (case_id);

create index if not exists idx_case_knowledge_case_visibility
  on case_knowledge (case_id, visibility);

create index if not exists idx_case_knowledge_suspect_id
  on case_knowledge (suspect_id);

create index if not exists idx_case_knowledge_source
  on case_knowledge (source_type, source_id);

create index if not exists idx_case_knowledge_embedding
  on case_knowledge
  using hnsw (embedding vector_cosine_ops);

alter table case_knowledge enable row level security;

revoke all on table case_knowledge from public, anon, authenticated;
grant all on table case_knowledge to service_role;

create or replace function match_case_knowledge(
  query_embedding vector(768),
  filter_case_id uuid,
  allowed_visibility text[],
  match_count integer default 8,
  filter_suspect_id uuid default null
)
returns table (
  id uuid,
  case_id uuid,
  suspect_id uuid,
  source_type text,
  source_id uuid,
  content text,
  visibility text,
  importance text,
  similarity double precision
)
language sql
stable
as $$
  select
    k.id,
    k.case_id,
    k.suspect_id,
    k.source_type,
    k.source_id,
    k.content,
    k.visibility,
    k.importance,
    (1 - (k.embedding <=> query_embedding))::double precision as similarity
  from case_knowledge k
  where k.case_id = filter_case_id
    and k.embedding is not null
    and k.visibility = any(allowed_visibility)
    and k.visibility <> 'GROUND_TRUTH'
    and (
      k.visibility = 'PUBLIC'
      or (
        filter_suspect_id is not null
        and k.visibility in ('PRIVATE', 'SECRET')
        and k.suspect_id = filter_suspect_id
      )
    )
  order by k.embedding <=> query_embedding
  limit greatest(1, least(coalesce(match_count, 8), 24));
$$;

revoke all on function match_case_knowledge(vector, uuid, text[], integer, uuid)
  from public, anon, authenticated;
grant execute on function match_case_knowledge(vector, uuid, text[], integer, uuid)
  to service_role;
