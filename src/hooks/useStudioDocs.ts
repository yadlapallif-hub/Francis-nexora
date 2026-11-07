import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { containsLikelySecret } from '../lib/privacy'
import { supabase } from '../lib/supabase'
import type { StudioDocument, StudioKind } from '../lib/studio'

export function useStudioDocs(kind: StudioKind) {
  const { session, openAuth } = useAuth()
  const userId = session?.user.id
  const currentUser = useRef(userId)
  const loadVersion = useRef(0)
  currentUser.current = userId
  useEffect(() => { currentUser.current = userId; return () => { currentUser.current = undefined; loadVersion.current++ } }, [userId])
  const [documents, setDocuments] = useState<StudioDocument[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const refresh = useCallback(async () => {
    const version = ++loadVersion.current
    if (!supabase || !userId) { setDocuments([]); setLoading(false); return }
    setLoading(true)
    try {
      const { data, error: failure } = await supabase.from('nexora_studio_documents').select('id,title,data,updated_at').eq('user_id', userId).eq('kind', kind).order('updated_at', { ascending: false }).limit(100)
      if (currentUser.current !== userId || loadVersion.current !== version) return
      if (failure) setError('Could not load saved drafts. Please try again.')
      else setDocuments((data || []) as StudioDocument[])
    } catch {
      if (currentUser.current === userId && loadVersion.current === version) setError('Could not load saved drafts. Please try again.')
    } finally {
      if (currentUser.current === userId && loadVersion.current === version) setLoading(false)
    }
  }, [kind, userId])
  useEffect(() => { setSelectedId(null); setError(''); setMessage(''); void refresh(); return () => { loadVersion.current++ } }, [refresh])

  const save = async (value: unknown, title: string) => {
    setError(''); setMessage('')
    if (!supabase || !userId) { openAuth(); return false }
    const serialized = JSON.stringify(value)
    if (containsLikelySecret(`${title} ${serialized}`)) { setError('Remove private keys or tokens before saving this draft.'); return false }
    if (new TextEncoder().encode(serialized).length > 60000) { setError('This draft is too large to save.'); return false }
    setSaving(true)
    try {
      const query = selectedId
        ? supabase.from('nexora_studio_documents').update({ title, data: value }).eq('id', selectedId).eq('user_id', userId).select('id').single()
        : supabase.from('nexora_studio_documents').insert({ user_id: userId, kind, title, data: value }).select('id').single()
      const { data, error: failure } = await query
      if (currentUser.current !== userId) return false
      if (failure || !data) { setError('Could not save this draft. Please try again.'); return false }
      setSelectedId(data.id as string); setMessage('Draft saved to your account.'); await refresh(); return true
    } catch {
      if (currentUser.current === userId) setError('Could not save this draft. Please try again.')
      return false
    } finally { if (currentUser.current === userId) setSaving(false) }
  }
  const remove = async (id: string) => {
    if (!supabase || !userId || !window.confirm('Delete this saved draft? This cannot be undone.')) return
    setError(''); setMessage('')
    try {
      const { error: failure } = await supabase.from('nexora_studio_documents').delete().eq('id', id).eq('user_id', userId)
      if (currentUser.current !== userId) return
      if (failure) setError('Could not delete this draft. Please try again.')
      else { if (selectedId === id) setSelectedId(null); setMessage('Saved draft deleted.'); await refresh() }
    } catch { if (currentUser.current === userId) setError('Could not delete this draft. Please try again.') }
  }
  const clearFeedback = () => { setError(''); setMessage('') }
  const startNew = () => { setSelectedId(null); setError(''); setMessage('') }
  const select = (id: string) => { setSelectedId(id); setError(''); setMessage('') }
  return { session, documents, selectedId, loading, saving, error, message, setError, clearFeedback, refresh, save, remove, startNew, select }
}
