import { useEffect, useId, useRef, type ReactNode } from 'react'
import { AlertCircle, ArrowRight, LoaderCircle, LockKeyhole, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export function Brand({ compact = false }: { compact?: boolean }) {
  return <div className={`brand ${compact ? 'brand-compact' : ''}`}>
    <img src="/nexora-mark.svg" alt="" className="brand-mark" />
    {!compact && <span className="brand-type"><strong>NEXORA</strong><small>AGENT</small></span>}
  </div>
}
export function Spinner({ size = 16 }: { size?: number }) { return <LoaderCircle className="spin" size={size} aria-hidden="true" /> }
export function Notice({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'error' | 'success' }) {
  return <div className={`notice notice-${tone}`} role={tone === 'error' ? 'alert' : 'status'}><AlertCircle size={16} aria-hidden="true" /><span>{children}</span></div>
}
export function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const titleId = useId()
  const dialog = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const timer = window.setTimeout(() => (dialog.current?.querySelector<HTMLElement>('input:not([disabled]), textarea:not([disabled]), select:not([disabled])') || dialog.current?.querySelector<HTMLElement>('button:not([disabled])'))?.focus(), 0)
    function keydown(event: KeyboardEvent) {
      if (event.key === 'Escape') closeRef.current()
      if (event.key !== 'Tab' || !dialog.current) return
      const items = [...dialog.current.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href]')]
      if (!items.length) return
      const first = items[0]; const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', keydown)
    return () => { window.clearTimeout(timer); document.removeEventListener('keydown', keydown); previous?.focus() }
  }, [])
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby={titleId} ref={dialog}>
      <div className="modal-header"><h2 id={titleId}>{title}</h2><button className="icon-button" onClick={onClose} aria-label="Close dialog"><X size={19} /></button></div>
      {children}
    </div>
  </div>
}
export function AccessPrompt({ title = 'Your workspace, all in one place', description = 'Sign in to save your work and keep it private to your account.' }: { title?: string; description?: string }) {
  const { openAuth } = useAuth()
  return <div className="access-prompt"><span className="empty-icon"><LockKeyhole size={21} /></span><h3>{title}</h3><p>{description}</p><button className="button button-primary button-small" onClick={openAuth}>Sign in to continue <ArrowRight size={15} /></button></div>
}
export function PageTitle({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className="page-title"><div><div className="eyebrow"><span className="eyebrow-line" />{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action && <div className="page-title-action">{action}</div>}</div>
}
