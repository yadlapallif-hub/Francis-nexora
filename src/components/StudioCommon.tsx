import type { ReactNode } from 'react'
import { FolderOpen, Plus, Trash2 } from 'lucide-react'
import { useStudioDocs } from '../hooks/useStudioDocs'
import { relativeTime } from '../lib/format'
import type { StudioDocument } from '../lib/studio'
import { Notice, Spinner } from './UI'

type Drafts = ReturnType<typeof useStudioDocs>
export function SavedDrafts({ drafts, onLoad, onNew }: { drafts: Drafts; onLoad: (document: StudioDocument) => void; onNew: () => void }) {
  return <section className="panel saved-drafts">
    <div className="saved-drafts-head"><div><span className="section-kicker">YOUR LIBRARY</span><h2>Saved drafts</h2></div><button className="button button-secondary button-small" type="button" onClick={onNew}><Plus size={14} /> New</button></div>
    {!drafts.session ? <p>Sign in before editing if you want to save drafts to your account. Guest drafts reset when you sign in or leave this page.</p> : drafts.loading ? <div className="empty-inline"><Spinner /> Loading drafts…</div> : !drafts.documents.length ? <p>No saved drafts yet. Your work stays here once you save it.</p> : <div className="saved-draft-list">{drafts.documents.map((item) => <div className={`saved-draft ${item.id === drafts.selectedId ? 'selected' : ''}`} key={item.id}>
      <button type="button" className="saved-draft-open" onClick={() => onLoad(item)} aria-label={`Open ${item.title}`}><FolderOpen size={15} /><span><strong>{item.title}</strong><small>{relativeTime(item.updated_at)}</small></span></button><button type="button" className="icon-button" aria-label={`Delete ${item.title}`} onClick={() => void drafts.remove(item.id)}><Trash2 size={15} /></button>
    </div>)}</div>}
    {drafts.error && <Notice tone="error">{drafts.error}</Notice>}{drafts.message && <Notice tone="success">{drafts.message}</Notice>}
    <p className="studio-privacy">Saved drafts are private to your account. Don’t include passwords or API keys.</p>
  </section>
}
export function StudioNote({ children }: { children: ReactNode }) { return <div className="studio-note">{children}</div> }
