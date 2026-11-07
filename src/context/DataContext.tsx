import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { getProviderStatus, safeError, testProvider as runProviderTest } from '../lib/api'
import { supabase } from '../lib/supabase'
import type { AuditEvent, Conversation, Memory, Metrics, Profile, ProviderState, Task } from '../lib/types'
import { useAuth } from './AuthContext'

type DataContextValue = {
  conversations: Conversation[]; tasks: Task[]; memories: Memory[]; events: AuditEvent[]; profile: Profile | null; metrics: Metrics | null;
  loading: boolean; error: string | null; refresh: () => Promise<void>; provider: ProviderState; refreshProvider: () => Promise<void>; testProvider: () => Promise<void>; markConnected: (token: string) => void
}
const DataContext = createContext<DataContextValue | null>(null)
export function DataProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [memories, setMemories] = useState<Memory[]>([])
  const [events, setEvents] = useState<AuditEvent[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [dataOwner, setDataOwner] = useState<string | undefined>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [provider, setProvider] = useState<ProviderState>({ state: 'signed-out', model: null })
  const userId = session?.user.id
  const token = session?.access_token
  const currentUser = useRef(userId)
  const currentToken = useRef(token)
  const refreshVersion = useRef(0)
  const providerVersion = useRef(0)
  currentUser.current = userId
  currentToken.current = token
  const refresh = useCallback(async () => {
    if (currentUser.current !== userId) return
    const version = ++refreshVersion.current
    if (!supabase || !userId) {
      setConversations([]); setTasks([]); setMemories([]); setEvents([]); setProfile(null); setMetrics(null); setDataOwner(undefined); setError(null); setLoading(false)
      return
    }
    setLoading(true); setError(null)
    try {
      const client = supabase
      const [c, t, m, e, p, active, queued, completed, failed] = await Promise.all([
        client.from('nexora_conversations').select('*').eq('user_id', userId).order('updated_at', { ascending: false }).limit(100),
        client.from('nexora_tasks').select('*').eq('user_id', userId).order('updated_at', { ascending: false }).limit(100),
        client.from('nexora_memory').select('*').eq('user_id', userId).order('updated_at', { ascending: false }).limit(100),
        client.from('nexora_audit_events').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50),
        client.from('nexora_profiles').select('*').eq('id', userId).maybeSingle(),
        client.from('nexora_tasks').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'in_progress'),
        client.from('nexora_tasks').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'queued'),
        client.from('nexora_tasks').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'completed'),
        client.from('nexora_tasks').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'failed'),
      ])
      const failure = [c, t, m, e, p, active, queued, completed, failed].find((r) => r.error)?.error
      if (failure) throw failure
      let userProfile = p.data as Profile | null
      if (!userProfile) {
        const created = await client.from('nexora_profiles').insert({ id: userId, display_name: '', memory_enabled: false }).select().single()
        if (created.error && created.error.code !== '23505') throw created.error
        if (created.data) userProfile = created.data as Profile
        else {
          const existing = await client.from('nexora_profiles').select('*').eq('id', userId).single()
          if (existing.error) throw existing.error
          userProfile = existing.data as Profile
        }
      }
      if (currentUser.current !== userId || refreshVersion.current !== version) return
      setConversations((c.data || []) as Conversation[]); setTasks((t.data || []) as Task[]); setMemories((m.data || []) as Memory[]); setEvents((e.data || []) as AuditEvent[]); setProfile(userProfile)
      setMetrics({ active: active.count ?? 0, queued: queued.count ?? 0, completed: completed.count ?? 0, failed: failed.count ?? 0 }); setDataOwner(userId)
    } catch (cause) { if (currentUser.current === userId && refreshVersion.current === version) setError(safeError(cause, 'Could not load your workspace.')) }
    finally { if (currentUser.current === userId && refreshVersion.current === version) setLoading(false) }
  }, [userId])
  const refreshProvider = useCallback(async () => {
    const version = ++providerVersion.current
    if (!token) { setProvider({ state: 'signed-out', model: null }); return }
    setProvider((old) => ({ state: 'checking', model: old.model }))
    try {
      const status = await getProviderStatus(token)
      if (currentToken.current === token && providerVersion.current === version) setProvider({ state: status.configured ? 'configured' : 'not-configured', model: status.model })
    } catch (cause) { if (currentToken.current === token && providerVersion.current === version) setProvider({ state: 'error', model: null, error: safeError(cause) }) }
  }, [token])
  const testProvider = useCallback(async () => {
    if (!token) return
    const version = ++providerVersion.current
    setProvider((old) => ({ ...old, state: 'testing', error: undefined }))
    try { const result = await runProviderTest(token); if (currentToken.current === token && providerVersion.current === version) { setProvider({ state: 'connected', model: result.model }); await refresh() } }
    catch (cause) { if (currentToken.current === token && providerVersion.current === version) { setProvider((old) => ({ ...old, state: 'error', error: safeError(cause) })); await refresh() } }
  }, [token, refresh])
  const markConnected = useCallback((requestToken: string) => { if (currentToken.current === requestToken) setProvider((old) => ({ ...old, state: 'connected', error: undefined })) }, [])
  useEffect(() => { void refresh() }, [refresh])
  useEffect(() => { void refreshProvider() }, [refreshProvider])
  const ownsData = Boolean(userId && dataOwner === userId)
  return <DataContext.Provider value={{ conversations: ownsData ? conversations : [], tasks: ownsData ? tasks : [], memories: ownsData ? memories : [], events: ownsData ? events : [], profile: ownsData ? profile : null, metrics: ownsData ? metrics : null, loading, error, refresh, provider, refreshProvider, testProvider, markConnected }}>{children}</DataContext.Provider>
}
export function useData() {
  const value = useContext(DataContext)
  if (!value) throw new Error('useData must be used within DataProvider')
  return value
}
