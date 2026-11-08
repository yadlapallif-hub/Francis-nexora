'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowUp, Square, Plus, MessageSquare, Trash2, Pencil, Check, X, Home, ShieldCheck,
  Sparkles, GraduationCap, Globe2, Code2, Compass, Menu, PanelLeftClose, Copy, CheckCheck,
  RotateCcw, Eraser, Paperclip, FileText, Loader2, AlertTriangle, Settings2, ExternalLink,
} from 'lucide-react';
import { LogoMark } from '@/components/brand';
import MessageMarkdown from './MessageMarkdown';

type ChatMode = 'general' | 'portfolio' | 'research' | 'programming';
type Source = { title: string; url: string; snippet: string; date?: string | null };
type Msg = { id: string; role: 'user' | 'assistant'; content: string; sources?: Source[] | null; streaming?: boolean };
type Session = { id: string; title: string; mode: ChatMode; updated_at: string; message_count: number };
type DocItem = { id: string; name: string; size_bytes: number | null; created_at: string };

const OWNER_KEY = 'francis.owner_token';
const MODES: Array<{ id: ChatMode; label: string; hint: string; icon: typeof Compass }> = [
  { id: 'general', label: 'General AI', hint: 'Anything — knowledge, writing, ideas', icon: Compass },
  { id: 'portfolio', label: 'Portfolio', hint: 'Francis, NEXORA & this platform', icon: GraduationCap },
  { id: 'research', label: 'Research', hint: 'Live web search · cited sources', icon: Globe2 },
  { id: 'programming', label: 'Programming', hint: 'Code, debugging, CS concepts', icon: Code2 },
];

const QUICK_PROMPTS: Array<{ label: string; prompt: string; mode: ChatMode }> = [
  { label: 'Explain programming', prompt: 'Explain programming in simple words, and give me a tiny example to try.', mode: 'programming' },
  { label: 'Research a topic', prompt: 'Research the latest developments in artificial intelligence and summarize what matters, with sources.', mode: 'research' },
  { label: 'Help me learn Java', prompt: 'Teach me Java step by step — I am starting from scratch. Give me a roadmap and a first program.', mode: 'programming' },
  { label: 'Explain computer science', prompt: 'Explain the core ideas of computer science every aspiring engineer should understand.', mode: 'programming' },
  { label: "Explore Francis's projects", prompt: "Tell me about Francis's projects — especially NEXORA AGENT — and where to see the live version.", mode: 'portfolio' },
];

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'now';
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function getOwnerToken(): string {
  if (typeof window === 'undefined') return '';
  let token = window.localStorage.getItem(OWNER_KEY);
  if (!token) {
    token = crypto.randomUUID();
    window.localStorage.setItem(OWNER_KEY, token);
  }
  return token;
}

