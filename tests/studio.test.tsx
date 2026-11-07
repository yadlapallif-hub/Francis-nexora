import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mocks = vi.hoisted(() => {
  type Doc = { id: string; user_id: string; kind: string; title: string; data: unknown; updated_at: string }
  const state: { userId: string | null; docs: Doc[]; writes: unknown[]; openAuth: ReturnType<typeof vi.fn>; waitBeforeWrite: Promise<void> | null } = { userId: 'user-1', docs: [], writes: [], openAuth: vi.fn(), waitBeforeWrite: null }
  function from(table: string) {
    if (table !== 'nexora_studio_documents') throw new Error('Unexpected table')
    let mode = 'list'; let payload: any; const filters: Record<string, unknown> = {}
    const query: any = {
      select: () => query,
      eq: (key: string, value: unknown) => { filters[key] = value; return query },
      order: () => query,
      limit: async () => ({ data: state.docs.filter((doc) => Object.entries(filters).every(([key, value]) => (doc as any)[key] === value)), error: null }),
      insert: (value: unknown) => { mode = 'insert'; payload = value; state.writes.push(value); return query },
      update: (value: unknown) => { mode = 'update'; payload = value; state.writes.push(value); return query },
      delete: () => { mode = 'delete'; return query },
      single: async () => {
        if (state.waitBeforeWrite) await state.waitBeforeWrite
        if (mode === 'insert') { const doc = { ...payload, id: `doc-${state.docs.length + 1}`, updated_at: new Date().toISOString() }; state.docs.push(doc); return { data: { id: doc.id }, error: null } }
        const doc = state.docs.find((item) => Object.entries(filters).every(([key, value]) => (item as any)[key] === value))
        if (!doc) return { data: null, error: { message: 'Not found' } }
        Object.assign(doc, payload); return { data: { id: doc.id }, error: null }
      },
      then: (resolve: (value: unknown) => void) => {
        if (mode === 'delete') state.docs = state.docs.filter((doc) => !Object.entries(filters).every(([key, value]) => (doc as any)[key] === value))
        return Promise.resolve({ error: null }).then(resolve)
      },
    }
    return query
  }
  return { state, from: vi.fn(from) }
})
vi.mock('../src/lib/supabase', () => ({ supabase: { from: mocks.from } }))
vi.mock('../src/context/AuthContext', () => ({ useAuth: () => ({ session: mocks.state.userId ? { user: { id: mocks.state.userId } } : null, openAuth: mocks.state.openAuth }) }))

import { ResumeBuilder } from '../src/pages/ResumeBuilder'
import { CertificateBuilder } from '../src/pages/CertificateBuilder'
import { certificateSchema, createCertificatePng, emptyCertificate, emptyResume, printDocument, resumeSchema } from '../src/lib/studio'
import { MAX_CLIP_SECONDS, validateTrim } from '../src/lib/video'

beforeEach(() => { mocks.state.userId = 'user-1'; mocks.state.docs = []; mocks.state.writes = []; mocks.state.waitBeforeWrite = null; mocks.state.openAuth.mockClear(); mocks.from.mockClear() })
afterEach(() => { cleanup(); vi.restoreAllMocks() })

