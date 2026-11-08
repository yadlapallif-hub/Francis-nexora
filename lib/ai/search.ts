import 'server-only';
import { getAiEnv } from './config';

export type SearchSource = {
  title: string;
  url: string;
  snippet: string;
  date?: string | null;
};

const TIMEOUT_MS = 9000;

function withTimeout(ms: number): AbortSignal {
  const ctrl = new AbortController();
  setTimeout(() => ctrl.abort(), ms);
  return ctrl.signal;
}

/** Real web search via Serper.dev (if SERPER_API_KEY is set). */
async function serperSearch(query: string, num = 6): Promise<SearchSource[]> {
  const { searchKey } = getAiEnv();
  if (!searchKey) return [];
  const res = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-API-KEY': searchKey },
    body: JSON.stringify({ q: query, num }),
    signal: withTimeout(TIMEOUT_MS),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Serper search failed with status ${res.status}`);
  const data = (await res.json()) as {
    organic?: Array<{ title?: string; link?: string; snippet?: string; date?: string }>;
  };
  return (data.organic ?? [])
    .filter((r) => r.link && r.title)
    .map((r) => ({ title: r.title!, url: r.link!, snippet: r.snippet ?? '', date: r.date ?? null }));
}

/** Real web search via DuckDuckGo HTML results (no key required). */
async function duckDuckGoSearch(query: string, max = 6): Promise<SearchSource[]> {
  const res = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
    method: 'GET',
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      Accept: 'text/html',
    },
    signal: withTimeout(TIMEOUT_MS),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`DuckDuckGo search failed with status ${res.status}`);
  const html = await res.text();

  const sources: SearchSource[] = [];
  const linkRe = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
  const snippetRe = /<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;

  const snippets: string[] = [];
  let s;
  while ((s = snippetRe.exec(html)) !== null) {
    snippets.push(stripHtml(s[1]));
  }

  let m;
  let i = 0;
  while ((m = linkRe.exec(html)) !== null && sources.length < max) {
    const rawHref = m[1];
    const title = stripHtml(m[2]);
    const url = decodeDdgUrl(rawHref);
    if (!url || !title) continue;
    sources.push({ title, url, snippet: snippets[i] ?? '', date: null });
    i += 1;
  }
  return sources;
}

function decodeDdgUrl(href: string): string | null {
  try {
    if (href.startsWith('//duckduckgo.com/l/')) {
      const u = new URL('https:' + href);
      const target = u.searchParams.get('uddg');
      return target ? decodeURIComponent(target) : null;
    }
    if (href.startsWith('http')) return href;
    return null;
  } catch {
    return null;
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Perform a genuine live web search. Never fabricates results. */
export async function webSearch(query: string): Promise<{ sources: SearchSource[]; provider: string }> {
  const { searchKey } = getAiEnv();
  if (searchKey) {
    const sources = await serperSearch(query);
    return { sources, provider: 'serper' };
  }
  const sources = await duckDuckGoSearch(query);
  return { sources, provider: 'duckduckgo' };
}

/** Heuristic: does this query need fresh/external information? */
export function needsLiveInformation(query: string): boolean {
  const q = query.toLowerCase();
  const freshness =
    /\b(latest|newest|recent|today|tonight|yesterday|tomorrow|this week|this month|this year|current|currently|now|2025|2026|breaking|news|update[sd]?|release[sd]?|launched|just announced)\b/;
  const external =
    /\b(price|stock|weather|score|who won|election|search the web|look up|find online|online|website|link|url|live|schedule|deadline|version of|changelog)\b/;
  return freshness.test(q) || external.test(q);
}
