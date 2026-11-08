-- ═══════════════════════════════════════════════════════════════
-- FRANCIS — MASTER PROJECT DATABASE SCHEMA
-- Apply against the Supabase Postgres database (idempotent).
-- Safe to re-run. Nexora tables (nexora_*) are untouched.
-- ═══════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- ── Core portfolio content ──────────────────────────────────────

create table if not exists public.profiles (
  id text primary key default 'francis',
  full_name text not null,
  display_name text not null default 'FRANCIS',
  title text not null default 'Aspiring Software Engineer',
  education text,
  college text,
  location text,
  previous_education text,
  email text,
  instagram_url text,
  github_url text,
  linkedin_url text,
  whatsapp_url text,
  resume_url text,
  tagline text default 'THINK. CREATE. BUILD. INNOVATE.',
  intro text,
  avatar_url text,
  updated_at timestamptz not null default now()
);

create table if not exists public.about_sections (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  pillar text,
  display_order int not null default 0,
  visible boolean not null default true
);

create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default 'General',
  level int not null default 70 check (level between 0 and 100),
  display_order int not null default 0,
  visible boolean not null default true
);

create table if not exists public.education (
  id uuid primary key default gen_random_uuid(),
  degree text not null,
  institution text not null,
  field text,
  start_year text,
  end_year text,
  status text default 'Pursuing',
  description text,
  display_order int not null default 0,
  visible boolean not null default true
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  tagline text,
  description text,
  technologies text[] not null default '{}',
  features text[] not null default '{}',
  live_url text,
  github_url text,
  image_url text,
  featured boolean not null default false,
  display_order int not null default 0,
  visible boolean not null default true
);

create table if not exists public.experience (
  id uuid primary key default gen_random_uuid(),
  role text not null,
  organization text not null,
  type text not null default 'Experience',
  start_date text,
  end_date text,
  current boolean not null default false,
  description text,
  display_order int not null default 0,
  visible boolean not null default true
);

create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  issuer text,
  year text,
  description text,
  url text,
  display_order int not null default 0,
  visible boolean not null default true
);

create table if not exists public.gallery (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  caption text,
  display_order int not null default 0,
  visible boolean not null default true
);

create table if not exists public.social_links (
  id uuid primary key default gen_random_uuid(),
  platform text not null unique,
  label text,
  url text not null default '',
  display_order int not null default 0,
  visible boolean not null default true
);

-- key → jsonb value; homepage/theme/seo values carry { live: {...}, draft: {...} }
create table if not exists public.website_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ── Contact ─────────────────────────────────────────────────────
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text,
  message text not null,
  status text not null default 'new' check (status in ('new','read','archived')),
  created_at timestamptz not null default now()
);

-- ── FRANCIS AI ──────────────────────────────────────────────────
create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  owner_token text not null,
  title text not null default 'New conversation',
  mode text not null default 'general',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists chat_sessions_owner_idx on public.chat_sessions(owner_token, updated_at desc);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  sources jsonb,
  mode text,
  created_at timestamptz not null default now()
);
create index if not exists chat_messages_session_idx on public.chat_messages(session_id, created_at);

create table if not exists public.ai_settings (
  id int primary key default 1 check (id = 1),
  enabled boolean not null default true,
  provider text not null default 'openai-compatible',
  model text not null default 'gpt-4o-mini',
  web_search boolean not null default true,
  max_response_tokens int not null default 2048,
  hourly_limit int not null default 30,
  allowed_uploads text[] not null default '{pdf,txt,docx}',
  personality text not null default '',
  welcome_message text not null default '',
  allow_admin_content_view boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_usage_logs (
  id uuid primary key default gen_random_uuid(),
  owner_token text,
  session_id uuid,
  mode text,
  tokens_in int default 0,
  tokens_out int default 0,
  latency_ms int default 0,
  search_used boolean not null default false,
  error text,
  created_at timestamptz not null default now()
);
create index if not exists ai_usage_logs_created_idx on public.ai_usage_logs(created_at desc);

create table if not exists public.knowledge_documents (
  id uuid primary key default gen_random_uuid(),
  owner_token text not null,
  name text not null,
  mime text,
  size_bytes int,
  extracted_text text not null,
  created_at timestamptz not null default now()
);
create index if not exists knowledge_documents_owner_idx on public.knowledge_documents(owner_token, created_at desc);

-- Admin allowlist (server-verified; service role used for privileged reads)
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

-- ── Admin notifications (added migration: admin_notifications) ─────────────
create table if not exists public.admin_notifications (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'system' check (kind in ('contact','ai','content','system')),
  severity text not null default 'info' check (severity in ('info','success','warning','critical')),
  title text not null,
  body text,
  section text not null default 'overview',
  metadata jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists admin_notifications_created_idx on public.admin_notifications (created_at desc);
create index if not exists admin_notifications_unread_idx on public.admin_notifications (read_at) where read_at is null;

alter table public.admin_notifications enable row level security;
drop policy if exists "admin read notifications" on public.admin_notifications;
create policy "admin read notifications" on public.admin_notifications for select using (public.is_admin());
drop policy if exists "admin update notifications" on public.admin_notifications;
create policy "admin update notifications" on public.admin_notifications for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin delete notifications" on public.admin_notifications;
create policy "admin delete notifications" on public.admin_notifications for delete using (public.is_admin());

create or replace function public.notify_contact_message()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.admin_notifications (kind, severity, title, body, section, metadata)
  values ('contact', 'info', 'New contact message — ' || coalesce(new.name, 'Unknown'),
          left(coalesce(new.message, ''), 240), 'messages',
          jsonb_build_object('contact_id', new.id, 'email', new.email, 'subject', new.subject));
  return new;
end $$;
drop trigger if exists on_contact_message on public.contact_messages;
create trigger on_contact_message after insert on public.contact_messages
  for each row execute function public.notify_contact_message();

create or replace function public.notify_ai_error()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.admin_notifications (kind, severity, title, body, section, metadata)
  values ('ai', 'warning', 'FRANCIS AI request failed',
          left(coalesce(new.error, 'Unknown error'), 240), 'ai-analytics',
          jsonb_build_object('usage_id', new.id, 'mode', new.mode, 'session_id', new.session_id));
  return new;
end $$;
drop trigger if exists on_ai_error on public.ai_usage_logs;
create trigger on_ai_error after insert on public.ai_usage_logs
  for each row when (new.error is not null) execute function public.notify_ai_error();