describe('Creative Studio editors', () => {
  it('saves and reopens an owner-scoped resume, then clears it on account switch', async () => {
    const user = userEvent.setup(); const view = render(<ResumeBuilder />)
    await user.type(screen.getByLabelText('Full name'), 'Priya Rao')
    await user.type(screen.getByLabelText('Professional summary'), 'Thoughtful designer')
    await user.click(screen.getByRole('button', { name: 'Save draft' }))
    await screen.findByText('Draft saved to your account.')
    expect(mocks.state.docs[0]).toMatchObject({ user_id: 'user-1', kind: 'resume', data: { name: 'Priya Rao', summary: 'Thoughtful designer' } })
    await user.type(screen.getByLabelText('Professional summary'), '!')
    expect(screen.queryByText('Draft saved to your account.')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Save draft' }))
    await screen.findByText('Draft saved to your account.')
    expect(mocks.state.docs[0]).toMatchObject({ data: { summary: 'Thoughtful designer!' } })
    await user.click(screen.getByRole('button', { name: 'New' }))
    expect(screen.getByLabelText('Full name')).toHaveValue('')
    await user.click(await screen.findByRole('button', { name: 'Open Priya Rao — Resume' }))
    expect(screen.getByLabelText('Full name')).toHaveValue('Priya Rao')
    mocks.state.userId = 'user-2'; view.rerender(<ResumeBuilder />)
    await waitFor(() => expect(screen.getByLabelText('Full name')).toHaveValue(''))
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Open Priya Rao — Resume' })).not.toBeInTheDocument())
  })
  it('prevents edits and switching drafts while a cloud save is in flight', async () => {
    let finish!: () => void
    mocks.state.waitBeforeWrite = new Promise<void>((resolve) => { finish = resolve })
    const user = userEvent.setup(); render(<ResumeBuilder />)
    await user.type(screen.getByLabelText('Full name'), 'Saving draft')
    await user.click(screen.getByRole('button', { name: 'Save draft' }))
    expect(screen.getByLabelText('Full name')).toBeDisabled()
    expect(screen.getByRole('button', { name: 'New' })).toBeDisabled()
    finish()
    await screen.findByText('Draft saved to your account.')
    expect(screen.getByLabelText('Full name')).toBeEnabled()
  })
  it('rejects an invalid saved document instead of rendering it', async () => {
    mocks.state.docs.push({ id: 'bad', user_id: 'user-1', kind: 'resume', title: 'Invalid draft', updated_at: new Date().toISOString(), data: { ...emptyResume(), name: 'x'.repeat(101) } })
    const user = userEvent.setup(); render(<ResumeBuilder />)
    await user.click(await screen.findByRole('button', { name: 'Open Invalid draft' }))
    expect(screen.getByRole('alert')).toHaveTextContent('unsupported format')
    expect(screen.getByLabelText('Full name')).toHaveValue('')
  })
  it('blocks obvious credentials before writing a draft', async () => {
    const user = userEvent.setup(); render(<ResumeBuilder />)
    await user.type(screen.getByLabelText('Professional summary'), `Bearer ${'x'.repeat(30)}`)
    await user.click(screen.getByRole('button', { name: 'Save draft' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Remove private keys or tokens')
    expect(mocks.state.writes).toHaveLength(0)
  })
  it('warns that guest edits reset before opening sign-in', async () => {
    mocks.state.userId = null
    const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true)
    const user = userEvent.setup(); render(<CertificateBuilder />)
    await user.type(screen.getByLabelText('Recipient name'), 'Guest recipient')
    await user.click(screen.getByRole('button', { name: 'Save draft' }))
    expect(confirm).toHaveBeenCalled(); expect(mocks.state.openAuth).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Save draft' }))
    expect(mocks.state.openAuth).toHaveBeenCalledOnce()
  })
  it('saves and deletes a certificate draft', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const user = userEvent.setup(); render(<CertificateBuilder />)
    await user.type(screen.getByLabelText('Recipient name'), 'Asha')
    await user.type(screen.getByLabelText('Achievement or course'), 'Workshop completion')
    await user.click(screen.getByRole('button', { name: 'Save draft' }))
    await screen.findByText('Draft saved to your account.')
    expect(mocks.state.docs[0]).toMatchObject({ user_id: 'user-1', kind: 'certificate', data: { recipient: 'Asha', achievement: 'Workshop completion' } })
    await user.click(await screen.findByRole('button', { name: 'Delete Asha — Certificate' }))
    await screen.findByText('Saved draft deleted.')
    expect(mocks.state.docs).toHaveLength(0)
  })
})

describe('Studio validation and exports', () => {
  it('bounds input structures and clip ranges', () => {
    expect(resumeSchema.safeParse(emptyResume()).success).toBe(true)
    expect(resumeSchema.safeParse({ ...emptyResume(), experience: Array(9).fill({ id: 'a', role: '', company: '', dates: '', details: '' }) }).success).toBe(false)
    expect(certificateSchema.safeParse({ ...emptyCertificate(), design: 'fake' }).success).toBe(false)
    expect(validateTrim(1, 3, 5)).toBeNull()
    expect(validateTrim(3, 2, 5)).toMatch(/end after the start/i)
    expect(validateTrim(0, MAX_CLIP_SECONDS + 1, 200)).toMatch(/120 seconds/i)
    expect(validateTrim(0, 1, Infinity)).toMatch(/duration/i)
  })
  it('configures the requested print orientation and removes its temporary style after printing', () => {
    const print = vi.spyOn(window, 'print').mockImplementation(() => {})
    printDocument('landscape')
    expect(print).toHaveBeenCalledOnce()
    expect(Array.from(document.querySelectorAll('style')).some((style) => style.textContent?.includes('A4 landscape'))).toBe(true)
    window.dispatchEvent(new Event('afterprint'))
    expect(Array.from(document.querySelectorAll('style')).some((style) => style.textContent?.includes('A4 landscape'))).toBe(false)
  })
  it('fits long certificate text in PNG output without silently dropping words', async () => {
    const calls: Array<{ text: string; y: number }> = []
    const ctx: any = { font: '', measureText(text: string) { const px = Number(/(\d+)px/.exec(this.font)?.[1] || 30); return { width: text.length * px * .7 } }, fillText(text: string, _x: number, y: number) { calls.push({ text, y }) }, fillRect() {}, strokeRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {} }
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx)
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) => callback(new Blob(['png'], { type: 'image/png' })))
    const heading = `${'WIDE '.repeat(20)}THE END`
    const achievement = `${'recognition '.repeat(12)}FINISH`
    await createCertificatePng({ ...emptyCertificate(), heading, achievement })
    const renderedHeading = calls.filter((call) => call.y >= 315 && call.y < 490).map((call) => call.text).join(' ')
    const renderedAchievement = calls.filter((call) => call.y >= 830 && call.y < 1000).map((call) => call.text).join(' ')
    expect(renderedHeading).toBe(heading.trim())
    expect(renderedAchievement).toBe(achievement.trim())
  })
})
