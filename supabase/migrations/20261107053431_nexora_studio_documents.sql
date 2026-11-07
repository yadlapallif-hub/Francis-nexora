-- User-owned resume and certificate drafts. Videos are processed locally and are not stored here.
create table public.nexora_studio_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('resume', 'certificate')),
  title text not null check (char_length(btrim(title)) between 1 and 120),
  data jsonb not null check (jsonb_typeof(data) = 'object' and octet_length(data::text) <= 64000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint nexora_studio_documents_no_obvious_secrets check (
    not public.nexora_contains_obvious_secret(title || ' ' || data::text)
  )
);
create index nexora_studio_documents_owner_kind_updated_idx on public.nexora_studio_documents (user_id, kind, updated_at desc);
alter table public.nexora_studio_documents enable row level security;
revoke all on public.nexora_studio_documents from public, anon, authenticated;
grant select, delete on public.nexora_studio_documents to authenticated;
grant insert (user_id, kind, title, data), update (title, data) on public.nexora_studio_documents to authenticated;
grant all on public.nexora_studio_documents to service_role;
create policy nexora_studio_documents_owner_select on public.nexora_studio_documents for select to authenticated using (user_id = (select auth.uid()));
create policy nexora_studio_documents_owner_insert on public.nexora_studio_documents for insert to authenticated with check (user_id = (select auth.uid()));
create policy nexora_studio_documents_owner_update on public.nexora_studio_documents for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy nexora_studio_documents_owner_delete on public.nexora_studio_documents for delete to authenticated using (user_id = (select auth.uid()));
create trigger nexora_studio_documents_touch before update on public.nexora_studio_documents for each row execute function public.nexora_touch_updated_at();
