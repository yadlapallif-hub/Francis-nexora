import { useEffect, useState, type FormEvent } from 'react'
import { ArrowRight, ClipboardList, ListFilter, Plus, Search, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { taskStatusLabel, relativeTime } from '../lib/format'
import { containsLikelySecret } from '../lib/privacy'
import { supabase } from '../lib/supabase'
import type { TaskStatus } from '../lib/types'
import { AccessPrompt, Modal, Notice, PageTitle, Spinner } from '../components/UI'

export function Tasks({ newIntent, consumeIntent }: { newIntent: number; consumeIntent: () => void }) {
  const { session, openAuth } = useAuth()
  const { tasks, loading, error: dataError, refresh } = useData()
  const [createOpen, setCreateOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | TaskStatus>('all')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => { if (newIntent) { if (session) setCreateOpen(true); else openAuth(); consumeIntent() } }, [newIntent, session, openAuth, consumeIntent])
  async function create(event: FormEvent) {
    event.preventDefault(); if (!supabase || !session || !title.trim()) return
    if (containsLikelySecret(`${title} ${description}`)) { setError('Please remove private keys or tokens before saving.'); return }
    setBusy(true); setError('')
    const { error: insertError } = await supabase.from('nexora_tasks').insert({ user_id: session.user.id, title: title.trim(), description: description.trim(), status: 'queued' })
    setBusy(false)
    if (insertError) setError('Could not create the task. Please try again.')
    else { setCreateOpen(false); setTitle(''); setDescription(''); await refresh() }
  }
  async function updateStatus(id: string, status: TaskStatus) {
    if (!supabase) return
    setError('')
    const { error: updateError } = await supabase.from('nexora_tasks').update({ status }).eq('id', id)
    if (updateError) setError('Could not update the task.')
    else await refresh()
  }
  async function remove(id: string) {
    if (!supabase || !window.confirm('Delete this manual task? This cannot be undone.')) return
    const { error: deleteError } = await supabase.from('nexora_tasks').delete().eq('id', id)
    if (deleteError) setError('Could not delete the task.')
    else await refresh()
  }
  const visible = tasks.filter((task) => (filter === 'all' || task.status === filter) && `${task.title} ${task.description}`.toLowerCase().includes(search.trim().toLowerCase()))
  return <div className="page-content"><PageTitle eyebrow="A LITTLE MORE ORGANIZED" title="Task Manager." description="Keep track of what matters, one step at a time." action={<button className="button button-primary" onClick={() => session ? setCreateOpen(true) : openAuth()}><Plus size={16} /> Create a task</button>} />
    <div className="info-banner"><span className="info-banner-icon"><ListFilter size={18} /></span><div><strong>Manual tracking, with you in control</strong><p>Tasks here are created and updated by you. AI planning and automatic execution are not available yet.</p></div></div>
    {!session ? <section className="panel large-empty"><AccessPrompt title="Keep your priorities in one place" description="Sign in to create and manage your personal task list." /></section> : <section className="panel table-panel"><div className="panel-header"><div><span className="section-kicker">YOUR PRIORITIES</span><h2>All tasks</h2><p className="panel-subtext">Showing your most recently updated tasks.</p></div><div className="table-controls"><div className="search-field"><Search size={15} /><input aria-label="Search tasks" placeholder="Search tasks" value={search} onChange={(e) => setSearch(e.target.value)} /></div><select aria-label="Filter tasks by status" value={filter} onChange={(e) => setFilter(e.target.value as 'all' | TaskStatus)}><option value="all">All statuses</option>{Object.entries(taskStatusLabel).map(([key, value]) => <option value={key} key={key}>{value}</option>)}</select></div></div>
      {((!createOpen && error) || dataError) && <Notice tone="error">{(!createOpen && error) || dataError}</Notice>}
      {loading && !tasks.length ? <div className="empty-inline"><Spinner /> Loading tasks…</div> : !visible.length ? <div className="table-empty"><span className="empty-round"><ClipboardList size={21} /></span><h3>{search || filter !== 'all' ? 'No matching tasks' : 'A clear space to begin'}</h3><p>{search || filter !== 'all' ? 'Try another search or status.' : 'Create your first task and keep your next step in sight.'}</p>{!search && filter === 'all' && <button className="text-link" onClick={() => setCreateOpen(true)}>Create your first task <ArrowRight size={14} /></button>}</div> : <div className="task-list"><div className="task-list-label"><span>TASK</span><span>STATUS</span><span>UPDATED</span><span /></div>{visible.map((task) => <div className="task-row" key={task.id}><div className="task-info"><span className="task-icon"><ClipboardList size={17} /></span><span><strong>{task.title}</strong><small>{task.description || 'Manual task'}</small></span></div><select className={`task-status-select task-${task.status}`} aria-label={`Status for ${task.title}`} value={task.status} onChange={(e) => void updateStatus(task.id, e.target.value as TaskStatus)}>{Object.entries(taskStatusLabel).map(([key, value]) => <option value={key} key={key}>{value}</option>)}</select><time>{relativeTime(task.updated_at)}</time><button className="icon-button task-delete" aria-label={`Delete ${task.title}`} onClick={() => void remove(task.id)}><Trash2 size={16} /></button></div>)}</div>}
    </section>}
    {createOpen && <Modal title="Create a manual task" onClose={() => setCreateOpen(false)}><p className="modal-description">Add a priority to your workspace. Tasks won’t run automatically.</p>{error && <Notice tone="error">{error}</Notice>}<form className="form-stack" onSubmit={create}><label>Task title<input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} required placeholder="What would you like to get done?" /></label><label>Description <span className="optional">optional</span><textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={3000} rows={4} placeholder="Add a little context…" /></label><div className="modal-actions"><button type="button" className="button button-secondary" onClick={() => setCreateOpen(false)}>Cancel</button><button className="button button-primary" disabled={busy || !title.trim()}>{busy ? <Spinner /> : 'Create task'}</button></div></form></Modal>}
  </div>
}
