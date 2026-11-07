# NEXORA AGENT

**Your Digital Life. One Intelligent Space.**

Created & Developed by **FRANCIS**.

NEXORA is an incremental personal AI workspace: a React/TypeScript/Vite frontend, Supabase Auth and PostgreSQL with row-level security, and a server-side Supabase Edge Function for Ollama Cloud. The current build is a **core milestone**, not a fully autonomous agent. It does not execute commands, access local files, send messages, or run background automations.

## What works in this build

- Email/password sign-up, sign-in, sign-out, and saved user profiles via Supabase Auth.
- User-owned conversations, safely rendered Markdown, conversation search/rename/delete, response copy, and retry with an idempotency key.
- A server-only, authenticated Ollama Cloud chat gateway with a real connection-test action, bounded request/response sizes, timeout, a database-backed per-user rate/concurrency limit, and sanitized errors. **A real response requires an Ollama key and a supported model configured in Supabase.**
- Manual task tracking, user-entered memory notes, and a minimal activity log. Tasks are **not** automatically executed; memory is **not** sent to the model in this build.
- Responsive app shell with honest unavailable/not-configured states, plus Aurora, Forest, and Dusk background themes saved in the browser.

See [feature status and actual verification](docs/STATUS.md). Approvals, agent orchestration/tool execution, scheduled automations, local file access, and the Windows companion are **not implemented**. No high-impact action is available to bypass an approval gate.

## Run locally

Requirements: Node.js 20 or newer, npm, and a Supabase project. Copy `.env.example` to `.env.local` and fill in only the **public** project URL and publishable (or legacy anon) key from Supabase. Never put an Ollama key or a Supabase service-role key in a `VITE_` variable.

```sh
npm ci
npm run dev
npm test
npm run build
```

The frontend uses the current browser origin for email-confirmation redirects. Add the exact development origin to Supabase Auth's redirect allowlist and to `NEXORA_APP_ORIGIN` in the Edge Function secrets. See [deployment and configuration](docs/DEPLOYMENT.md) and [API contract](docs/API.md).

## Configure Ollama Cloud safely

In **Supabase Dashboard → Edge Functions → Secrets**, set `OLLAMA_API_KEY` and `OLLAMA_MODEL` to the private Ollama Cloud key and an actual model available to your Ollama account. Set `NEXORA_APP_ORIGIN` to a comma-separated list of exact trusted frontend origins. `APP_ORIGIN` is supported as a fallback; the namespaced setting avoids changing another app's shared configuration. The **AI Model Settings** page links directly to the owner-only Supabase secret store and Ollama key settings. Do not paste credentials into NEXORA, chat, or Git. The server key is shared by signed-in users, so control sign-ups and provider quotas. Sign in, open **AI Model Settings**, refresh the status, and use **Test connection**. The UI only reports connected after a successful real test or chat in that session.

## Security and testing

See [security notes](docs/SECURITY.md), [deployment and acceptance checklist](docs/DEPLOYMENT.md), and the versioned SQL migrations and rollback-only database tests in `supabase/`. Automated provider tests use mocks and do not prove a live provider connection. Treat generated content as suggestions, not verified actions; never enter passwords, API keys, or sensitive information in conversations, tasks, or memory.
