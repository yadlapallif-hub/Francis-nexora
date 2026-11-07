# Feature status — 2026-11-07

## Implemented and checked

- Responsive app shell with three browser-persisted background themes, email/password Auth integration, conversation UI, manual tasks, user-entered memory notes, profile settings, and a minimal activity log.
- Resume Builder with editable sections, live preview and browser Print / Save as PDF. Certificate Studio with two designs, accent colors, local PNG download, and browser Print / Save as PDF. Certificates are designs only, not verified or automatically accredited. Long text is scaled to fit and should be reviewed before printing.
- Account-owned resume and certificate drafts can be manually saved, reopened, updated and deleted. Drafts do not autosave; guest edits reset when signing in or leaving. No video files or projects are stored.
- Video Editing Hub previews a local file and re-records an approximate trim as WebM, optionally retaining audio. It uses browser media APIs and does not upload the video. Files are capped at 200 MB and clips at 120 seconds; export takes roughly the clip duration. Browser decoding/recording support varies. MP4 export, advanced timelines and effects are not implemented.
- The connected Supabase project has all eight NEXORA tables with RLS. Rollback-only live SQL tests passed for representative cross-user isolation, message-write denial, rate/concurrency guards and Studio secret-pattern rejection. A temporary acceptance check created two admin-confirmed fixture accounts, signed them in, and exercised owner draft create/read/update/delete plus cross-user read/insert/update/delete denial through the live REST API. Both users were deleted after the test. This did not test the email-confirmation flow or every policy.
- `nexora-chat` is deployed with JWT verification enabled. The authenticated gateway status returned 200 in the fixture test; a real provider test returned HTTP **402** with the sanitized `PROVIDER_PAYMENT_REQUIRED` error. An unauthenticated GET was rejected at the gateway. Mocked Edge tests cover auth, CORS, configuration, idempotency, limits, provider failures and malformed responses; mocked success is not evidence of live inference.
- Local automated tests and production build pass. Desktop/mobile browser checks exercised editing, layout, real certificate PNG generation, resume and certificate PDFs, and local WebM exports with and without audio. PDFs were inspected for page count and text; the video exports were inspected for duration and streams. These checks do not establish support for every browser, file format, or large file.
- The Vercel project is configured for Vite and has a production deployment; verify the deployment state and current commit in Vercel after release. Protected unique preview URLs can require Vercel authentication.

## Configured but not fully verified

- The project has an `OLLAMA_MODEL` setting (`gpt-oss:120b` when last checked) and `OLLAMA_API_KEY` secret name, but the latest real provider request returned **402 Payment Required** and no successful inference was verified. Review the Ollama account plan/credits, then sign in and run the connection test again. Do not paste keys into chat or frontend settings.
- Fixture sign-in was performed with admin-confirmed test accounts; real email signup/confirmation and a production-browser authenticated flow remain to be accepted by the owner. The existing shared Auth site URL and confirmation settings were preserved.
- A key-like value was previously entered as a secret name. The owner was advised to revoke that exposed credential and remove the mistaken entry. The shared provider key is usable by signed-in users; control sign-ups and monitor usage and spending.

## Partial or not implemented

- Manual task CRUD exists, but AI planning, task steps, autonomous execution, verified outcomes, and cancellation are not implemented.
- Memory CRUD and a preference flag exist, but memory is not used as AI context.
- Approval Center, exact-action approval enforcement, tool registry/execution, automations/scheduling, files/projects, local Ollama, Windows companion, device pairing/revocation, and high-impact actions are not implemented. The UI labels these unavailable.
- Chat is non-streaming and cannot be stopped once sent. Password recovery and pagination beyond the latest 100 listed tasks/conversations/memories/drafts are not implemented.
- Audit logging is minimal and best-effort. A public launch needs broader abuse controls, retention/cleanup, monitoring, and a security review.
