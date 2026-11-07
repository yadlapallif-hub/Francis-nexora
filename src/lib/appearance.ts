export const backgroundThemes = ['aurora', 'forest', 'dusk'] as const
export type BackgroundTheme = typeof backgroundThemes[number]

const storageKey = 'nexora-background-theme'

export function readBackgroundTheme(): BackgroundTheme {
  try {
    const stored = window.localStorage.getItem(storageKey)
    if (backgroundThemes.some((theme) => theme === stored)) return stored as BackgroundTheme
  } catch {
    // A private or restricted browser can deny storage; the theme still works for this session.
  }
  return 'aurora'
}

export function saveBackgroundTheme(theme: BackgroundTheme) {
  try { window.localStorage.setItem(storageKey, theme) } catch { /* Session-only preference. */ }
}
