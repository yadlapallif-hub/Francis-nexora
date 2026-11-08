'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Asterisk, User, Globe2, Code2, Plus, PanelLeftClose, PanelLeftOpen, Menu, X,
  SendHorizontal, Square, Paperclip, Trash2, Check, FileText, Loader2, Pencil,
  Copy, RefreshCw, MessageSquare, AlertTriangle, ExternalLink, ArrowLeft, Bot,
} from 'lucide-react';
import { LogoMark } from '@/components/brand/LogoMark';
import { Markdown } from './Markdown';
import { cn } from '@/lib/cn';
import type { ChatMode } from '@/lib/types';

interface SessionMeta { id: string; title: string; mode: string; updated_at: string }
interface Source { title: string; url: string; snippet?: string }
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[] | null;
  pending?: boolean;
}
interface AiStatus { enabled: boolean; configured: boolean; mode?: 'online' | 'local'; welcome: string | null; uploads: string[] }
interface AttachedDoc { id: string; name: string; chars: number }

const MODES: Array<{ id: ChatMode; label: string; hint: string; icon: typeof Asterisk }> = [
  { id: 'general', label: 'General', hint: 'Anything on the mind — science, writing, life, tech', icon: Asterisk },
  { id: 'portfolio', label: 'Portfolio', hint: "Francis, NEXORA and this platform", icon: User },
  { id: 'research', label: 'Research', hint: 'Live web results with clickable citations', icon: Globe2 },
  { id: 'programming', label: 'Programming', hint: 'Code, debug, explain — Java, Python, C, C++, JS, React…', icon: Code2 },
];

const QUICK_PROMPTS = [
  { label: 'Explain programming', mode: 'programming' as ChatMode, text: 'Explain what programming is and how I should start learning it as a complete beginner.' },
  { label: 'Research a topic', mode: 'research' as ChatMode, text: 'Research the latest developments in artificial intelligence and summarize them with sources.' },
  { label: 'Help me learn Java', mode: 'programming' as ChatMode, text: 'Teach me Java step by step: syntax, OOP, and a real example program with explanation.' },
  { label: 'Explain computer science', mode: 'general' as ChatMode, text: 'Explain the core pillars of computer science like I am a curious first-year student.' },
  { label: "Explore Francis's projects", mode: 'portfolio' as ChatMode, text: 'Tell me about the NEXORA AGENT project — what it is, how it works, and where I can see it live.' },
];

const OWNER_KEY = 'francis_owner_token';

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return d < 30 ? `${d}d` : new Date(iso).toLocaleDateString();
}

