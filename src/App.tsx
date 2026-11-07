import { lazy, Suspense, useCallback, useState } from 'react'
import { AuthProvider } from './context/AuthContext'
import { DataProvider } from './context/DataContext'
import { AuthModal } from './components/AuthModal'
import { Sidebar, Topbar, TopFooter } from './components/Layout'
import { Overview } from './pages/Overview'
import { Tasks } from './pages/Tasks'
import { Memory } from './pages/Memory'
import { Activity } from './pages/Activity'
import { Account, ModelSettings, Security } from './pages/Settings'
import { Upcoming } from './pages/Upcoming'
import type { Page } from './lib/types'

const Workspace = lazy(() => import('./pages/Workspace').then((module) => ({ default: module.Workspace })))

function Shell() {
  const [page, setPage] = useState<Page>('overview')
  const [menuOpen, setMenuOpen] = useState(false)
  const [taskIntent, setTaskIntent] = useState(0)
  const [chatIntent, setChatIntent] = useState<{ id: number; conversationId?: string; draft?: string }>({ id: 0 })
  const navigate = useCallback((next: Page) => { setPage(next); window.scrollTo({ top: 0, behavior: 'smooth' }) }, [])
  const startChat = useCallback((draft?: string) => { setChatIntent((old) => ({ id: old.id + 1, draft })); navigate('workspace') }, [navigate])
  const openConversation = useCallback((conversationId: string) => { setChatIntent((old) => ({ id: old.id + 1, conversationId })); navigate('workspace') }, [navigate])
  const newTask = useCallback(() => { setTaskIntent((old) => old + 1); navigate('tasks') }, [navigate])
  const consumeTaskIntent = useCallback(() => setTaskIntent(0), [])
  let content
  switch (page) {
    case 'overview': content = <Overview navigate={navigate} startChat={startChat} openConversation={openConversation} newTask={newTask} />; break
    case 'workspace': content = <Suspense fallback={<div className="page-content empty-inline">Loading workspace…</div>}><Workspace navigate={navigate} intent={chatIntent} /></Suspense>; break
    case 'tasks': content = <Tasks newIntent={taskIntent} consumeIntent={consumeTaskIntent} />; break
    case 'memory': content = <Memory />; break
    case 'activity': content = <Activity />; break
    case 'model': content = <ModelSettings navigate={navigate} />; break
    case 'account': content = <Account />; break
    case 'security': content = <Security navigate={navigate} />; break
    default: content = <Upcoming page={page} navigate={navigate} />
  }
  return <div className="app-shell"><a href="#main-content" className="skip-link">Skip to content</a><Sidebar page={page} navigate={navigate} open={menuOpen} setOpen={setMenuOpen} /><div className="main-area"><Topbar page={page} navigate={navigate} onMenu={() => setMenuOpen(true)} /><main id="main-content">{content}</main><TopFooter /></div><AuthModal /></div>
}
export default function App() { return <AuthProvider><DataProvider><Shell /></DataProvider></AuthProvider> }
