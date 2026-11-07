import { useState, type FormEvent } from 'react'
import { Brain, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { relativeTime } from '../lib/format'
import { containsLikelySecret } from '../lib/privacy'
import { supabase } from '../lib/supabase'
import type { Memory as MemoryItem } from '../lib/types'
import { AccessPrompt, Modal, Notice, PageTitle, Spinner } from '../components/UI'

export function Memory() {
  const { session, openAuth } = useAuth()
  const { memories, profile, loading, error: dataError, refresh } = useData()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<MemoryItem | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [search, setSearch] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  function show(item?: MemoryItem) { setEditing(item || null); setTitle(item?.title || ''); setContent(item?.content || ''); setError(''); setOpen(true) }
  async function save(event: FormEvent) {
    event.preventDefault(); if (!supabase || !session || !title.trim() || !content.trim()) return
    if (containsLikelySecret(`${title} ${content}`)) { setError('Please remove private keys or tokens before saving.'); return }
    setBusy(true); setError('')
    const result = editing ? await supabase.from('nexora_memory').update({ title: title.trim(), content: content.trim() }).eq('id', editing.id) : await supabase.from('nexora_memory').insert({ user_id: session.user.id, title: title.trim(), content: content.trim() })
    setBusy(false)
    if (result.error) setError('Could not save this memory. Please try again.')
    else { setOpen(false); await refresh() }
  }
  async function remove(id: string) {
    if (!supabase || !window.confirm('Delete this memory? This cannot be undone.')) return
    const { error: deleteError } = await supabase.from('nexora_memory').delete().eq('id', id)
    if (deleteError) setError('Could not delete this memory.')
    else await refresh()
  }
  async function toggle() {
    if (!supabase || !session || !profile) return
    const { error: updateError } = await supabase.from('nexora_profiles').update({ memory_enabled: !profile.memory_enabled }).eq('id', session.user.id)
    if (updateError) setError('Could not update the memory preference.')
    else await refresh()
  }
  const visible = memories.filter((m) => `${m.title} ${m.content}`.toLowerCase().includes(search.trim().toLowerCase()))
  return <div className="page-content"><PageTitle eyebrow="THE CONTEXT THAT MATTERS" title="Agent Memory." description="Keep the details you want to remember, on your terms." action={<button className="button button-primary" onClick={() => session ? show() : openAuth()}><Plus size={16} /> Add a memory</button>} />
    <div className="info-banner"><span className="info-banner-icon"><Brain size={18} /></span><div><strong>Your memory, your choice</strong><p>Saved notes are private to your account. They are not automatically included in AI prompts in this build. Never save passwords or API keys.</p></div>{session && profile && <button className={`toggle ${profile.memory_enabled ? 'toggle-on' : ''}`} role="switch" aria-checked={profile.memory_enabled} aria-label="Memory preference" onClick={() => void toggle()}><span /></button>}</div>
    {!session ? <section className="panel large-empty"><AccessPrompt title="Remember what matters" description="Sign in to save and manage your own memory notes." /></section> : <section className="panel table-panel"><div className="panel-header"><div><span className="section-kicker">SAVED BY YOU</span><h2>Your memories</h2><p className="panel-subtext">Preference: {profile?.memory_enabled ? 'on' : 'off'} · AI use is not implemented yet.</p></div><div className="search-field"><Search size={15} /><input aria-label="Search memories" value={search} placeholder="Search memories" onChange={(e) => setSearch(e.target.value)} /></div></div>{((!open && error) || dataError) && <Notice tone="error">{(!open && error) || dataError}</Notice>}
      {loading && !memories.length ? <div className="empty-inline"><Spinner /> Loading memories…</div> : !visible.length ? <div className="table-empty"><span className="empty-round"><Brain size={21} /></span><h3>{search ? 'No matching memories' : 'A little context goes a long way'}</h3><p>{search ? 'Try a different search.' : 'Save a note you’d like to keep close.'}</p></div> : <div className="memory-grid">{visible.map((item) => <article className="memory-card" key={item.id}><div className="memory-card-top"><span className="quick-icon purple"><Brain size={17} /></span><div><button className="icon-button" onClick={() => show(item)} aria-label={`Edit ${item.title}`}><Pencil size={15} /></button><button className="icon-button" onClick={() => void remove(item.id)} aria-label={`Delete ${item.title}`}><Trash2 size={15} /></button></div></div><h3>{item.title}</h3><p>{item.content}</p><small>Updated {relativeTime(item.updated_at)}</small></article>)}</div>}
    </section>}
    {open && <Modal title={editing ? 'Edit memory' : 'Add a memory'} onClose={() => setOpen(false)}><p className="modal-description">Save only the context you want to keep. Avoid secrets and sensitive information.</p>{error && <Notice tone="error">{error}</Notice>}<form className="form-stack" onSubmit={save}><label>Title<input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} required placeholder="Give this memory a name" /></label><label>Memory<textarea value={content} onChange={(e) => setContent(e.target.value)} maxLength={2000} rows={5} required placeholder="What would you like to remember?" /></label><div className="modal-actions"><button type="button" className="button button-secondary" onClick={() => setOpen(false)}>Cancel</button><button className="button button-primary" disabled={busy || !title.trim() || !content.trim()}>{busy ? <Spinner /> : 'Save memory'}</button></div></form></Modal>}
  </div>
}
