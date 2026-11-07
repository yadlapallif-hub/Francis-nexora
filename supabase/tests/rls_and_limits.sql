-- Run against an isolated project with a database administrator. All fixtures
-- are rolled back. A successful run produces no persistent users or records.
BEGIN;
CREATE TEMP TABLE nexora_rls_fixture (user_a uuid, user_b uuid, conversation_a uuid, conversation_b uuid) ON COMMIT DROP;
INSERT INTO nexora_rls_fixture SELECT gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid();
INSERT INTO auth.users(id) SELECT user_a FROM nexora_rls_fixture UNION ALL SELECT user_b FROM nexora_rls_fixture;
INSERT INTO public.nexora_conversations(id, user_id, title) SELECT conversation_a, user_a, 'RLS fixture A' FROM nexora_rls_fixture UNION ALL SELECT conversation_b, user_b, 'RLS fixture B' FROM nexora_rls_fixture;
SELECT set_config('request.jwt.claim.sub', user_a::text, true), set_config('nexora.fixture_b', user_b::text, true), set_config('nexora.conversation_b', conversation_b::text, true) FROM nexora_rls_fixture;
SET LOCAL ROLE authenticated;
DO $$
DECLARE visible_count integer; blocked boolean;
BEGIN
  SELECT count(*) INTO visible_count FROM public.nexora_conversations WHERE title LIKE 'RLS fixture%';
  IF visible_count <> 1 THEN RAISE EXCEPTION 'RLS isolation failed: expected exactly one visible conversation'; END IF;
  blocked := false;
  BEGIN INSERT INTO public.nexora_conversations(user_id, title) VALUES (current_setting('nexora.fixture_b')::uuid, 'Forbidden'); EXCEPTION WHEN insufficient_privilege THEN blocked := true; END;
  IF NOT blocked THEN RAISE EXCEPTION 'Cross-user insert was not blocked'; END IF;
  blocked := false;
  BEGIN PERFORM public.nexora_claim_chat_request(current_setting('nexora.conversation_b')::uuid); EXCEPTION WHEN OTHERS THEN IF SQLERRM = 'NEXORA_NOT_FOUND' THEN blocked := true; ELSE RAISE; END IF; END;
  IF NOT blocked THEN RAISE EXCEPTION 'Cross-user chat claim was not blocked'; END IF;
  IF has_table_privilege('authenticated', 'public.nexora_messages', 'INSERT') THEN RAISE EXCEPTION 'Client can forge messages'; END IF;
END $$;
ROLLBACK;

BEGIN;
CREATE TEMP TABLE nexora_limit_fixture (user_busy uuid, user_limited uuid) ON COMMIT DROP;
INSERT INTO nexora_limit_fixture SELECT gen_random_uuid(), gen_random_uuid();
INSERT INTO auth.users(id) SELECT user_busy FROM nexora_limit_fixture UNION ALL SELECT user_limited FROM nexora_limit_fixture;
INSERT INTO public.nexora_chat_requests(user_id, status) SELECT user_busy, 'running' FROM nexora_limit_fixture;
INSERT INTO public.nexora_chat_requests(user_id, status) SELECT user_limited, 'finished' FROM nexora_limit_fixture, generate_series(1, 12);
SELECT set_config('nexora.busy_user', user_busy::text, true), set_config('nexora.limited_user', user_limited::text, true) FROM nexora_limit_fixture;
SET LOCAL ROLE authenticated;
DO $$
DECLARE blocked boolean;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', current_setting('nexora.busy_user'), true);
  blocked := false;
  BEGIN PERFORM public.nexora_claim_chat_request(NULL); EXCEPTION WHEN OTHERS THEN IF SQLERRM = 'NEXORA_BUSY' THEN blocked := true; ELSE RAISE; END IF; END;
  IF NOT blocked THEN RAISE EXCEPTION 'Concurrency limit did not block the second request'; END IF;
  PERFORM set_config('request.jwt.claim.sub', current_setting('nexora.limited_user'), true);
  blocked := false;
  BEGIN PERFORM public.nexora_claim_chat_request(NULL); EXCEPTION WHEN OTHERS THEN IF SQLERRM = 'NEXORA_RATE_LIMIT' THEN blocked := true; ELSE RAISE; END IF; END;
  IF NOT blocked THEN RAISE EXCEPTION 'Request rate limit did not trigger'; END IF;
END $$;
ROLLBACK;
