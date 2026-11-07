import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

type AuthContextValue = { session: Session | null; loading: boolean; authOpen: boolean; openAuth: () => void; closeAuth: () => void }
const AuthContext = createContext<AuthContextValue | null>(null)
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(Boolean(supabase))
  const [authOpen, setAuthOpen] = useState(false)
  const openAuth = useCallback(() => setAuthOpen(true), [])
  const closeAuth = useCallback(() => setAuthOpen(false), [])
  useEffect(() => {
    if (!supabase) return
    let alive = true
    supabase.auth.getSession().then(({ data }) => { if (alive) { setSession(data.session); setLoading(false) } })
    const { data } = supabase.auth.onAuthStateChange((_event, next) => { setSession(next); setLoading(false); if (next) setAuthOpen(false) })
    return () => { alive = false; data.subscription.unsubscribe() }
  }, [])
  return <AuthContext.Provider value={{ session, loading, authOpen, openAuth, closeAuth }}>{children}</AuthContext.Provider>
}
export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used within AuthProvider')
  return value
}
