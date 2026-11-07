# Feature status — 2026-11-07

## Implemented and checked

- Responsive app shell, signed-out states, email/password Auth integration, conversation UI, manual tasks, user-entered memory notes, profile settings, and a minimal activity log.
- Supabase core and secret-pattern migrations applied to the connected project; all seven NEXORA tables have RLS enabled. Rollback-only live SQL checks passed for representative cross-user conversation reads/inserts, foreign conversation claims, direct message-write denial, and rate/concurrency guards.
- `nexora-chat` deployed and marked ACTIVE with JWT verification enabled. An unauthenticated live GET was rejected by the Supabase gateway. The function is covered by mocked tests for authorization, exact-origin CORS, configuration errors, idempotent replay, rate/concurrency errors, provider failures, timeouts, and malformed responses.
- Local production build and all 18 automated tests pass, with no remaining test failures. Browser layout was inspected at desktop and mobile widths; a browser smoke test used mocked Auth/database responses to exercise manual task creation and status updates. These mocks do not prove live integrations work.
- Vercel reports the production deployment as READY and promoted. The public production landing page was retrieved successfully; a separate deployment file-tree API request returned 404, so its file tree was not verified through that API. Vercel protects the unique deployment/preview URLs with its login; the production project domain was publicly reachable during the check.

## Configured but not fully verified

- Supabase Auth sign-up/sign-in and real authenticated Edge Function calls have not been exercised with a real confirmed user in this environment. The project's existing email confirmation and Auth site URL were preserved; NEXORA redirect origins were added.
- The Vercel project has Vite build settings and public Supabase frontend environment values configured. The public landing page was checked, but deployed sign-up/sign-in, authenticated data access, and AI chat still require live acceptance testing.
- Ollama Cloud is **not configured**: no `OLLAMA_API_KEY` or `OLLAMA_MODEL` was present in the connected function secret store during setup. No live model request has succeeded or been claimed. Configure both privately in Supabase, then run the real connection test.

## Partial or not implemented

- Manual task CRUD exists, but AI planning, task steps, autonomous execution, verified outcomes, and cancellation are not implemented.
- Memory CRUD and a preference flag exist, but memory is not used as AI context.
- Approval Center, exact-action approval enforcement, tool registry/execution, automations/scheduling, files/projects, local Ollama, Windows companion, device pairing/revocation, and high-impact actions are not implemented. The UI labels these unavailable.
- Chat is non-streaming and cannot be stopped once sent. Password recovery and pagination beyond the latest 100 listed tasks/conversations/memories are not implemented.
- Audit logging is minimal and best-effort. A production deployment needs broader abuse controls, retention/cleanup, monitoring, and a security review.
