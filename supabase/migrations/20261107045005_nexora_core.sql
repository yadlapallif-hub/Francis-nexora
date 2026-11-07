-- NEXORA's tables are namespaced because this project may be shared with other apps.
-- No service-role credential is needed by the browser.
create table public.nexora_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 80),
  memory_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.nexora_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New conversation' check (char_length(trim(title)) between 1 and 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);
create index nexora_conversations_user_updated_idx on public.nexora_conversations (user_id, updated_at desc);

create table public.nexora_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  request_id uuid not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(content) between 1 and 12000),
  created_at timestamptz not null default now(),
  foreign key (conversation_id, user_id) references public.nexora_conversations(id, user_id) on delete cascade,
  unique (user_id, request_id, role)
);
create index nexora_messages_conversation_created_idx on public.nexora_messages (conversation_id, created_at desc);

-- These are explicitly MANUAL tasks; no executor is attached to this table.
create table public.nexora_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 120),
  description text not null default '' check (char_length(description) <= 3000),
  status text not null default 'queued' check (status in ('queued', 'in_progress', 'completed', 'failed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index nexora_tasks_user_status_idx on public.nexora_tasks (user_id, status, updated_at desc);

-- Memory is explicitly user-entered and is not automatically sent to the model.
create table public.nexora_memory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 120),
  content text not null check (char_length(trim(content)) between 1 and 2000),
  constraint nexora_memory_no_obvious_secrets check (
    (title || ' ' || content) !~* '(sb_secret_[A-Za-z0-9_-]{8,}|-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----|Bearer[[:space:]]+[A-Za-z0-9._~-]{20,}|(sk[-_]|ollama_)[A-Za-z0-9_-]{20,})'
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index nexora_memory_user_updated_idx on public.nexora_memory (user_id, updated_at desc);

create table public.nexora_audit_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check (char_length(event_type) <= 80),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index nexora_audit_user_created_idx on public.nexora_audit_events (user_id, created_at desc);

-- A DB-backed lease serializes per-user requests across Edge Function instances.
create table public.nexora_chat_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  conversation_id uuid references public.nexora_conversations(id) on delete set null,
  status text not null default 'running' check (status in ('running', 'finished', 'failed')),
  created_at timestamptz not null default now(),
  finished_at timestamptz
);
create index nexora_chat_requests_limit_idx on public.nexora_chat_requests (user_id, created_at desc);

alter table public.nexora_profiles enable row level security;
alter table public.nexora_conversations enable row level security;
alter table public.nexora_messages enable row level security;
alter table public.nexora_tasks enable row level security;
alter table public.nexora_memory enable row level security;
alter table public.nexora_audit_events enable row level security;
alter table public.nexora_chat_requests enable row level security;

revoke all on public.nexora_profiles, public.nexora_conversations, public.nexora_messages,
  public.nexora_tasks, public.nexora_memory, public.nexora_audit_events, public.nexora_chat_requests
  from public, anon, authenticated;
grant select, delete on public.nexora_profiles to authenticated;
grant insert (id, display_name, memory_enabled), update (display_name, memory_enabled) on public.nexora_profiles to authenticated;
grant select, delete on public.nexora_conversations to authenticated;
grant insert (user_id, title), update (title) on public.nexora_conversations to authenticated;
grant select on public.nexora_messages to authenticated;
grant select, delete on public.nexora_tasks to authenticated;
grant insert (user_id, title, description, status), update (title, description, status) on public.nexora_tasks to authenticated;
grant select, delete on public.nexora_memory to authenticated;
grant insert (user_id, title, content), update (title, content) on public.nexora_memory to authenticated;
grant select on public.nexora_audit_events to authenticated;
grant all on public.nexora_profiles, public.nexora_conversations, public.nexora_messages,
  public.nexora_tasks, public.nexora_memory, public.nexora_audit_events, public.nexora_chat_requests to service_role;

create policy nexora_profiles_owner_select on public.nexora_profiles for select to authenticated using (id = (select auth.uid()));
create policy nexora_profiles_owner_insert on public.nexora_profiles for insert to authenticated with check (id = (select auth.uid()));
create policy nexora_profiles_owner_update on public.nexora_profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy nexora_profiles_owner_delete on public.nexora_profiles for delete to authenticated using (id = (select auth.uid()));
create policy nexora_conversations_owner_select on public.nexora_conversations for select to authenticated using (user_id = (select auth.uid()));
create policy nexora_conversations_owner_insert on public.nexora_conversations for insert to authenticated with check (user_id = (select auth.uid()));
create policy nexora_conversations_owner_update on public.nexora_conversations for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy nexora_conversations_owner_delete on public.nexora_conversations for delete to authenticated using (user_id = (select auth.uid()));
create policy nexora_messages_owner_select on public.nexora_messages for select to authenticated using (user_id = (select auth.uid()));
create policy nexora_tasks_owner_select on public.nexora_tasks for select to authenticated using (user_id = (select auth.uid()));
create policy nexora_tasks_owner_insert on public.nexora_tasks for insert to authenticated with check (user_id = (select auth.uid()));
create policy nexora_tasks_owner_update on public.nexora_tasks for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy nexora_tasks_owner_delete on public.nexora_tasks for delete to authenticated using (user_id = (select auth.uid()));
create policy nexora_memory_owner_select on public.nexora_memory for select to authenticated using (user_id = (select auth.uid()));
create policy nexora_memory_owner_insert on public.nexora_memory for insert to authenticated with check (user_id = (select auth.uid()));
create policy nexora_memory_owner_update on public.nexora_memory for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy nexora_memory_owner_delete on public.nexora_memory for delete to authenticated using (user_id = (select auth.uid()));
create policy nexora_audit_owner_select on public.nexora_audit_events for select to authenticated using (user_id = (select auth.uid()));
-- No direct client writes to messages, audit events, or request leases.

create or replace function public.nexora_touch_updated_at() returns trigger
language plpgsql set search_path = public, pg_temp as $$
begin new.updated_at = now(); return new; end $$;
create trigger nexora_profiles_touch before update on public.nexora_profiles for each row execute function public.nexora_touch_updated_at();
create trigger nexora_conversations_touch before update on public.nexora_conversations for each row execute function public.nexora_touch_updated_at();
create trigger nexora_tasks_touch before update on public.nexora_tasks for each row execute function public.nexora_touch_updated_at();
create trigger nexora_memory_touch before update on public.nexora_memory for each row execute function public.nexora_touch_updated_at();

create or replace function public.nexora_touch_conversation_on_message() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  update public.nexora_conversations set updated_at = now() where id = new.conversation_id and user_id = new.user_id;
  return new;
end $$;
create trigger nexora_message_touch_conversation after insert on public.nexora_messages for each row execute function public.nexora_touch_conversation_on_message();

create or replace function public.nexora_audit_task() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if tg_op = 'INSERT' then
    insert into public.nexora_audit_events(user_id, event_type, metadata) values (new.user_id, 'task.created', jsonb_build_object('status', new.status));
  elsif tg_op = 'DELETE' then
    if exists (select 1 from auth.users where id = old.user_id) then
      insert into public.nexora_audit_events(user_id, event_type, metadata) values (old.user_id, 'task.deleted', '{}'::jsonb);
    end if;
  elsif old.status is distinct from new.status then
    insert into public.nexora_audit_events(user_id, event_type, metadata) values (new.user_id, 'task.status_changed', jsonb_build_object('status', new.status));
  end if;
  if tg_op = 'DELETE' then return old; else return new; end if;
end $$;
create trigger nexora_task_audit after insert or update or delete on public.nexora_tasks for each row execute function public.nexora_audit_task();

create or replace function public.nexora_claim_chat_request(p_conversation_id uuid default null) returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_user uuid := auth.uid();
  v_id uuid;
begin
  if v_user is null then raise exception 'NEXORA_UNAUTHORIZED'; end if;
  -- Lock before all checks to make the rate and concurrency checks atomic across instances.
  perform pg_advisory_xact_lock(hashtextextended(v_user::text, 0));
  if p_conversation_id is not null and not exists (
    select 1 from public.nexora_conversations where id = p_conversation_id and user_id = v_user
  ) then raise exception 'NEXORA_NOT_FOUND'; end if;
  if exists (select 1 from public.nexora_chat_requests where user_id = v_user and status = 'running' and created_at > now() - interval '75 seconds')
    then raise exception 'NEXORA_BUSY'; end if;
  if (select count(*) from public.nexora_chat_requests where user_id = v_user and created_at > now() - interval '10 minutes') >= 12
    then raise exception 'NEXORA_RATE_LIMIT'; end if;
  insert into public.nexora_chat_requests(user_id, conversation_id) values (v_user, p_conversation_id) returning id into v_id;
  return v_id;
end $$;
revoke all on function public.nexora_claim_chat_request(uuid) from public, anon;
grant execute on function public.nexora_claim_chat_request(uuid) to authenticated;
