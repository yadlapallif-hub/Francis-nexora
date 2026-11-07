import { Activity as ActivityIcon } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { eventLabel } from '../lib/format'
import { AccessPrompt, Notice, PageTitle, Spinner } from '../components/UI'

export function Activity() {
  const { session } = useAuth()
  const { events, loading, error } = useData()
  return <div className="page-content"><PageTitle eyebrow="A CLEARER PICTURE" title="Activity Log." description="A simple record of what has happened in your workspace." />
    {!session ? <section className="panel large-empty"><AccessPrompt title="Your activity, all in one place" description="Sign in to see the activity associated with your account." /></section> : <section className="panel table-panel"><div className="panel-header"><div><span className="section-kicker">YOUR HISTORY</span><h2>Recent activity</h2><p className="panel-subtext">The latest 50 chat tests and manual task events. Message contents and secrets are not logged here.</p></div></div>{error && <Notice tone="error">{error}</Notice>}{loading && !events.length ? <div className="empty-inline"><Spinner /> Loading activity…</div> : !events.length ? <div className="table-empty"><span className="empty-round"><ActivityIcon size={21} /></span><h3>No activity just yet</h3><p>Task updates and AI requests will appear here when they happen.</p></div> : <div className="activity-list full-activity">{events.map((event) => <div className="activity-item" key={event.id}><span className="event-icon"><ActivityIcon size={15} /></span><span><strong>{eventLabel(event.event_type)}</strong><small>{typeof event.metadata.status === 'string' ? `Status: ${event.metadata.status.replace('_', ' ')}` : typeof event.metadata.outcome === 'string' ? `Result: ${event.metadata.outcome}` : 'Workspace activity'}</small></span><time>{new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(event.created_at))}</time></div>)}</div>}</section>}
  </div>
}
