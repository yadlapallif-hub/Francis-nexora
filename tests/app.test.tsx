import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const auth = vi.hoisted(() => ({
  getSession: vi.fn(async () => ({ data: { session: null } })),
  onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
  signUp: vi.fn(async () => ({ data: { session: null }, error: null })),
  signInWithPassword: vi.fn(async () => ({ data: { session: null }, error: new Error('Invalid login credentials') })),
}))
vi.mock('../src/lib/supabase', () => ({ supabase: { auth }, supabaseUrl: 'https://example.test', supabaseAnonKey: 'public' }))
import App from '../src/App'

afterEach(() => { cleanup(); vi.clearAllMocks() })
window.scrollTo = vi.fn()
HTMLElement.prototype.scrollIntoView = vi.fn()

describe('application shell', () => {
  it('shows honest signed-out metrics and navigates to gated features', async () => {
    const user = userEvent.setup()
    render(<App />)
    expect(await screen.findByText(/your personal command center/i)).toBeInTheDocument()
    expect(screen.getByText('Sign in to see your data')).toBeInTheDocument()
    expect(screen.queryByText('AI connected')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'AI Workspace' }))
    expect(await screen.findByRole('heading', { name: /AI Workspace/i })).toBeInTheDocument()
    expect(screen.getByText(/sign in to start a conversation/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Approval Center' }))
    expect(screen.getByText(/Approvals are not available yet/i)).toBeInTheDocument()
  })
  it('submits a real signup request through Supabase Auth and shows email confirmation instructions', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /^sign in$/i }))
    await user.click(screen.getByRole('button', { name: 'Create account' }))
    await user.type(screen.getByLabelText('Email address'), 'person@example.test')
    await user.type(screen.getByLabelText('Password'), 'a-strong-password')
    const dialog = screen.getByRole('dialog')
    await user.click(dialog.querySelector('form button[type="submit"]') || dialog.querySelector('form button')!)
    await waitFor(() => expect(auth.signUp).toHaveBeenCalledWith(expect.objectContaining({ email: 'person@example.test', password: 'a-strong-password', options: { emailRedirectTo: `${window.location.origin}/` } })))
    expect(await screen.findByText(/check your email for a confirmation link/i)).toBeInTheDocument()
  })
  it('shows a sign-in failure instead of pretending the user is authenticated', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /^sign in$/i }))
    await user.type(screen.getByLabelText('Email address'), 'person@example.test')
    await user.type(screen.getByLabelText('Password'), 'wrong-password')
    await user.click(screen.getByRole('dialog').querySelector('form button')!)
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid login credentials')
    expect(screen.queryByText('AI connected')).not.toBeInTheDocument()
  })
})
