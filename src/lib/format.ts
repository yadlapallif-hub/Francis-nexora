import type { TaskStatus } from './types'

export function relativeTime(value: string) {
  const seconds = Math.round((Date.now() - new Date(value).getTime()) / 1000)
  if (!Number.isFinite(seconds)) return ''
  if (seconds < 60) return 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(value))
}
export const taskStatusLabel: Record<TaskStatus, string> = { queued: 'Queued', in_progress: 'In progress', completed: 'Completed', failed: 'Failed', cancelled: 'Cancelled' }
export function eventLabel(type: string) {
  return ({ 'task.created': 'A manual task was created', 'task.deleted': 'A manual task was deleted', 'task.status_changed': 'A manual task status was updated', 'chat.succeeded': 'AI response received', 'chat.failed': 'AI request failed', 'model_test.succeeded': 'Model connection test succeeded', 'model_test.failed': 'Model connection test failed' } as Record<string, string>)[type] || 'Workspace event'
}
export function greeting() {
  const hour = new Date().getHours()
  return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
}
