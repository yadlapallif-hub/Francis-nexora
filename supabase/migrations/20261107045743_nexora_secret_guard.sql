-- Best-effort rejection of recognizable private credentials. This is not a substitute for user care.
create or replace function public.nexora_contains_obvious_secret(value text) returns boolean
language sql immutable strict parallel safe set search_path = pg_catalog as $$
  select value ~* '(sb_secret_[A-Za-z0-9_-]{8,}|-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----|Bearer[[:space:]]+[A-Za-z0-9._~-]{20,}|(sk[-_]|ollama_)[A-Za-z0-9_-]{20,})'
$$;
alter table public.nexora_profiles add constraint nexora_profiles_no_obvious_secrets check (not public.nexora_contains_obvious_secret(display_name));
alter table public.nexora_conversations add constraint nexora_conversations_no_obvious_secrets check (not public.nexora_contains_obvious_secret(title));
alter table public.nexora_tasks add constraint nexora_tasks_no_obvious_secrets check (not public.nexora_contains_obvious_secret(title || ' ' || description));
alter table public.nexora_messages add constraint nexora_messages_no_obvious_secrets check (not public.nexora_contains_obvious_secret(content));
