import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'
import { ArrowDown, ArrowRight, Check, Copy, MessageSquareText, MoreHorizontal, Pencil, Plus, RotateCcw, Search, Send, Sparkles, Trash2, WandSparkles } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { safeError, sendChat } from '../lib/api'
import { relativeTime } from '../lib/format'
import { containsLikelySecret } from '../lib/privacy'
import { supabase } from '../lib/supabase'
import type { Message, Page } from '../lib/types'
import { AccessPrompt, Brand, Modal, Notice, Spinner } from '../components/UI'

type Props = { navigate: (page: Page) => void; intent: { id: number; conversationId?: string; draft?: string } }
function CodeBlock({ children }: { children?: ReactNode }) {
  const ref = useRef<HTMLPreElement>(null)
  const [copied, setCopied] = useState(false)
  return <div className="code-wrap"><button className="code-copy" onClick={async () => { try { await navigator.clipboard.writeText(ref.current?.textContent || ''); setCopied(true); window.setTimeout(() => setCopied(false), 1800) } catch { setCopied(false) } }}>{copied ? <Check size={13} /> : <Copy size={13} />}{copied ? 'Copied' : 'Copy code'}</button><pre ref={ref}>{children}</pre></div>
}
function MessageContent({ content }: { content: string }) {
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState(false)
  return <><div className="markdown"><ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]} components={{ pre: ({ children }) => <CodeBlock>{children}</CodeBlock>, a: ({ children, href }) => <a href={href} target="_blank" rel="noopener noreferrer">{children}</a> }}>{content}</ReactMarkdown></div><button className="message-copy" onClick={async () => { try { await navigator.clipboard.writeText(content); setCopied(true); setCopyError(false); window.setTimeout(() => setCopied(false), 1800) } catch { setCopyError(true) } }}><span>{copied ? <Check size={13} /> : <Copy size={13} />}</span>{copyError ? 'Copy unavailable' : copied ? 'Copied' : 'Copy response'}</button></>
}
export function Workspace({ navigate, intent }: Props) {
  const { session, openAuth } = useAuth()
  const { conversations, refresh, provider, markConnected } = useData()
  const [selected, setSelected] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [failed, setFailed] = useState<{ conversationId: string; requestId: string; text: string; userId: string } | null>(null)
  const [renaming, setRenaming] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [renameBusy, setRenameBusy] = useState(false)
  const selectedRef = useRef<string | null>(null)
  const textarea = useRef<HTMLTextAreaElement>(null)
  const bottom = useRef<HTMLDivElement>(null)
  selectedRef.current = selected
  const userId = session?.user.id
  const previousUser = useRef(userId)
  const currentUser = useRef(userId)
  currentUser.current = userId
  const visibleMessages = messages.filter((message) => message.user_id === userId)
  const conversation = conversations.find((item) => item.id === selected)
  const filtered = conversations.filter((item) => item.title.toLowerCase().includes(search.toLowerCase().trim()))
  useEffect(() => { setSelected(intent.conversationId || null); setDraft(intent.draft || ''); setError(''); setFailed(null) }, [intent])
  useEffect(() => { if (previousUser.current !== userId) { previousUser.current = userId; setMessages([]); setSelected(null); setFailed(null); setError(''); setSending(false) } }, [userId])
  const loadMessages = useCallback(async (id: string) => {
    if (!supabase || !userId) return
    setLoading(true)
    const { data, error: queryError } = await supabase.from('nexora_messages').select('*').eq('conversation_id', id).eq('user_id', userId).order('created_at', { ascending: false }).limit(100)
    if (selectedRef.current !== id || currentUser.current !== userId) return
    if (queryError) setError('Could not load messages. Please try again.')
    else setMessages(((data || []) as Message[]).reverse())
    setLoading(false)
  }, [userId])
  useEffect(() => { if (selected) void loadMessages(selected); else { setMessages([]); setLoading(false) } }, [selected, loadMessages])
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages.length, sending])
  const startNew = () => { setSelected(null); setDraft(''); setFailed(null); setError(''); textarea.current?.focus() }
  async function send(text: string, requestId?: string, existingId?: string) {
    if (!supabase || !session || sending) return
    const trimmed = text.trim()
    if (!trimmed || trimmed.length > 6000) { setError('Messages must contain 1 to 6,000 characters.'); return }
    if (containsLikelySecret(trimmed)) { setError('Please remove private keys or tokens before sending.'); return }
    const requestUser = session.user.id
    setSending(true); setError('')
    let conversationId = existingId || selected
    const id = requestId || crypto.randomUUID()
    try {
      if (!conversationId) {
        const title = trimmed.replace(/\s+/g, ' ').slice(0, 70) || 'New conversation'
        const created = await supabase.from('nexora_conversations').insert({ user_id: session.user.id, title }).select('id').single()
        if (created.error || !created.data) throw created.error || new Error('Could not create the conversation.')
        conversationId = created.data.id as string
        selectedRef.current = conversationId
        setSelected(conversationId)
      }
      setDraft(''); setFailed({ conversationId, requestId: id, text: trimmed, userId: requestUser })
      await sendChat(session.access_token, conversationId, id, trimmed)
      if (currentUser.current !== requestUser) return
      markConnected(session.access_token); setFailed(null)
      await Promise.all([refresh(), loadMessages(conversationId)])
    } catch (cause) {
      if (currentUser.current !== requestUser) return
      setError(safeError(cause, 'Could not send your message.'))
      if (conversationId) { setFailed({ conversationId, requestId: id, text: trimmed, userId: requestUser }); await Promise.all([refresh(), loadMessages(conversationId)]) }
      else setDraft(trimmed)
    } finally { if (currentUser.current === requestUser) setSending(false) }
  }
  async function rename(event: FormEvent) {
    event.preventDefault()
    if (!supabase || !selected || !newTitle.trim()) return
    setRenameBusy(true); setError('')
    const { error: updateError } = await supabase.from('nexora_conversations').update({ title: newTitle.trim() }).eq('id', selected)
    setRenameBusy(false)
    if (updateError) setError('Could not rename this conversation.')
    else { setRenaming(false); await refresh() }
  }
  async function remove() {
    if (!supabase || !selected || !window.confirm('Delete this conversation and its messages? This cannot be undone.')) return
    const { error: deleteError } = await supabase.from('nexora_conversations').delete().eq('id', selected)
    if (deleteError) setError('Could not delete this conversation.')
    else { startNew(); await refresh() }
  }
  const pending = failed && failed.userId === userId && failed.conversationId === selected && !visibleMessages.some((message) => message.request_id === failed.requestId && message.role === 'assistant') ? failed : null
  const last = visibleMessages[visibleMessages.length - 1]
  const savedUnanswered = !pending && last?.role === 'user' && !visibleMessages.some((item) => item.request_id === last.request_id && item.role === 'assistant') ? last : null
  const canSend = Boolean(session && !sending && provider.state !== 'not-configured' && provider.state !== 'checking' && provider.state !== 'testing')
  return <div className="page-content workspace-page"><div className="workspace-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> YOUR THINKING PARTNER</div><h1>AI Workspace<span className="greeting-dot">.</span></h1><p>Think out loud, find clarity, and make room for your best ideas.</p></div><button className="button button-secondary" onClick={() => session ? startNew() : openAuth()}><Plus size={16} /> New conversation</button></div>
    <div className="workspace-shell"><aside className="conversation-sidebar"><div className="conversation-heading"><span>CONVERSATIONS</span><button className="icon-button" aria-label="New conversation" onClick={() => session ? startNew() : openAuth()}><Plus size={18} /></button></div><div className="search-field"><Search size={15} /><input aria-label="Search conversations" placeholder="Search conversations" value={search} onChange={(e) => setSearch(e.target.value)} /></div><div className="conversation-list">{!session ? <p className="conversation-empty">Sign in to keep your conversations in one place.</p> : filtered.length ? filtered.map((item) => <button key={item.id} onClick={() => { setSelected(item.id); setError(''); setFailed(null) }} className={`conversation-item ${selected === item.id ? 'selected' : ''}`}><MessageSquareText size={15} /><span><strong>{item.title}</strong><small>{relativeTime(item.updated_at)}</small></span><MoreHorizontal size={15} /></button>) : <p className="conversation-empty">{search ? 'No conversations match your search.' : 'Your conversations will appear here.'}</p>}</div><div className="conversation-foot"><span className="status-dot status-configured" /> Your conversations are private to you</div></aside>
    <div className="chat-area"><div className="chat-top"><div><strong>{conversation?.title || 'New conversation'}</strong><small>{selected ? 'Saved to your workspace' : 'A fresh space for your ideas'}</small></div><div className="chat-top-actions">{selected && <><button className="icon-button" aria-label="Rename conversation" title="Rename conversation" onClick={() => { setNewTitle(conversation?.title || ''); setRenaming(true) }}><Pencil size={16} /></button><button className="icon-button" aria-label="Delete conversation" title="Delete conversation" onClick={() => void remove()}><Trash2 size={16} /></button></>}<button className="model-mini" onClick={() => navigate('model')}><span className={`status-dot status-${provider.state}`} />{provider.model || 'Model settings'}</button></div></div>
      {!session ? <div className="chat-gated"><AccessPrompt title="Let’s make space for your ideas" description="Sign in to start a conversation and keep your history saved securely." /></div> : <>
        {provider.state === 'not-configured' && <div className="chat-banner"><span><Sparkles size={16} /> Ollama Cloud isn’t configured yet. Your AI requests won’t run until it is set up.</span><button onClick={() => navigate('model')}>View setup <ArrowRight size={14} /></button></div>}
        <div className="chat-scroll">{loading ? <div className="chat-loading"><Spinner /> Loading conversation…</div> : !visibleMessages.length && !pending && !sending ? <div className="chat-empty"><div className="chat-empty-mark"><Brand compact /><span>✳</span></div><span className="section-kicker">A LITTLE CLARITY STARTS HERE</span><h2>What’s on your mind?</h2><p>Ask a question, explore an idea, or turn a blank page into a plan.</p><div className="suggestion-grid">{[{ title: 'Make a plan', text: 'Help me break a big goal into manageable steps.' }, { title: 'Get unstuck', text: 'Help me think through a problem step by step.' }, { title: 'Write something', text: 'Help me write a thoughtful first draft.' }].map((item) => <button key={item.title} onClick={() => { setDraft(item.text); textarea.current?.focus() }}><Sparkles size={15} /><span><strong>{item.title}</strong><small>{item.text}</small></span><ArrowUpRightIcon /></button>)}</div></div> : <div className="messages">{visibleMessages.map((message) => <div className={`message-row message-${message.role}`} key={message.id}><span className="message-avatar">{message.role === 'assistant' ? <img src="/nexora-mark.svg" alt="" /> : (session.user.email?.charAt(0) || 'U').toUpperCase()}</span><div className="message-body"><div className="message-meta"><strong>{message.role === 'assistant' ? 'NEXORA' : 'You'}</strong><span>{relativeTime(message.created_at)}</span></div>{message.role === 'assistant' ? <MessageContent content={message.content} /> : <div className="user-message">{message.content}</div>}</div></div>)}
          {pending && !visibleMessages.some((m) => m.request_id === pending.requestId && m.role === 'user') && <div className="message-row message-user"><span className="message-avatar">{(session.user.email?.charAt(0) || 'U').toUpperCase()}</span><div className="message-body"><div className="message-meta"><strong>You</strong><span>Just now</span></div><div className="user-message">{pending.text}</div></div></div>}
          {sending && <div className="thinking"><Spinner size={15} /> NEXORA is thinking… <small>Responses are not streamed yet.</small></div>}
          {(pending || savedUnanswered) && !sending && <div className="retry-box"><span>The last message has no saved response.</span><button onClick={() => { const item = pending || (savedUnanswered && { conversationId: savedUnanswered.conversation_id, requestId: savedUnanswered.request_id, text: savedUnanswered.content }); if (item) void send(item.text, item.requestId, item.conversationId) }}><RotateCcw size={14} /> Retry</button></div>}
          <div ref={bottom} /></div>}</div>
        <div className="composer-area">{error && <Notice tone="error">{error}</Notice>}<form className="composer" onSubmit={(e) => { e.preventDefault(); void send(draft) }}><textarea ref={textarea} aria-label="Message NEXORA" placeholder={provider.state === 'not-configured' ? 'Configure your AI model to start chatting…' : 'Ask anything, or share what’s on your mind…'} value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={6000} rows={2} disabled={!canSend} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); void send(draft) } }} /><div className="composer-bottom"><span><WandSparkles size={14} /> Text only <span>·</span> Enter to send</span><button aria-label="Send message" title="Send message" disabled={!canSend || !draft.trim()}>{sending ? <Spinner /> : <Send size={16} />}</button></div></form><p className="composer-foot"><ArrowDown size={12} /> AI can make mistakes. Please review responses and never share passwords or API keys.</p></div>
      </>}
    </div></div>
    {renaming && <Modal title="Rename conversation" onClose={() => setRenaming(false)}><form onSubmit={rename} className="form-stack"><label>Conversation title<input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} maxLength={120} required /></label><div className="modal-actions"><button type="button" className="button button-secondary" onClick={() => setRenaming(false)}>Cancel</button><button className="button button-primary" disabled={renameBusy || !newTitle.trim()}>{renameBusy ? <Spinner /> : 'Save title'}</button></div></form></Modal>}
  </div>
}
function ArrowUpRightIcon() { return <ArrowRight className="suggestion-arrow" size={14} /> }
