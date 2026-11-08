# FRANCIS — THINK. CREATE. BUILD. INNOVATE.

A cinematic, AI-powered personal portfolio platform for **Yadlapalli Francis** — one unified product with four pillars:

1. **Cinematic developer portfolio** — 9-scene scroll film (Three.js, Framer Motion, GSAP-class easing), white/navy/electric-blue identity.
2. **FRANCIS AI** — a general-purpose AI assistant for everyone: general knowledge, science, maths, programming, writing, productivity, learning — plus Francis/NEXORA/platform knowledge. Streaming, research mode with live web search + citations, document intelligence (PDF/TXT/DOCX), 4 modes, stop/regenerate/rename/delete, conversation privacy.
3. **Private Admin Control Studio** — `/admin`, Supabase-Auth gated, 18 sections: profile, about, skills, education, projects, experience, achievements, gallery, inbox, socials, theme/homepage/SEO with **draft → publish**, AI configuration, AI usage analytics, transparent-moderation-gated chat history.
4. **Live project showcase** — NEXORA AGENT featured with live link; projects are fully admin-editable.

## Stack

- Next.js 15 (App Router) · React 19 · TypeScript strict · Tailwind CSS 3.4
- Three.js hero scene · Framer Motion · Fontsource (Space Grotesk / Inter / JetBrains Mono)
- Supabase Postgres (RLS everywhere) + Supabase Auth + Supabase Storage + service-role API routes
- FRANCIS AI backend: any **OpenAI-compatible** Chat Completions endpoint (streaming SSE) — server-side only
- Live research: DuckDuckGo (no key) with optional Serper / Bing keys
- Documents: `unpdf` + `mammoth`, stored owner-scoped, 8 MB limit

## Local development

```bash
npm install
cp .env.example .env.local   # fill values (see below)
npm run dev                  # http://localhost:3000
```

Without env values the site still renders (bundled approved fallback content); the contact form and AI report honest "not configured" states instead of faking success.

## Environment variables

| Variable | Scope | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public | anon key used by browser/public reads |
| `SUPABASE_SERVICE_ROLE_KEY` | **server-only** | API routes: contact, AI persistence, analytics, rate limit |
| `NEXT_PUBLIC_SITE_URL` | public | canonical URL for sitemap/OG |
| `OPENAI_API_KEY` | **server-only** | FRANCIS AI provider key (required to activate AI) |
| `OPENAI_BASE_URL` | server-only | default `https://api.openai.com/v1` — any OpenAI-compatible endpoint |
| `AI_MODEL` | server-only | default `gpt-4o-mini` |
| `SEARCH_PROVIDER` | server-only | `duckduckgo` (default) · `serper` · `bing` |
| `SERPER_API_KEY` / `BING_API_KEY` | server-only | optional higher-quality search |

## Database

`supabase/schema.sql` (tables) → `supabase/rls.sql` (RLS + `is_admin()`) → `supabase/seed.sql` (Francis content). All idempotent. Enforced rules: anonymous visitors may **read** portfolio content only; chat sessions/messages are service-role only; message **content** is admin-readable only when the transparent moderation toggle (`ai_settings.allow_admin_content_view`) is ON — otherwise admins see metadata only.

## Admin

1. Create/confirm your Supabase Auth user, then: `insert into admin_users (user_id, email) select id, email from auth.users where email = 'you@example.com';`
2. Visit `/admin` — sign in — manage everything; **Save draft → Publish** for Theme, Homepage and SEO.

## Verifying

`npm run build && npm start` — all routes render; `/api/health` returns `{"ok":true}`; `/api/ai/status` reports AI configuration honestly.
