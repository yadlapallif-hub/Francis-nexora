import { useState, type FormEvent } from 'react'
import { Activity, ArrowRight, CheckCircle2, CircleHelp, ExternalLink, KeyRound, LockKeyhole, LogOut, RefreshCw, ShieldCheck, UserRound } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { providerLabel } from '../components/Layout'
import { supabase } from '../lib/supabase'
import { containsLikelySecret } from '../lib/privacy'
import type { Page } from '../lib/types'
import { AccessPrompt, Notice, PageTitle, Spinner } from '../components/UI'

export function ModelSettings({ navigate }: { navigate: (page: Page) => void }) {
  const { session, openAuth } = useAuth()
  const { provider, refreshProvider, testProvider } = useData()
  const canTest = Boolean(session && (provider.state === 'configured' || provider.state === 'connected' || (provider.state === 'error' && provider.model)))
  return <div className="page-content"><PageTitle eyebrow="YOUR INTELLIGENCE, YOUR WAY" title="AI Model Settings." description="A transparent look at the model behind your workspace." />
    <div className="settings-grid"><section className="panel settings-main"><div className="panel-header"><div><span className="section-kicker">MODEL CONNECTION</span><h2>Ollama Cloud</h2></div><span className={`state-pill state-${provider.state}`}><span className={`status-dot status-${provider.state}`} />{providerLabel(provider)}</span></div><p className="settings-description">Your requests are sent through a secure Supabase Edge Function. The provider key stays on the server, never in your browser.</p>
      <div className="settings-facts"><div><span>PROVIDER</span><strong>Ollama Cloud</strong><small>Server-side connection</small></div><div><span>CONFIGURED MODEL</span><strong>{session ? provider.model || 'Not configured' : 'Sign in to check'}</strong><small>Set in Supabase secrets</small></div><div><span>CONNECTION</span><strong>{provider.state === 'connected' ? 'Verified' : provider.state === 'not-configured' ? 'Not configured' : 'Not verified'}</strong><small>{provider.state === 'connected' ? 'Last test or chat succeeded' : 'Run a real test to verify'}</small></div></div>
      {provider.error && <Notice tone="error">{provider.error}</Notice>}{provider.state === 'connected' && <Notice tone="success">A real request to Ollama Cloud succeeded during this session.</Notice>}
      <div className="settings-buttons"><button className="button button-primary" disabled={!canTest} onClick={() => void testProvider()}>{provider.state === 'testing' ? <Spinner /> : <RefreshCw size={16} />} {provider.state === 'testing' ? 'Testing connection…' : 'Test connection'}</button><button className="button button-secondary" onClick={() => session ? void refreshProvider() : openAuth()}>{session ? 'Refresh status' : 'Sign in'} <ArrowRight size={15} /></button></div>
      <p className="settings-help">{!session ? 'Sign in to check the actual configuration and run a test.' : provider.state === 'not-configured' ? 'A server-side API key and model are required before a test can run.' : 'Configuration alone does not mean the provider is connected. A test sends a real, short model request.'}</p>
    </section><aside className="panel settings-side"><span className="settings-side-icon"><KeyRound size={20} /></span><span className="section-kicker">SECURE BY DESIGN</span><h2>Set up your AI</h2><p>Configure these values in the Supabase Edge Function secret store. Never put a private key in the browser, a message, or Git.</p><div className="config-list"><div><code>OLLAMA_API_KEY</code><small>Private provider key</small></div><div><code>OLLAMA_MODEL</code><small>A model available to your account</small></div><div><code>NEXORA_APP_ORIGIN</code><small>Exact allowed frontend origins</small></div></div><button className="text-link" onClick={() => navigate('security')}>See security details <ArrowRight size={14} /></button></aside></div>
    <div className="info-banner"><span className="info-banner-icon"><CircleHelp size={18} /></span><div><strong>What happens when I test?</strong><p>NEXORA sends a short authenticated request to your configured model. You may incur provider usage; no connection is claimed until it succeeds.</p></div></div>
  </div>
}
export function Account() {
  const { session } = useAuth()
  const { profile, refresh } = useData()
  const [name, setName] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)
  async function save(event: FormEvent) {
    event.preventDefault(); if (!supabase || !session) return
    if (containsLikelySecret(name ?? profile?.display_name ?? '')) { setError('Please remove private keys or tokens from your display name.'); return }
    setBusy(true); setError(''); setSaved(false)
    const { error: updateError } = await supabase.from('nexora_profiles').update({ display_name: (name ?? profile?.display_name ?? '').trim() }).eq('id', session.user.id)
    setBusy(false)
    if (updateError) setError('Could not save your account settings.')
    else { setSaved(true); await refresh() }
  }
  async function signOut() {
    if (!supabase) return
    const { error: signoutError } = await supabase.auth.signOut()
    if (signoutError) setError('Could not sign out. Please try again.')
  }
  return <div className="page-content"><PageTitle eyebrow="MADE PERSONAL" title="Account Settings." description="Make this space feel a little more like yours." />
    {!session ? <section className="panel large-empty"><AccessPrompt title="Your account, your space" description="Sign in to manage your account settings." /></section> : <div className="settings-grid"><section className="panel settings-main"><div className="panel-header"><div><span className="section-kicker">YOUR PROFILE</span><h2>Account details</h2></div><span className="settings-side-icon"><UserRound size={19} /></span></div><p className="settings-description">Your display name is only used in your NEXORA workspace.</p>{error && <Notice tone="error">{error}</Notice>}{saved && <Notice tone="success">Your profile has been saved.</Notice>}<form className="form-stack account-form" onSubmit={save}><label>Display name<input maxLength={80} placeholder="What should we call you?" value={name ?? profile?.display_name ?? ''} onChange={(e) => { setName(e.target.value); setSaved(false) }} /></label><label>Email address<input value={session.user.email || ''} disabled /></label><button className="button button-primary" disabled={busy}>{busy ? <Spinner /> : 'Save changes'}</button></form></section><aside className="panel settings-side"><span className="settings-side-icon"><LockKeyhole size={20} /></span><span className="section-kicker">YOUR SESSION</span><h2>Signed in securely</h2><p>Your account is managed with Supabase Auth. Signing out removes the session from this browser.</p><button className="button button-secondary" onClick={() => void signOut()}><LogOut size={16} /> Sign out</button></aside></div>}
  </div>
}
export function Security({ navigate }: { navigate: (page: Page) => void }) {
  return <div className="page-content"><PageTitle eyebrow="PEACE OF MIND, BUILT IN" title="Security & Permissions." description="A thoughtful space should always leave you in control." />
    <div className="security-grid"><article className="panel security-card"><span className="security-icon"><ShieldCheck size={21} /></span><span className="section-kicker">YOUR DATA</span><h2>Private to your account</h2><p>Workspace records use Supabase row-level security. Conversations and tasks are scoped to the signed-in user.</p></article><article className="panel security-card"><span className="security-icon"><KeyRound size={21} /></span><span className="section-kicker">YOUR AI PROVIDER</span><h2>Keys stay server-side</h2><p>Ollama credentials belong in Supabase Edge Function secrets—not in your browser, messages, or source control.</p></article><article className="panel security-card"><span className="security-icon"><CheckCircle2 size={21} /></span><span className="section-kicker">YOUR CONTROL</span><h2>No hidden actions</h2><p>This build generates text and tracks manual tasks. It cannot send messages, access local files, or execute commands.</p></article></div>
    <section className="panel security-bottom"><div><span className="section-kicker">WHAT’S NEXT</span><h2>Approvals are not available yet</h2><p>High-impact actions will stay unavailable until exact-action approval and server-side enforcement are implemented and tested.</p></div><button className="button button-secondary" onClick={() => navigate('approvals')}>View Approval Center <ArrowRight size={15} /></button></section>
    <div className="documentation-note"><Activity size={15} /> Activity is recorded without message contents or private keys. <a href="https://supabase.com/docs/guides/auth/row-level-security" target="_blank" rel="noreferrer">About row-level security <ExternalLink size={13} /></a></div>
  </div>
}