function newId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function ChatApp() {
  const [ownerToken, setOwnerToken] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SessionMeta[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<ChatMode>('general');
  const [streaming, setStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [status, setStatus] = useState<AiStatus | null>(null);
  const [notice, setNotice] = useState<{ kind: 'config' | 'error' | 'rate'; title: string; body: string } | null>(null);
  const [docs, setDocs] = useState<AttachedDoc[]>([]);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Owner token (anonymous, stored locally, scopes private data) ──
  useEffect(() => {
    try {
      let token = window.localStorage.getItem(OWNER_KEY);
      if (!token) {
        token = newId().replace(/-/g, '');
        window.localStorage.setItem(OWNER_KEY, token);
      }
      setOwnerToken(token);
    } catch {
      setOwnerToken(`anon${Date.now()}`.replace(/-/g, ''));
    }
  }, []);

  // ── AI status + session list ──
  const refreshSessions = useCallback(async (owner: string) => {
    try {
      const res = await fetch('/api/ai/sessions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ owner }),
      });
      const data = await res.json();
      setSessions(Array.isArray(data.sessions) ? data.sessions : []);
    } catch {
      /* sidebar stays stale — non-fatal */
    }
  }, []);

  useEffect(() => {
    if (!ownerToken) return;
    fetch('/api/ai/status').then((r) => r.json()).then(setStatus).catch(() => setStatus({ enabled: false, configured: false, welcome: null, uploads: [] }));
    refreshSessions(ownerToken);
  }, [ownerToken, refreshSessions]);

  // ── Autoscroll ──
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const openSession = async (id: string) => {
    if (!ownerToken) return;
    setActiveId(id);
    setSidebarOpen(false);
    setNotice(null);
    try {
      const res = await fetch(`/api/ai/sessions/${id}?owner=${encodeURIComponent(ownerToken)}`);
      const data = await res.json();
      setMessages(
        (data.messages ?? []).map((m: { id: string; role: 'user' | 'assistant'; content: string; sources?: Source[] | null }) => ({
          id: m.id, role: m.role, content: m.content, sources: m.sources ?? null,
        }))
      );
    } catch {
      setMessages([]);
    }
  };

  const newChat = () => {
    setActiveId(null);
    setMessages([]);
    setDocs([]);
    setNotice(null);
    setSidebarOpen(false);
    textareaRef.current?.focus();
  };

  const renameSession = async (id: string) => {
    if (!ownerToken) return;
    const title = editTitle.trim();
    if (!title) return setEditingId(null);
    setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, title } : s)));
    setEditingId(null);
    await fetch(`/api/ai/sessions/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ owner: ownerToken, title }),
    }).catch(() => {});
  };

  const deleteSession = async (id: string) => {
    if (!ownerToken) return;
    await fetch(`/api/ai/sessions/${id}?owner=${encodeURIComponent(ownerToken)}`, { method: 'DELETE' }).catch(() => {});
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeId === id) newChat();
    setConfirmDeleteId(null);
  };

  // ── Send + stream ──
  const send = async (rawText?: string, regenerate = false) => {
    const text = (rawText ?? input).trim();
    if (!ownerToken || streaming) return;
    if (!regenerate && !text) return;

    setNotice(null);
    const userMsg: ChatMessage | null = regenerate ? null : { id: newId(), role: 'user', content: text };
    const assistantId = newId();
    setMessages((prev) => [...prev, ...(userMsg ? [userMsg] : []), { id: assistantId, role: 'assistant', content: '', pending: true }]);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    const controller = new AbortController();
    abortRef.current = controller;
    setStreaming(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          message: regenerate ? undefined : text,
          sessionId: activeId ?? undefined,
          ownerToken,
          mode,
          documentId: docs[0]?.id ?? null,
          regenerate,
        }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        const code = data?.code ?? 'unknown';
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
        if (code === 'ai_not_configured' || code === 'ai_disabled') {
          setNotice({ kind: 'config', title: code === 'ai_disabled' ? 'FRANCIS AI is turned off' : 'FRANCIS AI is not configured yet', body: data?.message ?? 'The site owner can activate the assistant from the server environment or the admin studio. No simulated answers are shown.' });
        } else if (code === 'rate_limited') {
          setNotice({ kind: 'rate', title: 'Hourly limit reached', body: data?.message ?? 'Please wait for the hourly window to reset.' });
        } else {
          setNotice({ kind: 'error', title: 'FRANCIS AI could not respond', body: data?.message ?? `Provider error (${res.status}).` });
        }
        setStreaming(false);
        return;
      }

      // SSE stream
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let sources: Source[] | null = null;
      let createdSessionId: string | null = null;

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const raw of lines) {
          const line = raw.trim();
          if (!line.startsWith('data:')) continue;
          let event: Record<string, unknown>;
          try { event = JSON.parse(line.slice(5).trim()); } catch { continue; }

          if (event.type === 'meta' && typeof event.sessionId === 'string') {
            createdSessionId = event.sessionId;
            setActiveId(event.sessionId);
          } else if (event.type === 'sources' && Array.isArray(event.sources)) {
            sources = event.sources as Source[];
          } else if (event.type === 'token' && typeof event.text === 'string') {
            const token = event.text;
            setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + token } : m)));
          } else if (event.type === 'error') {
            setNotice({ kind: 'error', title: 'Stream interrupted', body: String(event.message ?? 'The response stream failed.') });
          }
        }
      }

      setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, pending: false, sources } : m)));
      if (createdSessionId) refreshSessions(ownerToken);
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, pending: false, content: m.content || '*(stopped)*' } : m)));
      } else {
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
        setNotice({ kind: 'error', title: 'Connection failed', body: 'The request could not reach the server. Check your connection and try again.' });
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
      if (ownerToken) refreshSessions(ownerToken);
    }
  };

  const stop = () => abortRef.current?.abort();

  const regenerate = () => {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    if (!lastUser || streaming) return;
    setMessages((prev) => {
      const idx = [...prev].map((m) => m.role).lastIndexOf('assistant');
      return idx >= 0 ? prev.slice(0, idx) : prev;
    });
    void send(undefined, true);
  };

  const copyMessage = async (m: ChatMessage) => {
    try {
      await navigator.clipboard.writeText(m.content);
      setCopiedId(m.id);
      window.setTimeout(() => setCopiedId(null), 1800);
    } catch { /* noop */ }
  };

  const uploadFile = async (file: File) => {
    if (!ownerToken) return;
    setUploading(true);
    setNotice(null);
    try {
      const form = new FormData();
      form.append('owner', ownerToken);
      form.append('file', file);
      const res = await fetch('/api/ai/upload', { method: 'POST', body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setNotice({ kind: 'error', title: 'Upload failed', body: data?.message ?? 'The document could not be processed.' });
      } else {
        setDocs([data.document as AttachedDoc]);
      }
    } catch {
      setNotice({ kind: 'error', title: 'Upload failed', body: 'The document could not be uploaded. Try again.' });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const autoGrow = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  };

  const activeMode = MODES.find((m) => m.id === mode) ?? MODES[0];
  const isEmpty = messages.length === 0;
  const canSend = !streaming && input.trim().length > 0;

  return (
    <div className="flex h-[100svh] overflow-hidden bg-mist text-ink">
      {/* ══════════ Sidebar ══════════ */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-[300px] shrink-0 flex-col border-r border-navy/8 bg-white transition-transform duration-300 md:static md:translate-x-0',
          sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        )}
        aria-label="Conversations"
      >
        <div className="flex items-center justify-between border-b border-navy/8 px-4 py-3.5">
          <Link href="/" className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.25em] text-navy/60 transition hover:text-electric" aria-label="Back to FRANCIS portfolio">
            <ArrowLeft size={14} /> Portfolio
          </Link>
          <button className="rounded-lg p-2 text-navy/60 hover:bg-mist hover:text-navy md:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar">
            <X size={17} />
          </button>
        </div>

        <div className="p-4">
          <button onClick={newChat} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-navy px-4 py-3.5 font-display text-[12px] font-bold uppercase tracking-[0.22em] text-white transition hover:bg-electric">
            <Plus size={16} strokeWidth={2.5} /> New conversation
          </button>
        </div>

        {/* Mode switcher */}
        <div className="px-4 pb-3">
          <p className="mb-2 px-1 font-mono text-[9px] uppercase tracking-[0.35em] text-ink/40">Mode</p>
          <div className="grid grid-cols-2 gap-1.5">
            {MODES.map((m) => {
              const Icon = m.icon;
              const active = m.id === mode;
              return (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  aria-pressed={active}
                  title={m.hint}
                  className={cn(
                    'flex items-center gap-2 rounded-xl border px-3 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] transition',
                    active ? 'border-electric bg-electric text-white' : 'border-navy/10 bg-mist text-navy/70 hover:border-electric/50 hover:text-navy'
                  )}
                >
                  <Icon size={13} strokeWidth={2.2} /> {m.label}
                </button>
              );
            })}
          </div>
          <p className="mt-2 px-1 text-[10.5px] leading-4 text-ink/45">{activeMode.hint}</p>
        </div>

        {/* Session list */}
        <div className="flex-1 overflow-y-auto border-t border-navy/8 px-3 py-3">
          <p className="mb-2 px-1 font-mono text-[9px] uppercase tracking-[0.35em] text-ink/40">History</p>
          {sessions.length === 0 && (
            <p className="rounded-xl border border-dashed border-navy/15 px-4 py-6 text-center text-[11.5px] leading-5 text-ink/45">
              No conversations yet.<br />Your chats stay private to this browser.
            </p>
          )}
          <ul className="space-y-1">
            {sessions.map((session) => {
              const editing = editingId === session.id;
              const confirming = confirmDeleteId === session.id;
              const isActive = activeId === session.id;
              return (
                <li key={session.id} className={cn('group rounded-xl border transition', isActive ? 'border-electric/40 bg-skylight/60' : 'border-transparent hover:bg-mist')}>
                  {editing ? (
                    <div className="flex items-center gap-1.5 p-2">
                      <input autoFocus value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') renameSession(session.id); if (e.key === 'Escape') setEditingId(null); }}
                        className="w-full rounded-lg border border-electric bg-white px-2.5 py-2 text-[12px] outline-none" aria-label="Rename conversation" />
                      <button onClick={() => renameSession(session.id)} className="rounded-lg bg-electric p-2 text-white" aria-label="Save name"><Check size={13} /></button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 py-1.5 pl-1 pr-1.5">
                      <button onClick={() => openSession(session.id)} className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-1.5 py-1.5 text-left">
                        <MessageSquare size={13} className="shrink-0 text-electric/70" />
                        <span className="min-w-0">
                          <span className="block truncate text-[12px] font-semibold text-navy">{session.title}</span>
                          <span className="font-mono text-[9px] uppercase tracking-wider text-ink/40">{session.mode} · {timeAgo(session.updated_at)}</span>
                        </span>
                      </button>
                      <button onClick={() => { setEditingId(session.id); setEditTitle(session.title); }} className="rounded-lg p-1.5 text-ink/35 opacity-0 transition hover:bg-white hover:text-navy focus:opacity-100 group-hover:opacity-100" aria-label="Rename conversation"><Pencil size={12} /></button>
                      {confirming ? (
                        <button onClick={() => deleteSession(session.id)} className="rounded-lg bg-red-600 px-2 py-1.5 text-[9px] font-bold uppercase tracking-wider text-white" aria-label="Confirm delete">Delete</button>
                      ) : (
                        <button onClick={() => setConfirmDeleteId(session.id)} className="rounded-lg p-1.5 text-ink/35 opacity-0 transition hover:bg-white hover:text-red-600 focus:opacity-100 group-hover:opacity-100" aria-label="Delete conversation"><Trash2 size={12} /></button>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="border-t border-navy/8 px-4 py-3">
          <div className="flex items-center gap-2.5" title={status?.configured ? 'Cloud AI connected via OPENAI_API_KEY' : 'Built-in local engine active — add OPENAI_API_KEY in Vercel for full cloud intelligence'}>
            <span className={cn('h-2 w-2 rounded-full', status?.enabled ? (status?.configured ? 'bg-emerald-500' : 'bg-[#ff8a00] animate-pulse-dot') : 'bg-red-500')} />
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-ink/55">
              {status?.enabled ? (status?.configured ? 'FRANCIS AI online' : 'FRANCIS AI — local mode') : 'AI disabled'}
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-navy/50 backdrop-blur-sm md:hidden" onClick={() => setSidebarOpen(false)} aria-hidden="true" />}

      {/* ══════════ Main stage ══════════ */}
      <main className="relative flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="flex items-center justify-between gap-3 border-b border-navy/8 bg-white/85 px-4 py-2.5 backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-3">
            <button className="rounded-xl border border-navy/10 p-2 text-navy md:hidden" onClick={() => setSidebarOpen(true)} aria-label="Open sidebar">
              <Menu size={18} />
            </button>
            <LogoMark className="h-9 w-9" />
            <div>
              <p className="font-display text-[15px] font-bold leading-tight tracking-wide text-navy">FRANCIS <span className="text-electric">AI</span></p>
              <p className="hidden text-[9px] font-medium uppercase tracking-[0.28em] text-ink/45 sm:block">More than a portfolio. Your intelligent digital assistant.</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={newChat} title="New conversation" className="rounded-xl border border-navy/10 p-2.5 text-navy/70 transition hover:border-electric hover:text-electric" aria-label="New conversation"><Plus size={17} /></button>
            {activeId && confirmDeleteId === activeId ? (
              <span className="flex items-center gap-1.5">
                <span className="hidden font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-red-500 sm:inline">Clear chat?</span>
                <button onClick={() => deleteSession(activeId)} className="rounded-xl bg-red-600 px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-white" aria-label="Confirm clear conversation">Clear</button>
                <button onClick={() => setConfirmDeleteId(null)} className="rounded-xl border border-navy/10 p-2.5 text-navy/60" aria-label="Keep conversation"><X size={16} /></button>
              </span>
            ) : (
              <button onClick={activeId ? () => setConfirmDeleteId(activeId) : undefined} disabled={!activeId} title="Clear conversation" className="rounded-xl border border-navy/10 p-2.5 text-navy/70 transition enabled:hover:border-red-400 enabled:hover:text-red-500 disabled:opacity-35" aria-label="Clear conversation"><Trash2 size={17} /></button>
            )}
          </div>
        </header>

        {/* Messages */}
        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
          {isEmpty ? (
            <div className="mx-auto flex h-full max-w-3xl flex-col items-center justify-center gap-6 px-5 py-10 text-center">
              <div className="relative">
                <div className="absolute inset-0 -m-6 rounded-full bg-[radial-gradient(circle,rgba(225,6,0,0.18),transparent_70%)]" />
                <LogoMark className="relative h-20 w-20" />
              </div>
              <div>
                <h1 className="display-tight text-3xl font-bold text-navy sm:text-4xl">Ask <span className="text-electric">FRANCIS AI</span> anything.</h1>
                <p className="mx-auto mt-3 max-w-lg text-[13.5px] leading-6 text-ink/65">{status?.welcome ?? "General knowledge, programming, research, writing, learning — and everything about Francis and this platform."}</p>
              </div>
              <div className="grid w-full max-w-2xl gap-2 sm:grid-cols-2">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt.label}
                    onClick={() => { setMode(prompt.mode); void send(prompt.text); }}
                    className="group rounded-2xl border border-navy/10 bg-white px-4 py-3.5 text-left text-[12.5px] font-semibold leading-5 text-navy shadow-sm transition hover:-translate-y-0.5 hover:border-electric hover:shadow-none"
                  >
                    <span className="mb-1 block font-mono text-[8.5px] uppercase tracking-[0.3em] text-electric">{prompt.mode}</span>
                    {prompt.label}
                  </button>
                ))}
              </div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-ink/35">PDF · TXT · DOCX upload supported</p>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-5 px-4 py-6 sm:px-6">
              {messages.map((message) => {
                const isUser = message.role === 'user';
                return (
                  <div key={message.id} className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
                    <div className={cn('mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full border', isUser ? 'border-navy bg-navy text-skylight' : 'border-electric/40 bg-skylight text-electric')} aria-hidden="true">
                      {isUser ? <User size={14} /> : <Bot size={14} />}
                    </div>
                    <div className={cn('min-w-0 max-w-[88%] sm:max-w-[82%]', isUser && 'flex flex-col items-end')}>
                      <div className={cn(
                        'rounded-2xl px-4 py-3 text-[13.5px] leading-6',
                        isUser ? 'rounded-tr-md bg-navy text-[#F6F6F6]' : 'rounded-tl-md border border-navy/10 bg-white text-ink shadow-sm'
                      )}>
                        {isUser ? (
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        ) : message.pending && !message.content ? (
                          <span className="flex items-center gap-1.5 py-1" aria-label="FRANCIS AI is thinking">
                            {[0, 1, 2].map((i) => <span key={i} className="h-2 w-2 animate-pulse-dot rounded-full bg-electric" style={{ animationDelay: `${i * 0.16}s` }} />)}
                          </span>
                        ) : (
                          <Markdown text={message.content} />
                        )}
                      </div>

                      {/* Sources */}
                      {message.sources && message.sources.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {message.sources.map((source, i) => (
                            <a key={i} href={source.url} target="_blank" rel="noreferrer noopener" title={source.snippet || source.title}
                              className="inline-flex max-w-[240px] items-center gap-1.5 truncate rounded-full border border-electric/30 bg-skylight/70 px-2.5 py-1 text-[10px] font-semibold text-navy transition hover:border-electric hover:text-electric">
                              <ExternalLink size={9} className="shrink-0" /> <span className="truncate">{new URL(source.url).hostname.replace(/^www\./, '')}</span>
                            </a>
                          ))}
                        </div>
                      )}

                      {/* Assistant actions */}
                      {!isUser && !message.pending && message.content && (
                        <div className="mt-1.5 flex items-center gap-1">
                          <button onClick={() => copyMessage(message)} className="rounded-lg p-1.5 text-ink/35 transition hover:bg-white hover:text-navy" aria-label="Copy response" title="Copy response">
                            {copiedId === message.id ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                          </button>
                          <button onClick={regenerate} className="rounded-lg p-1.5 text-ink/35 transition hover:bg-white hover:text-navy" aria-label="Regenerate response" title="Regenerate">
                            <RefreshCw size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Notice banner */}
        {notice && (
          <div className="mx-auto w-full max-w-3xl px-4 sm:px-6" role="alert">
            <div className={cn('flex items-start gap-3 rounded-2xl border px-5 py-4 text-[13px] leading-6', notice.kind === 'config' ? 'border-amber-300 bg-amber-50 text-amber-900' : 'border-red-200 bg-red-50 text-red-900')}>
              <AlertTriangle size={17} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-bold">{notice.title}</p>
                <p className="mt-0.5">{notice.body}</p>
                {notice.kind === 'config' && (
                  <code className="mt-2 block rounded-lg bg-navy px-3 py-2 font-mono text-[10.5px] text-skylight">OPENAI_API_KEY=… · OPENAI_BASE_URL=https://api.openai.com/v1 · AI_MODEL=gpt-4o-mini</code>
                )}
              </div>
              <button onClick={() => setNotice(null)} className="ml-auto rounded-lg p-1 hover:bg-black/5" aria-label="Dismiss"><X size={15} /></button>
            </div>
          </div>
        )}

        {/* Attached doc chips */}
        {docs.length > 0 && (
          <div className="mx-auto flex w-full max-w-3xl flex-wrap gap-2 px-4 pt-3 sm:px-6">
            {docs.map((doc) => (
              <span key={doc.id} className="inline-flex items-center gap-2 rounded-full border border-electric/35 bg-skylight py-1.5 pl-3 pr-2 text-[11px] font-semibold text-navy">
                <FileText size={12} className="text-electric" /> {doc.name}
                <button onClick={() => setDocs((prev) => prev.filter((d) => d.id !== doc.id))} className="rounded-full p-0.5 text-navy/50 hover:text-red-600" aria-label="Remove document"><X size={12} /></button>
              </span>
            ))}
          </div>
        )}

        {/* Composer */}
        <div className="border-t border-navy/8 bg-white/90 backdrop-blur-xl">
          <div className="mx-auto max-w-3xl px-4 py-3 sm:px-6">
            <input ref={fileRef} type="file" accept=".pdf,.txt,.docx" className="hidden" aria-hidden="true" tabIndex={-1}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadFile(f); }} />
            <div className="flex items-end gap-2 rounded-[26px] border border-navy/15 bg-white p-2 shadow-glass transition focus-within:border-electric focus-within:ring-2 focus-within:ring-electric/20">
              <button onClick={() => fileRef.current?.click()} disabled={uploading} title="Attach PDF, TXT or DOCX" aria-label="Attach document"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-navy/60 transition hover:bg-mist hover:text-electric disabled:opacity-50">
                {uploading ? <Loader2 size={18} className="animate-spin" /> : <Paperclip size={18} />}
              </button>
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={(e) => { setInput(e.target.value); autoGrow(); }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    if (canSend) void send();
                  }
                }}
                placeholder="Ask FRANCIS AI anything…"
                aria-label="Ask FRANCIS AI anything"
                className="max-h-[200px] min-h-[44px] flex-1 resize-none bg-transparent py-2.5 text-[15px] leading-6 text-ink outline-none placeholder:text-ink/38"
              />
              {streaming ? (
                <button onClick={stop} aria-label="Stop generation" title="Stop generation"
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-navy text-white transition hover:bg-red-600">
                  <Square size={15} fill="currentColor" />
                </button>
              ) : (
                <button onClick={() => void send()} disabled={!canSend} aria-label="Send message" title="Send message"
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-electric text-white transition enabled:hover:bg-[#c00500] disabled:opacity-35">
                  <SendHorizontal size={18} />
                </button>
              )}
            </div>
            <p className="mt-2 text-center font-mono text-[8.5px] uppercase tracking-[0.25em] text-ink/35">
              FRANCIS AI can make mistakes — verify critical information. Enter ↵ to send · Shift+Enter for a new line
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