export default function ChatWorkspace() {
  const [ownerToken, setOwnerToken] = useState('');
  const [welcome, setWelcome] = useState("Hi — I'm FRANCIS AI. Ask me anything.");
  const [modelLabel, setModelLabel] = useState('gpt-4o-mini');
  const [providerConfigured, setProviderConfigured] = useState(true);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [allowedUploads, setAllowedUploads] = useState<string[]>(['pdf', 'txt', 'docx']);

  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [mode, setMode] = useState<ChatMode>('general');
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [standby, setStandby] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [docsOpen, setDocsOpen] = useState(false);
  const [attachedDocId, setAttachedDocId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  /* ── bootstrap ─────────────────────────────────────────── */
  useEffect(() => {
    const token = getOwnerToken();
    setOwnerToken(token);
    fetch('/api/ai/config').then((r) => r.json()).then((cfg) => {
      if (cfg?.welcomeMessage) setWelcome(cfg.welcomeMessage);
      if (cfg?.modelLabel) setModelLabel(cfg.modelLabel);
      setProviderConfigured(Boolean(cfg?.providerConfigured));
      setAiEnabled(cfg?.enabled !== false);
      if (Array.isArray(cfg?.allowedUploads)) setAllowedUploads(cfg.allowedUploads);
    }).catch(() => undefined);
    refreshSessions(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshSessions = useCallback(async (token: string) => {
    try {
      const res = await fetch(`/api/ai/sessions?ownerToken=${encodeURIComponent(token)}`);
      const data = await res.json();
      if (Array.isArray(data?.sessions)) setSessions(data.sessions);
    } catch {
      /* offline */
    }
  }, []);

  /* ── load messages when switching sessions ─────────────── */
  useEffect(() => {
    if (!activeSessionId || !ownerToken) { setMessages([]); return; }
    let cancelled = false;
    fetch(`/api/ai/sessions/${activeSessionId}/messages?ownerToken=${encodeURIComponent(ownerToken)}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data?.error) { setActiveSessionId(null); return; }
        setMessages((data?.messages ?? []).map((m: { id: string; role: 'user' | 'assistant'; content: string; sources?: Source[] | null }) => ({ id: m.id, role: m.role, content: m.content, sources: m.sources ?? null })));
        if (data?.session?.mode) setMode(data.session.mode);
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [activeSessionId, ownerToken]);

  /* ── autoscroll ────────────────────────────────────────── */
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const resizeInput = () => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  };

  /* ── send / stream ─────────────────────────────────────── */
  const sendMessage = useCallback(async (rawText: string, opts?: { regenerate?: boolean; modeOverride?: ChatMode }) => {
    const text = rawText.trim();
    const regenerate = Boolean(opts?.regenerate);
    const effectiveMode = opts?.modeOverride ?? mode;
    if ((!regenerate && !text) || streaming || !ownerToken) return;

    setErrorBanner(null);
    setStandby(null);
    setStreaming(true);

    const userMsg: Msg | null = regenerate ? null : { id: `local-${Date.now()}`, role: 'user', content: text };
    if (userMsg) setMessages((prev) => [...prev, userMsg]);
    else setMessages((prev) => {
      const next = [...prev];
      while (next.length && next[next.length - 1].role === 'assistant') next.pop();
      return next;
    });
    const placeholderId = `stream-${Date.now()}`;
    setMessages((prev) => [...prev, { id: placeholderId, role: 'assistant', content: '', streaming: true }]);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerToken,
          sessionId: activeSessionId,
          mode: effectiveMode,
          message: text,
          regenerate,
          documentId: attachedDocId,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
        setMessages((prev) => prev.filter((m) => m.id !== placeholderId));
        if (data.error === 'ai_not_configured' || data.error === 'ai_disabled' || data.error === 'server_not_configured') {
          setStandby(data.message ?? 'FRANCIS AI is not available right now.');
        } else {
          setErrorBanner(data.message ?? `Something went wrong (HTTP ${res.status}). Please try again.`);
        }
        setStreaming(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('Streaming is not supported by this browser.');
      const decoder = new TextDecoder();
      let buffer = '';
      let streamSessionId: string | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const blocks = buffer.split('\n\n');
        buffer = blocks.pop() ?? '';
        for (const block of blocks) {
          const eventMatch = /^event: (.+)$/m.exec(block);
          const dataMatch = /^data: (.+)$/m.exec(block);
          if (!eventMatch || !dataMatch) continue;
          let payload: Record<string, unknown> = {};
          try { payload = JSON.parse(dataMatch[1]); } catch { continue; }
          const event = eventMatch[1].trim();
          if (event === 'meta') {
            streamSessionId = (payload.sessionId as string) ?? null;
            if (streamSessionId) setActiveSessionId(streamSessionId);
            const metaSources = (payload.sources as Source[]) ?? [];
            if (metaSources.length) {
              setMessages((prev) => prev.map((m) => (m.id === placeholderId ? { ...m, sources: metaSources } : m)));
            }
          } else if (event === 'delta') {
            const deltaText = (payload.text as string) ?? '';
            setMessages((prev) => prev.map((m) => (m.id === placeholderId ? { ...m, content: m.content + deltaText } : m)));
          } else if (event === 'error') {
            setErrorBanner((payload.message as string) ?? 'The stream was interrupted.');
          }
        }
      }
      setMessages((prev) => prev.map((m) => (m.id === placeholderId ? { ...m, streaming: false } : m)));
      if (streamSessionId ?? activeSessionId) await refreshSessions(ownerToken);
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        setMessages((prev) => prev.map((m) => (m.id === placeholderId ? { ...m, streaming: false } : m)));
      } else {
        console.error('[chat] send failed:', err);
        setMessages((prev) => prev.filter((m) => m.id !== placeholderId));
        setErrorBanner('Could not reach FRANCIS AI. Check your connection and try again.');
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }, [streaming, ownerToken, activeSessionId, mode, attachedDocId, refreshSessions]);

  const stopStreaming = () => abortRef.current?.abort();

  /* ── session ops ───────────────────────────────────────── */
  const newConversation = () => { setActiveSessionId(null); setMessages([]); setErrorBanner(null); setSidebarOpen(false); inputRef.current?.focus(); };

  const renameSession = async (sessionId: string) => {
    const title = editTitle.trim();
    if (!title || !ownerToken) { setEditingId(null); return; }
    await fetch('/api/ai/sessions', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ownerToken, sessionId, title }) });
    setEditingId(null);
    refreshSessions(ownerToken);
  };

  const deleteSession = async (sessionId: string) => {
    if (!ownerToken) return;
    await fetch(`/api/ai/sessions?ownerToken=${encodeURIComponent(ownerToken)}&sessionId=${encodeURIComponent(sessionId)}`, { method: 'DELETE' });
    if (activeSessionId === sessionId) { setActiveSessionId(null); setMessages([]); }
    setConfirmDeleteId(null);
    refreshSessions(ownerToken);
  };

  const clearConversation = async () => {
    if (!ownerToken || !activeSessionId) return;
    await fetch('/api/ai/sessions/clear', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ownerToken, sessionId: activeSessionId }) });
    setMessages([]);
    refreshSessions(ownerToken);
  };

  const copyMessage = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1600);
    } catch { /* noop */ }
  };

  /* ── documents ─────────────────────────────────────────── */
  const loadDocs = useCallback(async (token: string) => {
    try {
      const res = await fetch(`/api/ai/documents?ownerToken=${encodeURIComponent(token)}`);
      const data = await res.json();
      if (Array.isArray(data?.documents)) setDocs(data.documents);
    } catch { /* offline */ }
  }, []);
  useEffect(() => { if (ownerToken) loadDocs(ownerToken); }, [ownerToken, loadDocs]);

  const uploadDoc = async (file: File) => {
    if (!ownerToken) return;
    setUploading(true);
    setErrorBanner(null);
    try {
      const form = new FormData();
      form.append('ownerToken', ownerToken);
      form.append('file', file);
      const res = await fetch('/api/ai/documents', { method: 'POST', body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setErrorBanner(data.message ?? 'Upload failed.');
      else {
        await loadDocs(ownerToken);
        setAttachedDocId(data?.document?.id ?? null);
      }
    } catch {
      setErrorBanner('Could not upload the document. Check your connection and try again.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const deleteDoc = async (documentId: string) => {
    if (!ownerToken) return;
    await fetch(`/api/ai/documents?ownerToken=${encodeURIComponent(ownerToken)}&documentId=${encodeURIComponent(documentId)}`, { method: 'DELETE' });
    if (attachedDocId === documentId) setAttachedDocId(null);
    loadDocs(ownerToken);
  };

  const attachedDoc = docs.find((d) => d.id === attachedDocId) ?? null;
  const lastAssistantIndex = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) if (messages[i].role === 'assistant') return i;
    return -1;
  }, [messages]);

  const standbyActive = standby !== null || !providerConfigured || !aiEnabled;
  const quickAccepts = allowedUploads.map((f) => f.toLowerCase());

  /* ══════════════ RENDER ══════════════ */
  return (
    <div className="flex h-[100svh] overflow-hidden bg-soft text-ink">
      {/* ──────── Sidebar ──────── */}
      {sidebarOpen && <button aria-label="Close sidebar" className="fixed inset-0 z-30 bg-navy/50 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[19rem] shrink-0 flex-col border-r border-navy/10 bg-white transition-transform duration-300 lg:static lg:z-auto lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between gap-2 border-b border-navy/5 px-4 py-4">
          <Link href="/" className="flex items-center gap-2.5 rounded-lg" aria-label="Back to FRANCIS home">
            <LogoMark size={36} />
            <span className="leading-tight">
              <span className="block font-display text-sm font-bold tracking-[0.2em] text-navy">FRANCIS AI</span>
              <span className="block font-mono text-[8px] uppercase tracking-[0.3em] text-ink/45">General-purpose intelligence</span>
            </span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="rounded-lg p-2 text-ink/50 transition hover:bg-soft lg:hidden" aria-label="Close sidebar"><PanelLeftClose size={17} /></button>
        </div>

        <div className="px-4 pt-4">
          <button onClick={newConversation} className="btn-shine flex w-full items-center justify-center gap-2 rounded-2xl bg-navy px-4 py-3 font-display text-[11px] font-bold uppercase tracking-[0.22em] text-white transition hover:bg-[#0d2952]">
            <Plus size={15} /> New conversation
          </button>
        </div>

        {/* Modes */}
        <div className="px-4 pt-4">
          <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.35em] text-ink/40">Mode — one assistant, four minds</p>
          <div className="grid grid-cols-2 gap-2">
            {MODES.map(({ id, label, hint, icon: Icon }) => {
              const active = mode === id;
              return (
                <button
                  key={id}
                  onClick={() => setMode(id)}
                  aria-pressed={active}
                  title={hint}
                  className={`flex flex-col items-start gap-1 rounded-2xl border p-2.5 text-left transition ${active ? 'border-electric/60 bg-mist shadow-[0_0_0_1px_rgba(37,99,235,0.35)]' : 'border-navy/8 bg-white hover:border-electric/35'}`}
                >
                  <Icon size={15} className={active ? 'text-electric' : 'text-navy/55'} />
                  <span className={`font-display text-[10.5px] font-bold leading-tight ${active ? 'text-navy' : 'text-ink/75'}`}>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* History */}
        <div className="mt-4 flex min-h-0 flex-1 flex-col px-2">
          <p className="mb-1 px-2 font-mono text-[9px] uppercase tracking-[0.35em] text-ink/40">Recent conversations</p>
          <div className="min-h-0 flex-1 overflow-y-auto pb-3">
            {sessions.length === 0 ? (
              <p className="mt-3 rounded-2xl border border-dashed border-navy/15 p-4 text-center text-xs text-ink/50">No conversations yet.<br />Ask your first question below.</p>
            ) : (
              <ul className="space-y-1">
                {sessions.map((session) => {
                  const active = session.id === activeSessionId;
                  if (editingId === session.id) {
                    return (
                      <li key={session.id} className="flex items-center gap-1.5 rounded-xl bg-mist p-1.5">
                        <input autoFocus value={editTitle} onChange={(e) => setEditTitle(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') renameSession(session.id); if (e.key === 'Escape') setEditingId(null); }} className="min-w-0 flex-1 rounded-lg border border-electric/40 bg-white px-2 py-1.5 text-xs outline-none" aria-label="Conversation title" />
                        <button onClick={() => renameSession(session.id)} className="rounded-lg p-1.5 text-electric hover:bg-white" aria-label="Save title"><Check size={14} /></button>
                        <button onClick={() => setEditingId(null)} className="rounded-lg p-1.5 text-ink/50 hover:bg-white" aria-label="Cancel"><X size={14} /></button>
                      </li>
                    );
                  }
                  return (
                    <li key={session.id} className={`group flex items-center gap-1 rounded-xl px-2 py-2 transition ${active ? 'bg-mist' : 'hover:bg-soft'}`}>
                      <button onClick={() => { setActiveSessionId(session.id); setSidebarOpen(false); }} className="min-w-0 flex-1 text-left" aria-current={active ? 'page' : undefined}>
                        <span className="block truncate text-[13px] font-medium text-navy">{session.title}</span>
                        <span className="mt-0.5 block font-mono text-[8.5px] uppercase tracking-[0.18em] text-ink/40">{session.mode} · {session.message_count} msgs · {timeAgo(session.updated_at)}</span>
                      </button>
                      <button onClick={() => { setEditingId(session.id); setEditTitle(session.title); }} className="rounded-lg p-1.5 text-ink/35 opacity-0 transition hover:bg-white hover:text-navy focus:opacity-100 group-hover:opacity-100" aria-label="Rename conversation"><Pencil size={13} /></button>
                      {confirmDeleteId === session.id ? (
                        <button onClick={() => deleteSession(session.id)} onMouseLeave={() => setConfirmDeleteId(null)} className="rounded-lg border border-red-200 bg-red-50 p-1.5 font-mono text-[8px] font-bold uppercase text-red-600" title="Click to confirm delete" aria-label="Confirm delete conversation"><Trash2 size={13} /></button>
                      ) : (
                        <button onClick={() => setConfirmDeleteId(session.id)} className="rounded-lg p-1.5 text-ink/35 opacity-0 transition hover:bg-white hover:text-red-600 focus:opacity-100 group-hover:opacity-100" aria-label="Delete conversation"><Trash2 size={13} /></button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <div className="border-t border-navy/8 px-4 py-3">
          <div className="flex items-center justify-between font-mono text-[8.5px] uppercase tracking-[0.28em] text-ink/45">
            <Link href="/" className="flex items-center gap-1.5 transition hover:text-navy"><Home size={11} /> Home</Link>
            <Link href="/admin" className="flex items-center gap-1.5 transition hover:text-navy"><ShieldCheck size={11} /> Admin Studio</Link>
            <span className="flex items-center gap-1.5"><Sparkles size={11} /> {modelLabel}</span>
          </div>
        </div>
      </aside>

      {/* ──────── Chat surface ──────── */}
      <div className="relative flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-navy/8 bg-white/85 px-3 backdrop-blur sm:px-5">
          <button onClick={() => setSidebarOpen(true)} className="rounded-lg p-2 text-navy/70 transition hover:bg-soft lg:hidden" aria-label="Open sidebar"><Menu size={18} /></button>
          <p className="min-w-0 flex-1 truncate font-display text-[13px] font-semibold text-navy">
            {activeSessionId ? sessions.find((s) => s.id === activeSessionId)?.title ?? 'Conversation' : 'New conversation'}
          </p>
          <span className="hidden rounded-full bg-mist px-3 py-1 font-mono text-[8.5px] uppercase tracking-[0.25em] text-electric sm:inline-block">{MODES.find((m) => m.id === mode)?.label}</span>
          {messages.length > 0 && !streaming ? (
            <button onClick={clearConversation} className="rounded-lg p-2 text-ink/45 transition hover:bg-soft hover:text-navy" title="Clear conversation" aria-label="Clear conversation"><Eraser size={16} /></button>
          ) : null}
          <button onClick={newConversation} className="rounded-lg p-2 text-ink/45 transition hover:bg-soft hover:text-navy" title="New conversation" aria-label="New conversation"><Plus size={17} /></button>
        </header>

        {/* Standby banner */}
        {standbyActive && (
          <div className="shrink-0 border-b border-amber-200 bg-amber-50 px-4 py-2.5 sm:px-6">
            <div className="mx-auto flex max-w-4xl items-start gap-2 text-[12.5px] text-amber-900">
              <AlertTriangle size={15} className="mt-0.5 shrink-0" />
              <p>
                <strong>FRANCIS AI is on standby.</strong>{' '}
                {standby ?? (!aiEnabled ? 'The assistant is temporarily disabled by the administrator.' : 'No language-model API key is configured on the server (AI_API_KEY).')}{' '}
                <span className="text-amber-800/80">Everything else — history, uploads, the portfolio — still works. The platform owner can enable the model in minutes; see the AI panel in the <Link href="/admin" className="font-semibold underline">Admin Studio</Link>.</span>
              </p>
            </div>
          </div>
        )}
        {errorBanner && (
          <div className="shrink-0 border-b border-red-200 bg-red-50 px-4 py-2 sm:px-6">
            <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 text-[12.5px] text-red-800">
              <span className="flex items-center gap-2"><AlertTriangle size={14} /> {errorBanner}</span>
              <button onClick={() => setErrorBanner(null)} aria-label="Dismiss" className="rounded p-1 hover:bg-red-100"><X size={14} /></button>
            </div>
          </div>
        )}

        {/* Messages */}
        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto" role="log" aria-live="polite" aria-label="Conversation">
          {messages.length === 0 ? (
            <div className="mx-auto flex h-full max-w-2xl flex-col items-center justify-center px-6 py-10 text-center">
              <div className="relative mb-6">
                <div aria-hidden="true" className="absolute inset-0 scale-150 rounded-full bg-electric/15 blur-3xl" />
                <LogoMark size={84} className="relative" />
              </div>
              <h1 className="text-display text-3xl font-bold text-navy sm:text-4xl">Ask <span className="text-electric">FRANCIS AI</span> anything.</h1>
              <p className="mt-4 max-w-md text-balance text-[15px] leading-relaxed text-ink/70">{welcome}</p>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
                {QUICK_PROMPTS.map(({ label, prompt, mode: promptMode }) => (
                  <button key={label} onClick={() => { setMode(promptMode); sendMessage(prompt, { modeOverride: promptMode }); }} className="rounded-full border border-navy/12 bg-white px-4 py-2 font-display text-[11px] font-semibold text-navy shadow-soft transition hover:border-electric/60 hover:text-electric">
                    {label}
                  </button>
                ))}
              </div>
              <p className="mt-8 font-mono text-[8.5px] uppercase tracking-[0.35em] text-ink/35">General knowledge · Research with live sources · Code · Documents</p>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6">
              {messages.map((message, index) => {
                if (message.role === 'user') {
                  return (
                    <div key={message.id} className="flex justify-end">
                      <div className="max-w-[85%] rounded-3xl rounded-br-md bg-navy px-5 py-3.5 text-[15px] leading-relaxed text-blue-50 shadow-soft sm:max-w-[78%]">{message.content}</div>
                    </div>
                  );
                }
                return (
                  <div key={message.id} className="flex gap-3">
                    <LogoMark size={30} className="mt-1 shrink-0" />
                    <div className="min-w-0 flex-1">
                      {message.content ? (
                        <MessageMarkdown content={message.content} />
                      ) : message.streaming ? (
                        <div className="flex items-center gap-1.5 py-3" aria-label="FRANCIS AI is typing">
                          <span className="typing-dot h-2 w-2 rounded-full bg-electric" /><span className="typing-dot h-2 w-2 rounded-full bg-electric" /><span className="typing-dot h-2 w-2 rounded-full bg-electric" />
                        </div>
                      ) : null}
                      {message.sources && message.sources.length > 0 && !message.streaming ? (
                        <div className="mt-4 rounded-2xl border border-navy/8 bg-white p-3.5">
                          <p className="mb-2 font-mono text-[8.5px] uppercase tracking-[0.3em] text-ink/45">Sources consulted</p>
                          <ol className="space-y-1.5">
                            {message.sources.map((source, i) => {
                              let host = '';
                              try { host = new URL(source.url).hostname.replace(/^www\./, ''); } catch { host = source.url; }
                              return (
                                <li key={`${source.url}-${i}`}>
                                  <a href={source.url} target="_blank" rel="noreferrer noopener" className="group/src flex items-start gap-2 text-[12px] leading-snug text-navy transition hover:text-electric">
                                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded bg-mist font-mono text-[8.5px] font-bold text-electric">{i + 1}</span>
                                    <span className="min-w-0">
                                      <span className="line-clamp-2 font-medium group-hover/src:underline">{source.title}</span>
                                      <span className="mt-0.5 flex items-center gap-1 font-mono text-[8.5px] uppercase tracking-[0.18em] text-ink/40">{host}{source.date ? ` · ${source.date}` : ''}<ExternalLink size={9} /></span>
                                    </span>
                                  </a>
                                </li>
                              );
                            })}
                          </ol>
                        </div>
                      ) : null}
                      {!message.streaming && message.content ? (
                        <div className="mt-2 flex items-center gap-1">
                          <button onClick={() => copyMessage(message.id, message.content)} className="rounded-lg p-1.5 text-ink/40 transition hover:bg-mist hover:text-navy" aria-label="Copy response" title="Copy response">
                            {copiedId === message.id ? <CheckCheck size={14} className="text-emerald-600" /> : <Copy size={14} />}
                          </button>
                          {index === lastAssistantIndex ? (
                            <button onClick={() => sendMessage('', { regenerate: true })} className="rounded-lg p-1.5 text-ink/40 transition hover:bg-mist hover:text-navy" aria-label="Regenerate response" title="Regenerate response">
                              <RotateCcw size={14} />
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Attached document chip */}
        {attachedDoc ? (
          <div className="mx-auto w-full max-w-3xl shrink-0 px-4 sm:px-6">
            <div className="flex items-center gap-2 rounded-2xl border border-electric/35 bg-mist px-3 py-2">
              <FileText size={14} className="shrink-0 text-electric" />
              <span className="min-w-0 flex-1 truncate font-mono text-[10.5px] text-navy">{attachedDoc.name}</span>
              <button onClick={() => setAttachedDocId(null)} className="rounded-md p-1 text-ink/50 transition hover:bg-white hover:text-navy" aria-label="Detach document"><X size={14} /></button>
            </div>
          </div>
        ) : null}

        {/* Composer */}
        <div className="shrink-0 border-t border-navy/8 bg-white/90 px-4 pb-4 pt-3 backdrop-blur sm:px-6">
          <div className="mx-auto max-w-3xl">
            <div className="relative rounded-3xl border border-navy/12 bg-white shadow-card transition focus-within:border-electric/60 focus-within:shadow-glow">
              <label htmlFor="francis-composer" className="sr-only">Ask FRANCIS AI anything</label>
              <textarea
                id="francis-composer"
                ref={inputRef}
                value={input}
                rows={1}
                onChange={(e) => { setInput(e.target.value); resizeInput(); }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    sendMessage(input);
                  }
                }}
                placeholder="Ask FRANCIS AI anything…"
                className="w-full resize-none bg-transparent px-5 pb-12 pt-4 text-[15px] leading-6 text-navy outline-none placeholder:text-ink/35"
                disabled={standbyActive}
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 p-2.5">
                <div className="pointer-events-auto flex items-center gap-1">
                  <input ref={fileRef} type="file" accept={quickAccepts.map((e) => `.${e}`).join(',')} className="sr-only" aria-hidden="true" tabIndex={-1} onChange={(e) => { const file = e.target.files?.[0]; if (file) uploadDoc(file); }} />
                  <button onClick={() => fileRef.current?.click()} disabled={uploading || standbyActive} className="rounded-xl p-2.5 text-ink/45 transition hover:bg-mist hover:text-electric disabled:opacity-40" title="Upload a document (PDF, TXT, DOCX)" aria-label="Upload a document">
                    {uploading ? <Loader2 size={18} className="animate-spin" /> : <Paperclip size={18} />}
                  </button>
                  <button onClick={() => { setDocsOpen((v) => !v); loadDocs(ownerToken); }} className="rounded-xl p-2.5 font-mono text-[10px] uppercase tracking-[0.2em] text-ink/45 transition hover:bg-mist hover:text-electric" title="Your uploaded documents" aria-label="Your uploaded documents">
                    <span className="flex items-center gap-1.5"><FileText size={15} />{docs.length > 0 ? docs.length : ''}</span>
                  </button>
                  <span className="hidden font-mono text-[8.5px] uppercase tracking-[0.28em] text-ink/30 md:inline-block">Enter to send · Shift+Enter for a new line</span>
                </div>
                {streaming ? (
                  <button onClick={stopStreaming} className="pointer-events-auto flex items-center gap-2 rounded-2xl bg-navy px-5 py-3 font-display text-[11px] font-bold uppercase tracking-[0.2em] text-white transition hover:bg-[#0d2952]" aria-label="Stop generation">
                    <Square size={13} fill="currentColor" /> Stop
                  </button>
                ) : (
                  <button onClick={() => sendMessage(input)} disabled={!input.trim() || standbyActive} className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-electric text-white shadow-glow transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-35" aria-label="Send message">
                    <ArrowUp size={20} strokeWidth={2.5} />
                  </button>
                )}
              </div>
            </div>

            {/* Documents panel */}
            {docsOpen ? (
              <div className="mt-2 overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-card">
                <div className="flex items-center justify-between border-b border-navy/5 px-4 py-2.5">
                  <p className="font-mono text-[9px] uppercase tracking-[0.35em] text-ink/50">Your documents — private to you</p>
                  <button onClick={() => setDocsOpen(false)} className="rounded p-1 text-ink/45 hover:text-navy" aria-label="Close documents panel"><X size={14} /></button>
                </div>
                <ul className="max-h-44 divide-y divide-navy/5 overflow-y-auto">
                  {docs.length === 0 ? (
                    <li className="px-4 py-4 text-center text-xs text-ink/50">No documents yet — upload a PDF, TXT or DOCX and ask me about it.</li>
                  ) : docs.map((doc) => (
                    <li key={doc.id} className="flex items-center gap-2 px-4 py-2.5">
                      <FileText size={14} className="shrink-0 text-electric" />
                      <span className="min-w-0 flex-1 truncate text-[12px] text-navy">{doc.name}</span>
                      <button onClick={() => setAttachedDocId(attachedDocId === doc.id ? null : doc.id)} className={`rounded-lg px-2.5 py-1 font-mono text-[8.5px] uppercase tracking-[0.18em] transition ${attachedDocId === doc.id ? 'bg-electric text-white' : 'bg-mist text-electric hover:bg-electric hover:text-white'}`}>
                        {attachedDocId === doc.id ? 'Attached' : 'Attach'}
                      </button>
                      <button onClick={() => deleteDoc(doc.id)} className="rounded-lg p-1.5 text-ink/35 transition hover:bg-red-50 hover:text-red-600" aria-label="Delete document"><Trash2 size={13} /></button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <p className="mt-2 text-center font-mono text-[8px] uppercase tracking-[0.3em] text-ink/35">FRANCIS AI can make mistakes — verify critical information · Conversations are private to this browser</p>
          </div>
        </div>
      </div>
    </div>
  );
}
