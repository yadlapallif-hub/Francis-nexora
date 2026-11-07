import { Activity, AppWindow, ArrowUpRight, Bell, Bot, Boxes, Brain, ChevronDown, CircleHelp, ClipboardList, Cpu, FileStack, LayoutDashboard, ListChecks, LogIn, Menu, ShieldCheck, Sparkles, UserRound, X, Zap, type LucideIcon } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import type { Page, ProviderState } from '../lib/types'
import { Brand } from './UI'

type NavItem = { id: Page; label: string; icon: LucideIcon }
const sections: { title: string; items: NavItem[] }[] = [
  { title: 'WORKSPACE', items: [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard }, { id: 'workspace', label: 'AI Workspace', icon: Sparkles },
    { id: 'tasks', label: 'Task Manager', icon: ClipboardList }, { id: 'automation', label: 'Automation', icon: Zap }, { id: 'approvals', label: 'Approval Center', icon: ListChecks },
  ] },
  { title: 'MANAGE', items: [
    { id: 'tools', label: 'Tools', icon: Boxes }, { id: 'files', label: 'Files & Projects', icon: FileStack }, { id: 'memory', label: 'Agent Memory', icon: Brain }, { id: 'activity', label: 'Activity Log', icon: Activity },
  ] },
  { title: 'SYSTEM', items: [
    { id: 'companion', label: 'Laptop Companion', icon: AppWindow }, { id: 'model', label: 'AI Model Settings', icon: Cpu }, { id: 'security', label: 'Security & Permissions', icon: ShieldCheck },
  ] },
]
export const pageNames: Record<Page, string> = { overview: 'Overview', workspace: 'AI Workspace', tasks: 'Task Manager', automation: 'Automation', approvals: 'Approval Center', tools: 'Tools', files: 'Files & Projects', memory: 'Agent Memory', activity: 'Activity Log', companion: 'Laptop Companion', model: 'AI Model Settings', security: 'Security & Permissions', account: 'Account Settings' }
export function providerLabel(provider: ProviderState): string {
  switch (provider.state) {
    case 'signed-out': return 'Sign in to check'
    case 'checking': return 'Checking model'
    case 'not-configured': return 'AI not configured'
    case 'configured': return 'AI configured · untested'
    case 'testing': return 'Testing model'
    case 'connected': return 'AI connected'
    case 'error': return 'AI unavailable'
  }
}
export function Sidebar({ page, navigate, open, setOpen }: { page: Page; navigate: (page: Page) => void; open: boolean; setOpen: (open: boolean) => void }) {
  const { session, openAuth } = useAuth()
  const { profile } = useData()
  const name = profile?.display_name || session?.user.email?.split('@')[0] || 'Your account'
  return <>
    {open && <button className="mobile-backdrop" aria-label="Close navigation" onClick={() => setOpen(false)} />}
    <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
      <div className="sidebar-top"><Brand /><button className="icon-button mobile-close" aria-label="Close navigation" onClick={() => setOpen(false)}><X size={20} /></button></div>
      <div className="workspace-label"><span className="workspace-icon"><Bot size={16} /></span><span><strong>Personal workspace</strong><small>Your intelligent space</small></span><ChevronDown size={14} className="muted-icon" /></div>
      <nav className="navigation" aria-label="Main navigation">{sections.map((section) => <div className="nav-section" key={section.title}><div className="nav-label">{section.title}</div>{section.items.map(({ id, label, icon: Icon }) => <button key={id} className={`nav-link ${page === id ? 'active' : ''}`} aria-current={page === id ? 'page' : undefined} onClick={() => { navigate(id); setOpen(false) }}><Icon size={17} strokeWidth={1.7} /><span>{label}</span>{page === id && <span className="active-indicator" />}</button>)}</div>)}</nav>
      <div className="sidebar-bottom">
        <button className="sidebar-help" onClick={() => { navigate('security'); setOpen(false) }}><CircleHelp size={15} /><span>How NEXORA works</span><ArrowUpRight size={14} /></button>
        <button className="account-chip" onClick={() => { if (session) navigate('account'); else openAuth(); setOpen(false) }}>
          <span className="avatar">{session ? name.charAt(0).toUpperCase() : <UserRound size={17} />}</span><span className="account-copy"><strong>{session ? name : 'Welcome to NEXORA'}</strong><small>{session ? 'Account settings' : 'Sign in to get started'}</small></span><ChevronDown size={14} />
        </button>
      </div>
    </aside>
  </>
}
export function Topbar({ page, navigate, onMenu }: { page: Page; navigate: (page: Page) => void; onMenu: () => void }) {
  const { session, openAuth } = useAuth()
  const { provider } = useData()
  return <header className="topbar"><div className="topbar-left"><button className="icon-button menu-button" onClick={onMenu} aria-label="Open navigation"><Menu size={21} /></button><span className="crumb-muted">Workspace</span><span className="crumb-divider">/</span><span className="crumb-current">{pageNames[page]}</span></div>
    <div className="topbar-right"><button className="model-status" onClick={() => navigate('model')} title="Open AI model settings"><span className={`status-dot status-${provider.state}`} />{providerLabel(provider)}<ChevronDown size={13} /></button><span className="topbar-separator" />
      <button className="top-icon" aria-label="Open activity log" title="Activity log" onClick={() => navigate('activity')}><Bell size={18} /></button>
      {session ? <button className="top-avatar" onClick={() => navigate('account')} aria-label="Open account settings">{(session.user.email?.charAt(0) || 'U').toUpperCase()}</button> : <button className="top-signin" onClick={openAuth}><LogIn size={15} /> Sign in</button>}
    </div></header>
}
export function TopFooter() { return <div className="app-footer"><span>© {new Date().getFullYear()} NEXORA AGENT</span><span>Created &amp; Developed by <strong>FRANCIS.</strong></span></div> }
