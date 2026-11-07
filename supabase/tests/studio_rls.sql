-- Run with an authorized database administrator. Fixtures are rolled back.
BEGIN;
CREATE TEMP TABLE studio_test_fixture (user_a uuid, user_b uuid, doc_b uuid) ON COMMIT DROP;
INSERT INTO studio_test_fixture SELECT gen_random_uuid(), gen_random_uuid(), gen_random_uuid();
INSERT INTO auth.users(id) SELECT user_a FROM studio_test_fixture UNION ALL SELECT user_b FROM studio_test_fixture;
INSERT INTO public.nexora_studio_documents(user_id, kind, title, data) SELECT user_a, 'resume', 'Fixture A', '{"name":"A"}'::jsonb FROM studio_test_fixture;
INSERT INTO public.nexora_studio_documents(id, user_id, kind, title, data) SELECT doc_b, user_b, 'certificate', 'Fixture B', '{"name":"B"}'::jsonb FROM studio_test_fixture;
SELECT set_config('request.jwt.claim.sub', user_a::text, true), set_config('nexora.studio_b', user_b::text, true), set_config('nexora.studio_doc_b', doc_b::text, true) FROM studio_test_fixture;
SET LOCAL ROLE authenticated;
DO $$
DECLARE n integer; blocked boolean;
BEGIN
  SELECT count(*) INTO n FROM public.nexora_studio_documents WHERE title LIKE 'Fixture %';
  IF n <> 1 THEN RAISE EXCEPTION 'Studio RLS read isolation failed'; END IF;
  blocked := false;
  BEGIN INSERT INTO public.nexora_studio_documents(user_id, kind, title, data) VALUES (current_setting('nexora.studio_b')::uuid, 'resume', 'Forbidden', '{}'::jsonb); EXCEPTION WHEN insufficient_privilege THEN blocked := true; END;
  IF NOT blocked THEN RAISE EXCEPTION 'Cross-user studio insert was not blocked'; END IF;
  UPDATE public.nexora_studio_documents SET title = 'Forbidden update' WHERE id = current_setting('nexora.studio_doc_b')::uuid; GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 0 THEN RAISE EXCEPTION 'Cross-user studio update was not blocked'; END IF;
  DELETE FROM public.nexora_studio_documents WHERE id = current_setting('nexora.studio_doc_b')::uuid; GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 0 THEN RAISE EXCEPTION 'Cross-user studio delete was not blocked'; END IF;
  blocked := false;
  BEGIN INSERT INTO public.nexora_studio_documents(user_id, kind, title, data) VALUES (auth.uid(), 'resume', 'Forbidden secret', jsonb_build_object('text', 'Bearer ' || repeat('x',30))); EXCEPTION WHEN check_violation THEN blocked := true; END;
  IF NOT blocked THEN RAISE EXCEPTION 'Recognizable secret was not blocked'; END IF;
END $$;
ROLLBACK;
