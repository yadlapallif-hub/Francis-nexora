import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mocks = vi.hoisted(() => {
  const insert = vi.fn(async () => ({ error: null }))
  const eq = vi.fn(async () => ({ error: null }))
  const update = vi.fn(() => ({ eq }))
  const remove = vi.fn(() => ({ eq }))
  const from = vi.fn(() => ({ insert, update, delete: remove }))
  return { insert, eq, update, remove, from, refresh: vi.fn(async () => {}), testProvider: vi.fn(async () => {}), openAuth: vi.fn() }
})
vi.mock('../src/lib/supabase', () => ({ supabase: { from: mocks.from }, supabaseUrl: 'https://project-ref.supabase.co' }))
vi.mock('../src/context/AuthContext', () => ({ useAuth: () => ({ session: { user: { id: 'user-1', email: 'person@example.test' }, access_token: 'token' }, openAuth: mocks.openAuth }) }))
vi.mock('../src/context/DataContext', () => ({ useData: () => ({
  tasks: [{ id: 'task-1', title: 'Review notes', description: 'Study', status: 'queued', updated_at: new Date().toISOString() }],
  memories: [], profile: { id: 'user-1', memory_enabled: false }, loading: false, error: null, refresh: mocks.refresh,
  provider: { state: 'configured', model: 'test-model' }, refreshProvider: vi.fn(), testProvider: mocks.testProvider,
}) }))
import { Tasks } from '../src/pages/Tasks'
import { Memory } from '../src/pages/Memory'
import { ModelSettings } from '../src/pages/Settings'

afterEach(() => { cleanup(); vi.clearAllMocks() })
describe('manual, user-scoped features', () => {
  it('creates a manual task and updates its status through Supabase', async () => {
    const user = userEvent.setup()
    render(<Tasks newIntent={0} consumeIntent={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: /create a task/i }))
    await user.type(screen.getByLabelText('Task title'), 'Finish the outline')
    await user.type(screen.getByLabelText(/description/i), 'One page')
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Create task' }))
    await waitFor(() => expect(mocks.insert).toHaveBeenCalledWith({ user_id: 'user-1', title: 'Finish the outline', description: 'One page', status: 'queued' }))
    await user.selectOptions(screen.getByLabelText('Status for Review notes'), 'completed')
    expect(mocks.update).toHaveBeenCalledWith({ status: 'completed' })
    expect(mocks.eq).toHaveBeenCalledWith('id', 'task-1')
  })
  it('refuses an obvious token in a memory before attempting a write', async () => {
    const user = userEvent.setup()
    render(<Memory />)
    await user.click(screen.getByRole('button', { name: /add a memory/i }))
    await user.type(screen.getByLabelText('Title'), 'Secret')
    await user.type(screen.getByLabelText('Memory'), `Bearer ${'x'.repeat(30)}`)
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Save memory' }))
    expect(screen.getByRole('alert')).toHaveTextContent('remove private keys or tokens')
    expect(mocks.insert).not.toHaveBeenCalled()
  })
  it('provides secure owner-only Ollama setup links without requesting a key in the app', () => {
    render(<ModelSettings navigate={vi.fn()} />)
    expect(screen.getByRole('link', { name: /get an ollama key/i })).toHaveAttribute('href', 'https://ollama.com/settings/keys')
    expect(screen.getByRole('link', { name: /open supabase secrets/i })).toHaveAttribute('href', 'https://supabase.com/dashboard/project/project-ref/functions/secrets')
    expect(screen.getByText(/never paste an api key into nexora, chat, or git/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/api key/i)).not.toBeInTheDocument()
  })
  it('does not label a configured model connected until a real test is requested', async () => {
    const user = userEvent.setup()
    render(<ModelSettings navigate={vi.fn()} />)
    expect(screen.getByText('AI configured · untested')).toBeInTheDocument()
    expect(screen.queryByText('Verified')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /test connection/i }))
    expect(mocks.testProvider).toHaveBeenCalledOnce()
  })
})
