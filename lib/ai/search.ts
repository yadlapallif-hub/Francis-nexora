import 'server-only';
import type { SearchSource } from '@/lib/types';

const TIMEOUT_MS = 9000;
const MAX_RESULTS = 6;

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/<[^>]+>/g, '')
    .trim();
}

function normalizeUrl(raw: string): string | null {
  let url = raw.trim();
  if (url.startsWith('//')) url = `https:${url}`;
  // DuckDuckGo redirect links → decode the actual target
  try {
    const u = new URL(url);
    if (u.hostname.endsWith('duckduckgo.com') && u.pathname.startsWith('/l/')) {
      const target = u.searchParams.get('uddg');
      if (target) url = decodeURIComponent(target);
    }
  } catch {
    /* keep raw */
  }
  if (!/^https?:\/\//i.test(url)) return null;
  return url;
}

async function fetchText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        'user-agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
        accept: 'text/html,application/xhtml+xml',
        'accept-language': 'en-IN,en;q=0.9',
      },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function parseDuckDuckGoHtml(html: string): SearchSource[] {
  const results: SearchSource[] = [];
  const linkRe = /<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  const snippetRe = /<a[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>|<td[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/td>/gi;

  const snippets: string[] = [];
  let sm: RegExpExecArray | null;
  while ((sm = snippetRe.exec(html)) !== null) {
    snippets.push(decodeEntities(sm[1] ?? sm[2] ?? ''));
  }

  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = linkRe.exec(html)) !== null && results.length < MAX_RESULTS) {
    const url = normalizeUrl(m[1]);
    const title = decodeEntities(m[2]);
    if (!url || !title) continue;
    if (/^(www\.)?duckduckgo\.com$/.test(new URL(url).hostname)) { i++; continue; }
    results.push({ title, url, snippet: snippets[i] ?? '' });
    i++;
  }
  return results;
}

async function searchDuckDuckGo(query: string): Promise<SearchSource[]> {
  const html = await fetchText(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}&kl=in-en`);
  if (html) {
    const parsed = parseDuckDuckGoHtml(html);
    if (parsed.length) return parsed;
  }
  // Fallback: lite endpoint
  const lite = await fetchText(`https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(query)}`);
  if (!lite) return [];
  const linkRe = /<a[^>]*rel="nofollow"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  const results: SearchSource[] = [];
  let m: RegExpExecArray | null;
  while ((m = linkRe.exec(lite)) !== null && results.length < MAX_RESULTS) {
    const url = normalizeUrl(m[1]);
    const title = decodeEntities(m[2]);
    if (url && title) results.push({ title, url, snippet: '' });
  }
  return results;
}

async function searchSerper(query: string, apiKey: string): Promise<SearchSource[]> {
  const res = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { 'content-type': 'application/json', 'x-api-key': apiKey },
    body: JSON.stringify({ q: query, num: MAX_RESULTS }),
  });
  if (!res.ok) return [];
  const data = await res.json();
  const organic: Array<{ title?: string; link?: string; snippet?: string }> = data?.organic ?? [];
  return organic
    .filter((r) => r.title && r.link)
    .slice(0, MAX_RESULTS)
    .map((r) => ({ title: String(r.title), url: String(r.link), snippet: String(r.snippet ?? '') }));
}

async function searchBing(query: string, apiKey: string): Promise<SearchSource[]> {
  const res = await fetch(
    `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(query)}&count=${MAX_RESULTS}`,
    { signal: AbortSignal.timeout(TIMEOUT_MS), headers: { 'Ocp-Apim-Subscription-Key': apiKey } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  const webPages: Array<{ name?: string; url?: string; snippet?: string }> = data?.webPages?.value ?? [];
  return webPages
    .filter((r) => r.name && r.url)
    .slice(0, MAX_RESULTS)
    .map((r) => ({ title: String(r.name), url: String(r.url), snippet: String(r.snippet ?? '') }));
}

/**
 * Real, server-side web search. Returns [] when every provider fails —
 * callers must treat that as "no live data", never as an excuse to invent.
 */
export async function webSearch(query: string): Promise<SearchSource[]> {
  const provider = (process.env.SEARCH_PROVIDER ?? 'duckduckgo').toLowerCase();

  try {
    if (provider === 'serper' && process.env.SERPER_API_KEY) {
      const r = await searchSerper(query, process.env.SERPER_API_KEY);
      if (r.length) return r;
    }
    if (provider === 'bing' && process.env.BING_API_KEY) {
      const r = await searchBing(query, process.env.BING_API_KEY);
      if (r.length) return r;
    }
    return await searchDuckDuckGo(query);
  } catch (error) {
    console.error('[search] failed:', error);
    return [];
  }
}
