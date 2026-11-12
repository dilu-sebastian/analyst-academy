import type { ProgressState } from '@/types/progress'

const KEY = 'analyst-academy:v1'

export const emptyState = (): ProgressState => ({
  version: 1,
  completed: {},
  quizResults: {},
  bookmarks: [],
  notes: {},
  assignments: {},
  activity: [],
  sqlSolved: {},
})

function isState(x: unknown): x is ProgressState {
  return !!x && typeof x === 'object' && (x as ProgressState).version === 1
}

export function loadState(): ProgressState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return emptyState()
    const parsed = JSON.parse(raw)
    return isState(parsed) ? { ...emptyState(), ...parsed } : emptyState()
  } catch {
    return emptyState()
  }
}

export function saveState(state: ProgressState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* storage full or blocked: progress stays in memory for this session */
  }
}

export const exportState = (state: ProgressState) => JSON.stringify(state, null, 2)

export function parseImport(text: string): ProgressState | null {
  try {
    const parsed = JSON.parse(text)
    return isState(parsed) ? { ...emptyState(), ...parsed } : null
  } catch {
    return null
  }
}
