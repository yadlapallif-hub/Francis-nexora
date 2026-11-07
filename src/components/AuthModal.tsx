import { useCallback, useState, type FormEvent } from 'react'
import { ArrowRight, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { safeError } from '../lib/api'
import { supabase } from '../lib/supabase'
import { Brand, Modal, Notice, Spinner } from './UI'

export function AuthModal() {
  const { authOpen, closeAuth } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const close = useCallback(() => { closeAuth(); setPassword(''); setError(''); setSuccess('') }, [closeAuth])
  if (!authOpen) return null
  async function submit(event: FormEvent) {
    event.preventDefault(); setError(''); setSuccess('')
    if (!supabase) { setError('Supabase is not configured for this app.'); return }
    setBusy(true)
    try {
      if (mode === 'signin') {
        const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        if (authError) throw authError
        setPassword('')
      } else {
        const { data, error: authError } = await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: `${window.location.origin}/` } })
        if (authError) throw authError
        setPassword('')
        if (!data.session) setSuccess('Check your email for a confirmation link, then come back and sign in.')
      }
    } catch (cause) { setError(safeError(cause, 'Authentication failed.')) }
    finally { setBusy(false) }
  }
  return <Modal title={mode === 'signin' ? 'Welcome to NEXORA' : 'Create your account'} onClose={close}>
    <div className="auth-intro"><Brand /><p>{mode === 'signin' ? 'Your intelligent space is waiting for you.' : 'A little more clarity starts here.'}</p></div>
    <div className="segmented" role="group" aria-label="Authentication mode"><button className={mode === 'signin' ? 'selected' : ''} onClick={() => { setMode('signin'); setError(''); setSuccess('') }}>Sign in</button><button className={mode === 'signup' ? 'selected' : ''} onClick={() => { setMode('signup'); setError(''); setSuccess('') }}>Create account</button></div>
    {!supabase && <Notice tone="error">Supabase is not configured for this deployment. Add the public frontend environment values before signing in.</Notice>}
    {error && <Notice tone="error">{error}</Notice>}{success && <Notice tone="success">{success}</Notice>}
    <form onSubmit={submit} className="form-stack">
      <label>Email address<input autoComplete="email" type="email" required maxLength={254} placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
      <label>Password<input autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} type="password" required minLength={mode === 'signup' ? 8 : 1} placeholder={mode === 'signup' ? 'At least 8 characters' : 'Enter your password'} value={password} onChange={(e) => setPassword(e.target.value)} /></label>
      <button className="button button-primary button-full" disabled={busy || !supabase}>{busy ? <Spinner /> : <>{mode === 'signin' ? 'Sign in' : 'Create account'} <ArrowRight size={16} /></>}</button>
    </form>
    <div className="auth-footnote"><ShieldCheck size={15} /> Your account is secured with Supabase Auth.</div>
  </Modal>
}
