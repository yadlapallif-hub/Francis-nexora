import type { PortfolioData, ChatMode, SearchSource } from '@/lib/types';

export interface LocalReplyOptions {
  message: string;
  mode: ChatMode;
  portfolio: PortfolioData;
  documentExcerpt?: string | null;
  documentName?: string | null;
  sources: SearchSource[];
  searchAttempted: boolean;
}

/**
 * FRANCIS AI — Local engine.
 *
 * Runs server-side with NO external API key. It is honest by design: every
 * answer is composed from (a) the live approved portfolio database, (b) the
 * owner's uploaded document, (c) live web results when Research mode
 * retrieved them, (d) small embedded curated knowledge for common topics, or
 * (e) a plain statement of what it cannot do. It never fabricates citations,
 * never pretends to be a frontier LLM, and never invents Francis facts.
 * Replies always end with the local-mode notice.
 */

const LOCAL_NOTE =
  '\n\n---\n⚡ **Local mode** — FRANCIS AI answered on-site from the platform’s built-in engine (no cloud LLM key configured). Add `OPENAI_API_KEY` in Vercel → Settings → Environment Variables to unlock fully general reasoning, long context and unrestricted generation.';

/* ───────────────────────── helpers ───────────────────────── */

const words = (text: string): string[] => text.toLowerCase().match(/[a-z0-9][a-z0-9+.#-]*/g) ?? [];

function overlapScore(query: string[], sentence: string): number {
  const set = new Set(words(sentence));
  let score = 0;
  for (const q of query) if (set.has(q)) score += 1;
  return score;
}

const sentenceSplit = (text: string): string[] =>
  text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"'(])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 24);

/** Strict arithmetic evaluator — only digits, operators, parens and dot allowed. */
function tryMath(message: string): string | null {
  const m = message.match(/(?:calculate|compute|evaluate|what is|solve)?\s*([-+*/().^\d\s%]{3,80})\s*\??\s*$/i);
  if (!m) return null;
  const expr = m[1].trim();
  if (!/\d/.test(expr) || !/^[-+*/().^\d\s%]+$/.test(expr)) return null;
  const sanitized = expr.replace(/\^/g, '**').replace(/%/g, '/100');
  try {
    // Input is whitelisted to arithmetic characters only — safe to evaluate.
    const value = Function(`"use strict"; return (${sanitized})`)() as unknown;
    if (typeof value !== 'number' || !Number.isFinite(value)) return null;
    const rounded = Math.round((value + Number.EPSILON) * 1e10) / 1e10;
    return `**${expr} = ${rounded}**\n\nComputed directly on the server. For symbolic maths, calculus or proofs, ask in Research mode once a cloud key is enabled.`;
  } catch {
    return null;
  }
}

function groupSkills(data: PortfolioData): string {
  const groups = new Map<string, string[]>();
  for (const s of data.skills) {
    const list = groups.get(s.category) ?? [];
    list.push(`${s.name} (${s.level})`);
    groups.set(s.category, list);
  }
  return [...groups.entries()].map(([cat, items]) => `**${cat}** — ${items.join(', ')}`).join('\n');
}

function describeProjects(data: PortfolioData): string {
  if (!data.projects.length) return 'No projects are published yet.';
  return data.projects
    .map((p) => {
      const tech = p.technologies?.length ? ` · Tech: ${p.technologies.join(', ')}` : '';
      const live = p.live_url ? ` · Live: [open](${p.live_url})` : '';
      return `- **${p.title}** — ${p.tagline ?? ''}${p.description ? ` ${p.description.slice(0, 180)}` : ''}${tech}${live}`;
    })
    .join('\n');
}

function describeEducation(data: PortfolioData): string {
  if (!data.education.length) return 'Education details are not published yet.';
  return data.education
    .map((e) => `- **${e.degree}** — ${e.institution}${e.field ? ` (${e.field})` : ''} · ${e.status ?? 'status unlisted'}`)
    .join('\n');
}

function describeContact(data: PortfolioData): string {
  const p = data.profile;
  const lines = [
    `- Email: [${p.email}](mailto:${p.email})`,
    `- Location: ${p.location ?? 'Visakhapatnam, Andhra Pradesh, India'}`,
  ];
  if (p.github_url) lines.push(`- GitHub: [github.com](${p.github_url})`);
  if (p.linkedin_url) lines.push(`- LinkedIn: [linkedin.com](${p.linkedin_url})`);
  if (p.instagram_url) lines.push(`- Instagram: [instagram.com](${p.instagram_url})`);
  if (p.whatsapp_url) lines.push(`- WhatsApp: [chat](${p.whatsapp_url})`);
  lines.push('', 'The fastest route is email — it lands straight in Francis’s admin inbox on this platform.');
  return lines.join('\n');
}

function describeFrancis(data: PortfolioData): string {
  const p = data.profile;
  return [
    `**${p.full_name}** — ${p.title}.`,
    '',
    p.intro ?? '',
    '',
    describeEducation(data),
    '',
    `Location: ${p.location ?? 'Visakhapatnam, Andhra Pradesh, India'}.`,
  ].filter(Boolean).join('\n');
}

/* ─────────────── curated mini knowledge bases ────────────── */

const PROGRAMMING_KB: Array<{ re: RegExp; answer: string }> = [
  {
    re: /\b(javascript|js)\b/i,
    answer: '**JavaScript** is the language of the web. Key ideas: single-threaded event loop, prototypes, `const`/`let` over `var`, async/await over raw callbacks, and `===` over `==`.\n\n```js\nconst getUser = async (id) => {\n  const res = await fetch(`/api/users/${id}`);\n  if (!res.ok) throw new Error(`HTTP ${res.status}`);\n  return res.json();\n};\n```\n\nWatch for: `this` binding in callbacks, floating promises, and mutation of shared state.',
  },
  {
    re: /\btypescript|ts\b/i,
    answer: '**TypeScript** adds static types to JavaScript. Prefer `strict: true`, discriminated unions for state machines, `unknown` over `any`, and `as const` for literal inference.\n\n```ts\ntype Result<T> = { ok: true; value: T } | { ok: false; error: string };\nconst unwrap = <T>(r: Result<T>): T => {\n  if (!r.ok) throw new Error(r.error);\n  return r.value;\n};\n```',
  },
  {
    re: /\breact\b/i,
    answer: '**React** — think UI = f(state). Hooks rules: only call hooks at the top level; keep state minimal and derived where possible; `useEffect` is for synchronisation with the outside world, not for data you can derive.\n\n```tsx\nfunction useDebounce<T>(value: T, ms = 300) {\n  const [v, setV] = useState(value);\n  useEffect(() => {\n    const t = setTimeout(() => setV(value), ms);\n    return () => clearTimeout(t);\n  }, [value, ms]);\n  return v;\n}\n```\n\nIn Next.js App Router, default to Server Components and add `\'use client\'` only where interactivity lives.',
  },
  {
    re: /\bnext\.?js|nextjs\b/i,
    answer: '**Next.js (App Router)**: file-system routing under `app/`, Server Components by default, Server Actions, route handlers in `route.ts`, streaming SSR, and first-class caching controls (`dynamic`, `revalidate`). Env vars prefixed `NEXT_PUBLIC_` ship to the browser; everything else stays server-only. This platform is built on exactly that stack.',
  },
  {
    re: /\bpython\b/i,
    answer: '**Python** — batteries-included, readability-first. Prefer virtualenvs, type hints (`mypy`), and f-strings.\n\n```python\ndef top_k(items: list[int], k: int) -> list[int]:\n    return sorted(items, reverse=True)[:k]\n```\n\nFor DSA, `heapq`, `collections.deque`, `Counter` and `bisect` cover most needs.',
  },
  {
    re: /\bjava\b/i,
    answer: '**Java** — strong typing, JVM ecosystem. Know collections (`ArrayList`, `HashMap`, `PriorityQueue`), streams, generics, and `Optional`. For interviews: big-O of `HashMap` get/put is O(1) average; `TreeMap` is O(log n). Prefer constructor injection and immutability.',
  },
  {
    re: /\bc\+\+|cpp\b/i,
    answer: '**C++** — know value vs reference semantics, RAII, `std::vector`/`unordered_map`, move semantics, and `auto`. In interviews, `unordered_map` ops are O(1) average; always free with RAII (`unique_ptr`/`shared_ptr`), never raw `new`/`delete` in modern code.',
  },
  {
    re: /\bsql\b/i,
    answer: '**SQL** — joins (`INNER`/`LEFT`), `GROUP BY` + aggregates, CTEs (`WITH …`), window functions (`ROW_NUMBER() OVER (PARTITION BY … ORDER BY …)`), and indexes on foreign keys.\n\n```sql\nSELECT department, AVG(salary) AS avg_sal\nFROM employees\nGROUP BY department\nHAVING AVG(salary) > 60000\nORDER BY avg_sal DESC;\n```\n\nRead the query plan (`EXPLAIN`) before tuning.',
  },
  {
    re: /\bgit\b/i,
    answer: '**Git** — `git switch -c feat/x`, atomic commits, `git rebase -i` to tidy history, `git restore` over `checkout`, and never rewrite shared history. `git log --oneline --graph` to see the shape of the repo. Resolve conflicts hunk by hunk; `git rerere` remembers how you solved them.',
  },
  {
    re: /\bdsa|algorithm|big.?o|data structure/i,
    answer: '**DSA strategy**: master arrays & hashing → two pointers → sliding window → binary search → stacks/queues → trees (traversals, BST) → heaps → graphs (BFS/DFS) → DP (start with 1-D states).\n\nBig-O cheat sheet: hashing O(1) avg, binary search O(log n), heap push/pop O(log n), comparison sort O(n log n). Always state constraints first — they hint at the target complexity (n ≤ 1e5 ⇒ O(n log n)).',
  },
  {
    re: /\bcss\b/i,
    answer: '**CSS** — flexbox for one-dimensional layouts, grid for two-dimensional. `gap` over margins, `clamp()` for fluid type, custom properties for theming, and `prefers-reduced-motion` for motion safety. This site uses Tailwind + CSS variables with exactly those principles.',
  },
  {
    re: /\bapi|rest|http\b/i,
    answer: '**APIs** — model resources, not actions: `GET /articles`, `POST /articles`, `GET /articles/:id`, `PATCH /articles/:id`, `DELETE /articles/:id`. Status codes: 200/201 read/create, 400 validation, 401 unauthenticated, 403 unauthorised, 404 missing, 429 rate-limited, 500 server fault. Always validate input server-side and paginate list endpoints.',
  },
  {
    re: /\bdocker\b/i,
    answer: '**Docker** — one process per container, small base images (`alpine`/`distroless`), multi-stage builds, non-root user, and never bake secrets into layers. `docker compose up` for local orchestration. Cache-friendly Dockerfiles copy `package.json` and install before copying source.',
  },
  {
    re: /\blinux|bash|shell\b/i,
    answer: '**Linux** — `grep -r`, `find . -name`, `awk`/`sed` for streams, `xargs`, `ps aux`, `ss -ltnp`, `journalctl -u`, and `curl -v` for HTTP debugging. Pipe small tools together; redirect with `>` `>>` `2>&1`. Use `shellcheck` for scripts and `set -euo pipefail` at the top.',
  },
];

const GENERAL_KB: Array<{ re: RegExp; answer: string }> = [
  {
    re: /\bartificial intelligence|machine learning|\bai\b|\bml\b/i,
    answer: '**AI/ML in brief** — Machine learning teaches models patterns from data instead of hand-coding rules. The pipeline: collect data → clean → features → train → validate → deploy → monitor. **LLMs** (like GPT/Claude families) predict the next token and are powerful general reasoners; **embeddings + vector search** power retrieval-augmented generation (RAG). Start with scikit-learn, then PyTorch; Andrew Ng’s courses are the standard on-ramp.',
  },
  {
    re: /\binternet|dns|how.*web.*work/i,
    answer: '**How the internet works** — Browsers resolve a name via DNS (recursive lookup → root → TLD → authoritative) to an IP, open a TCP+TLS connection, send HTTP, and receive a response. CDNs cache static assets near users; load balancers spread traffic; your ISP and BGP glue it all together. Ports: 80 HTTP, 443 HTTPS, 22 SSH, 25 SMTP.',
  },
  {
    re: /\b(cloud|devops)\b/i,
    answer: '**Cloud & DevOps** — Immutable infrastructure, CI/CD on every push, infrastructure as code, observability (logs/metrics/traces), and least-privilege IAM. On Vercel, every git push builds and promotes atomically; environment variables hold secrets; serverless functions scale per request. On AWS start with EC2/S3/IAM, then Lambda, then RDS.',
  },
  {
    re: /\bproductivity|time management|focus\b/i,
    answer: '**Productivity** — Time-block your top 3 outcomes each morning, work in 60–90 minute deep-focus sprints, silence notifications, and keep a capture inbox so your brain can let go. Weekly review: what shipped, what slipped, what to drop. Sleep beats supplements.',
  },
  {
    re: /\b(resume|cv)\b/i,
    answer: '**Résumé craft** — One page for students and early-career: quantified impact bullets (“built X, cut Y by 40%”), projects with live links, skills mirrored from the job description, no photos/objectives. ATS scans for keywords — mirror real ones you actually practise. Export as PDF, name it `francis-resume.pdf`, and keep a master file per role family.',
  },
  {
    re: /\b(career|internship|job)\b/i,
    answer: '**Career playbook** — Build in public: ship small things weekly, write short build-logs, and network with specificity (“I’m studying X, saw your work on Y”). For internships, apply early with tailored one-page résumés, a GitHub with real commit history, and 2–3 deployed projects. Cold email beats spray-and-pray. Francis’s portfolio and this very chat are proof of that loop.',
  },
  {
    re: /\b(learn|study).*(programming|code|cs)|how to learn\b/i,
    answer: '**Learning to program faster** — 70% building, 30% consuming. Pick one flagship project, ship incrementally, and read error messages literally. Type every example by hand, break it on purpose, then fix it. Spaced repetition for syntax; problem-solving reps for thinking. Teach what you learn — explaining exposes gaps instantly.',
  },
  {
    re: /\bdatabase|postgres|mongodb\b/i,
    answer: '**Databases** — Relational (Postgres/MySQL) for structured, transactional data with strong guarantees; document (MongoDB) for flexible shapes; key-value (Redis) for cache/queues. Normalise until you understand it, then denormalise only with evidence. Indexes serve reads, cost writes. Always enforce integrity in the schema, not just the app.',
  },
];

/* ─────────────────────── local composers ─────────────────── */

function tryProgramming(message: string): string | null {
  for (const { re, answer } of PROGRAMMING_KB) if (re.test(message)) return answer + LOCAL_NOTE;
  if (/\b(code|bug|error|exception|compile|debug|program|function|class|variable|loop|interview)\b/i.test(message)) {
    return [
      '**Programming help (local mode).** I can explain, review and reason about code right here. Give me:',
      '- the **language** and the **exact error or symptom**,',
      '- a **minimal snippet**, and',
      '- your **expected vs actual** behaviour.',
      '',
      'Workflow I apply: reproduce → isolate → root-cause → fix → verify. Common root causes: off-by-one loops, async race conditions, mutable shared state, wrong types in comparisons, and environment/config drift.',
      '',
      'For full step-by-step debugging with long context, enable a cloud key (`OPENAI_API_KEY`) — local mode shines for fundamentals, patterns and reviews.',
    ].join('\n') + LOCAL_NOTE;
  }
  return null;
}

function tryGeneralKB(message: string): string | null {
  for (const { re, answer } of GENERAL_KB) if (re.test(message)) return answer + LOCAL_NOTE;
  return null;
}

function portfolioAnswer(message: string, data: PortfolioData): string | null {
  const q = message.toLowerCase();
  const has = (...terms: string[]) => terms.some((t) => q.includes(t));

  if (has('nexora')) {
    const nexora = data.projects.find((p) => p.slug === 'nexora-agent') ?? null;
    if (nexora) {
      return [
        `**NEXORA AGENT** — ${nexora.tagline ?? 'Francis’s flagship live project.'}`,
        '',
        nexora.description ?? '',
        '',
        nexora.technologies?.length ? `**Stack:** ${nexora.technologies.join(', ')}` : '',
        nexora.live_url ? `**Live:** [open NEXORA AGENT](${nexora.live_url})` : '',
        nexora.github_url ? `**Source:** [GitHub](${nexora.github_url})` : '',
      ].filter(Boolean).join('\n') + LOCAL_NOTE;
    }
    return '**NEXORA AGENT** is Francis’s flagship live project. Ask Francis directly for the current link — or check the Projects section of this site, which is editable from the admin studio.' + LOCAL_NOTE;
  }
  if (has('skill', 'stack', 'tech stack', 'technologies', 'what can francis do')) return `Here is Francis’s current stack — every bar is edited live from the control studio:\n\n${groupSkills(data)}` + LOCAL_NOTE;
  if (has('project')) return `**Francis’s projects**\n\n${describeProjects(data)}` + LOCAL_NOTE;
  if (has('education', 'college', 'degree', 'btech', 'b.tech', 'diploma', 'raghu', 'studied', 'study')) return `**Education**\n\n${describeEducation(data)}` + LOCAL_NOTE;
  if (has('contact', 'email', 'reach', 'hire', 'collaborat', 'write to', 'message francis')) return `**Reach Francis**\n\n${describeContact(data)}` + LOCAL_NOTE;
  if (has('resume', ' résumé', 'cv')) {
    return data.profile.resume_url
      ? `**Résumé** — download it here: [${data.profile.resume_url}](${data.profile.resume_url})` + LOCAL_NOTE
      : '**Résumé** — no public résumé link is configured yet. Email Francis and he will send the latest version directly.' + LOCAL_NOTE;
  }
  if (has('experience', 'internship', 'work history', 'worked')) {
    if (data.experience.length === 0) return '**Experience** — Francis is currently focused on his B.Tech CSE and building in public. No formal roles are listed yet; for collaborations or internships, email him directly.' + LOCAL_NOTE;
    return ['**Experience**', '', ...data.experience.map((e) => `- **${e.role}** — ${e.organization}${e.start_date ? ` (${e.start_date}${e.current ? ' → present' : e.end_date ? ` → ${e.end_date}` : ''})` : ''}`)].join('\n') + LOCAL_NOTE;
  }
  if (has('achievement', 'award', 'hackathon')) {
    if (data.achievements.length === 0) return '**Achievements** — nothing is published in this section yet. It is editable from the admin studio, so check back as new milestones land.' + LOCAL_NOTE;
    return ['**Achievements**', '', ...data.achievements.map((a) => `- **${a.title}**${a.issuer ? ` — ${a.issuer}` : ''}${a.year ? ` (${a.year})` : ''}`)].join('\n') + LOCAL_NOTE;
  }
  if (has('location', 'where is francis', 'where are you based', 'based in')) return `Francis is based in **${data.profile.location ?? 'Visakhapatnam, Andhra Pradesh, India'}**.` + LOCAL_NOTE;
  if (has('instagram', 'github', 'linkedin', 'social')) return describeContact(data) + LOCAL_NOTE;
  if (has('this platform', 'this website', 'this site', 'how was this built', 'made this', 'built this')) {
    return '**This platform** is a cinematic developer portfolio + general-purpose AI + private admin studio — built with Next.js 15 (App Router), React 19, TypeScript (strict), Tailwind CSS, Supabase (Postgres + RLS + Auth) and Vercel. FRANCIS AI runs on any OpenAI-compatible endpoint server-side, with live DuckDuckGo research in Research mode, owner-scoped document intelligence (PDF/TXT/DOCX) and a private control studio behind Supabase Auth.' + LOCAL_NOTE;
  }
  if (has('who is francis', 'about francis', 'introduce francis', 'tell me about francis', 'francis?', 'francis ')) return describeFrancis(data) + LOCAL_NOTE;
  if (has('francis')) return describeFrancis(data) + LOCAL_NOTE;
  return null;
}

function documentAnswer(message: string, excerpt: string, name: string): string {
  const qWords = words(message).filter((w) => w.length > 2);
  const sentences = sentenceSplit(excerpt);
  const scored = sentences
    .map((s) => ({ s, score: overlapScore(qWords, s) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(({ s }) => s);

  if (scored.length === 0) {
    return `**About "${name}"** — I read the document, but no passage strongly matches your question. Here is what it covers (opening excerpt):\n\n> ${sentences[0] ?? excerpt.slice(0, 300)}\n\nTry asking with more specific terms from the document.` + LOCAL_NOTE;
  }
  return `**From "${name}"** (most relevant passages I found):\n\n${scored.map((s) => `> ${s}`).join('\n\n')}\n\nThese are direct extracts from your uploaded document — not a paraphrase. For synthesis across the whole file, enable a cloud key.` + LOCAL_NOTE;
}

function researchAnswer(sources: SearchSource[], searchAttempted: boolean): string {
  if (sources.length > 0) {
    const lines = [
      '**Live results — local digest.** FRANCIS AI ran a real web search for your question and returned the sources below. I do not fabricate citations; verify each directly before relying on it.',
      '',
    ];
    sources.slice(0, 6).forEach((s, i) => {
      lines.push(`**${i + 1}. [${s.title}](${s.url})**`, s.snippet ? `> ${s.snippet}` : '', '');
    });
    lines.push('**How to read this:** consistent facts across multiple independent results are likely reliable; single-source claims are uncertain. Cross-check dates — undated or stale pages may no longer hold.', '', 'For full multi-source synthesis, conflict resolution and inline-cited prose, enable `OPENAI_API_KEY`.');
    return lines.filter((l) => l !== '').join('\n') + LOCAL_NOTE;
  }
  if (searchAttempted) {
    return '**Search came back empty.** A live web search was attempted for your question but returned no usable results — so I will not invent sources. What I can tell you from general knowledge, with real uncertainty:\n\n- If this concerns breaking news, prices, scores or releases, the answer changes daily and you should check a primary source (official blog, Reuters/AP, or the project’s own site).\n- If it is a stable technical concept, ask it in Programming or General mode and I will explain it properly.\n\nNo citations are shown because none were retrieved — that is deliberate, not a limitation to hide.' + LOCAL_NOTE;
  }
  return '**Research mode is running locally.** Live search is disabled in Admin → AI Configuration (or the server could not reach the search backend), and no cloud LLM is configured, so there are no retrieved sources to synthesise. Enable web search and/or `OPENAI_API_KEY` for full research with citations and dates.' + LOCAL_NOTE;
}

function greetingAnswer(mode: ChatMode): string {
  const capabilities: Record<ChatMode, string> = {
    general: 'ask me about programming, science, technology, learning, writing, productivity and careers — or everything about Francis',
    portfolio: 'ask about Francis — profile, skills, education, projects (including NEXORA AGENT), experience, resume and how to get in touch',
    research: 'I will run a live web search and hand you the cited sources. Note: without a cloud LLM key, you get the raw source digest rather than full synthesis',
    programming: 'ask for explanations, code reviews, debugging strategies, complexity analysis and design patterns across JavaScript/TypeScript, Python, Java, C++, SQL and more',
  };
  return `**Hey — FRANCIS AI here.** Local engine, fully operational. You can ${capabilities[mode]}. What would you like to explore?` + LOCAL_NOTE;
}

const FALLBACK = [
  '**I hear you — here is the honest shape of it.** In local mode I answer from three real sources: Francis’s live approved profile, your uploaded document, and (in Research mode) a live web search. This specific question needs broader reasoning than local mode carries.',
  '',
  'What works well right now:',
  '- **Francis**: skills, education, projects, NEXORA AGENT, contact, résumé, this platform’s architecture',
  '- **Programming**: explanations, reviews, debugging help and patterns (JS/TS, Python, Java, C++, SQL, Git, DSA)',
  '- **General knowledge**: AI/ML, cloud, databases, careers, learning strategy, productivity',
  '- **Maths**: direct arithmetic evaluation',
  '- **Documents**: grounded answers from your uploaded PDF/TXT/DOCX',
  '- **Research**: real, cited web results (when enabled)',
  '',
  'For literally anything else at full strength, set `OPENAI_API_KEY` in Vercel → Settings → Environment Variables, then redeploy. I would rather tell you that than bluff an answer.',
].join('\n') + LOCAL_NOTE;

export function composeLocalReply(opts: LocalReplyOptions): string {
  const { message, mode, portfolio, documentExcerpt, documentName, sources, searchAttempted } = opts;
  const trimmed = message.trim();

  if (documentExcerpt) return documentAnswer(trimmed, documentExcerpt, documentName ?? 'uploaded document');
  if (/^(hi|hello|hey|yo|sup|good (morning|afternoon|evening|day))\b/i.test(trimmed)) return greetingAnswer(mode);

  const math = tryMath(trimmed);
  if (math) return math + LOCAL_NOTE;

  // Francis / portfolio intents always take priority — they are the platform's home turf
  const portfolioHit = portfolioAnswer(trimmed, portfolio);
  if (portfolioHit) return portfolioHit;

  if (mode === 'research') return researchAnswer(sources, searchAttempted);

  const programming = tryProgramming(trimmed);
  if (programming && mode === 'programming') return programming;

  const general = tryGeneralKB(trimmed);
  if (general) return general;

  // Cross-mode: a programming-flavoured question in general mode still deserves a real answer
  if (programming) return programming;

  if (mode === 'portfolio') {
    return 'That detail is **not part of Francis’s approved public profile**, so I will not invent it. What I can share: skills, education, projects, experience, contact channels and the platform itself — or email Francis directly at ' + (portfolio.profile.email ?? 'the address on the contact section') + '.' + LOCAL_NOTE;
  }

  return FALLBACK;
}

/** Streams the composed reply word-by-word so the UI renders progressively. */
export async function* streamLocalReply(opts: LocalReplyOptions): AsyncGenerator<string, void, unknown> {
  const text = composeLocalReply(opts);
  const tokens = text.match(/\S+\s*/g) ?? [text];
  for (const token of tokens) {
    yield token;
  }
}
