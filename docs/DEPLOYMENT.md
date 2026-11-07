# Deployment and acceptance

## Supabase

1. Choose the correct Supabase project. Apply the versioned migrations in `supabase/migrations` (for a new project, the Supabase CLI can link the project and run `supabase db push`; do not reapply migrations already present in its migration history).
2. Deploy `supabase/functions/nexora-chat` using `supabase functions deploy nexora-chat` with JWT verification enabled. The function uses Supabase-provided `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and server-only `SUPABASE_SERVICE_ROLE_KEY` runtime values. The service key must never be given to the browser.
3. In the Supabase dashboard's Edge Function secret store, set:
   - `OLLAMA_API_KEY`: the private Ollama Cloud key.
   - `OLLAMA_MODEL`: a model identifier actually available to that account, for example `<YOUR_AVAILABLE_MODEL>`.
   - `NEXORA_APP_ORIGIN`: exact allowed origins, comma-separated, for example `https://<YOUR_DOMAIN>,http://localhost:5173`. The fallback is `APP_ORIGIN`. Do not use `*` or a trailing slash.
4. Keep any existing Auth site URL and redirects used by other applications. Add the exact NEXORA production origin and needed preview/local callback URLs to the Auth redirect allowlist, e.g. `https://<YOUR_DOMAIN>/**`. Email confirmation is controlled by the project's existing Auth settings. The default Supabase email service has low limits and may not be suitable for production; configure a suitable SMTP provider when needed.
5. The transactional tests in `supabase/tests/rls_and_limits.sql` create temporary fixture users and roll everything back. Run them with an authorized database administrator in a suitable test project, then additionally test actual signed-in sessions from two different accounts. They test representative isolation and rate/concurrency cases, not every security property.

The secret store can also be populated with the Supabase CLI using a private local file outside the repository: `supabase secrets set --env-file <PRIVATE_ENV_FILE>`. Do not place real values in documentation, source control, shell history, or chat. Rotate any credential that has been exposed.

## Vercel

1. Connect the intended Git repository/project. Set the framework to **Vite**, install command to `npm ci`, build command to `npm run build`, and output directory to `dist`.
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel to the project's public URL and publishable/anon key. These values are intentionally exposed to browsers and rely on RLS. Never add a service-role or Ollama secret as a `VITE_` variable.
3. Deploy and inspect the build/deployment state. Add the exact production origin to `NEXORA_APP_ORIGIN` and Supabase Auth redirects. For each preview origin that needs authenticated AI access, explicitly allow that origin as well. Review Vercel deployment protection: a protected `vercel.app` domain may require Vercel authentication before users can reach the application.
4. Open the deployed site, perform the manual checklist below, and only then describe the deployment as functionally verified. A green build alone does not verify Auth, database access, CORS, or Ollama.

## Manual acceptance checklist

- [ ] Create an account, follow the confirmation email, sign in, sign out, and sign back in.
- [ ] Confirm the AI settings show **Not configured** before secrets are set, and only **Connected** after a real successful test.
- [ ] With a configured model and key, run the connection test and send a real message. Refresh and confirm the conversation persists; rename and delete it.
- [ ] With two real test users, confirm each can see only their own conversations, messages, tasks, memory, and activity.
- [ ] Create a manual task, change its status, refresh, and delete it. The status represents a user assertion, not an automatically verified result.
- [ ] Save/edit/delete a memory note; confirm it is not included in AI prompts in this release.
- [ ] Inspect browser source/network responses and logs for private keys. Do not intentionally insert secrets as test data.
- [ ] Verify an invalid/expired session, provider failure, and CORS misconfiguration produce a useful, sanitized error.
- [ ] Confirm planned approvals, automations, tools, local files, and the laptop companion are unavailable rather than falsely marked connected.

## Quotas and operational limits

The chat gateway allows at most 12 attempts per user per rolling 10 minutes and one in-flight request per user. A lease expires after 75 seconds; the provider timeout is 40 seconds. History is limited to the latest 20 messages and 30,000 characters. This is not a comprehensive global abuse-prevention system; monitor usage, configure provider spending limits, add retention/cleanup for request leases and audit events, and review quotas before public launch. Supabase, Vercel, and Ollama may impose limits or charges; no unlimited free inference or always-on scheduler is promised.
