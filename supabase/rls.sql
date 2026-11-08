-- FRANCIS — Row Level Security + admin helper. Idempotent.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid())
$$;

alter table public.profiles          enable row level security;
alter table public.about_sections    enable row level security;
alter table public.skills            enable row level security;
alter table public.education         enable row level security;
alter table public.projects          enable row level security;
alter table public.experience        enable row level security;
alter table public.achievements      enable row level security;
alter table public.gallery           enable row level security;
alter table public.social_links      enable row level security;
alter table public.website_settings  enable row level security;
alter table public.contact_messages  enable row level security;
alter table public.chat_sessions     enable row level security;
alter table public.chat_messages     enable row level security;
alter table public.ai_settings       enable row level security;
alter table public.ai_usage_logs     enable row level security;
alter table public.knowledge_documents enable row level security;
alter table public.admin_users       enable row level security;

-- Public read for portfolio content (anyone, including anonymous visitors)
do $$
declare t text;
begin
  foreach t in array array['profiles','about_sections','skills','education','projects','experience','achievements','gallery','social_links','website_settings','ai_settings']
  loop
    execute format('drop policy if exists "public read %1$s" on public.%1$s', t);
    execute format('create policy "public read %1$s" on public.%1$s for select using (true)', t);
  end loop;
end $$;

-- Admin full access for portfolio content
do $$
declare t text;
begin
  foreach t in array array['profiles','about_sections','skills','education','projects','experience','achievements','gallery','social_links','website_settings','ai_settings']
  loop
    execute format('drop policy if exists "admin write %1$s" on public.%1$s', t);
    execute format('create policy "admin write %1$s" on public.%1$s for all using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

-- Contact messages: public cannot read; admin can read/update/delete. Inserts happen server-side (service role).
drop policy if exists "admin read contact" on public.contact_messages;
create policy "admin read contact" on public.contact_messages for select using (public.is_admin());
drop policy if exists "admin update contact" on public.contact_messages;
create policy "admin update contact" on public.contact_messages for all using (public.is_admin()) with check (public.is_admin());

-- AI usage analytics: admin-only read; inserts server-side.
drop policy if exists "admin read usage" on public.ai_usage_logs;
create policy "admin read usage" on public.ai_usage_logs for select using (public.is_admin());

-- Chat history moderation: admin sees session metadata; message CONTENT only when the
-- platform's transparent moderation toggle (ai_settings.allow_admin_content_view) is ON.
drop policy if exists "admin read sessions" on public.chat_sessions;
create policy "admin read sessions" on public.chat_sessions for select using (public.is_admin());
drop policy if exists "admin read messages gated" on public.chat_messages;
create policy "admin read messages gated" on public.chat_messages for select using (
  public.is_admin() and coalesce((select allow_admin_content_view from public.ai_settings where id = 1), false)
);
drop policy if exists "admin delete sessions" on public.chat_sessions;
create policy "admin delete sessions" on public.chat_sessions for delete using (public.is_admin());
drop policy if exists "admin delete messages" on public.chat_messages;
create policy "admin delete messages" on public.chat_messages for delete using (public.is_admin());

-- knowledge_documents & direct chat writes: service role only (no public/anon policies).

-- Admin users table: visible to admins only
drop policy if exists "admin read admins" on public.admin_users;
create policy "admin read admins" on public.admin_users for select using (public.is_admin());

-- Keep updated_at fresh
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
drop trigger if exists website_settings_touch on public.website_settings;
create trigger website_settings_touch before update on public.website_settings for each row execute function public.touch_updated_at();
drop trigger if exists ai_settings_touch on public.ai_settings;
create trigger ai_settings_touch before update on public.ai_settings for each row execute function public.touch_updated_at();
drop trigger if exists chat_sessions_touch on public.chat_sessions;
create trigger chat_sessions_touch before update on public.chat_sessions for each row execute function public.touch_updated_at();
