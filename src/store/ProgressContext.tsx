import { createContext, useContext, useEffect, useReducer, type ReactNode } from 'react'
import type { Activity, ProgressState } from '@/types/progress'
import { emptyState, loadState, saveState } from '@/services/storage'
import { getLessonRef } from '@/content/loader'

type Action =
  | { type: 'visit'; lessonId: string }
  | { type: 'complete'; lessonId: string }
  | { type: 'uncomplete'; lessonId: string }
  | { type: 'recordQuiz'; lessonId: string; score: number; total: number }
  | { type: 'toggleBookmark'; lessonId: string }
  | { type: 'saveNote'; lessonId: string; text: string }
  | { type: 'submitAssignment'; assignmentId: string; lessonId?: string; label: string; text: string }
  | { type: 'solveSql'; challengeId: string; label: string }
  | { type: 'import'; state: ProgressState }
  | { type: 'reset' }

const MAX_ACTIVITY = 200
const title = (id?: string) => (id ? getLessonRef(id)?.title ?? id : '')

function log(state: ProgressState, a: Omit<Activity, 'at'>): Activity[] {
  const now = new Date().toISOString()
  const prev = state.activity[0]
  // collapse repeated visits / note saves on the same lesson within 30 minutes
  if (
    prev &&
    prev.type === a.type &&
    prev.lessonId === a.lessonId &&
    (a.type === 'visit' || a.type === 'note') &&
    Date.now() - new Date(prev.at).getTime() < 30 * 60 * 1000
  ) {
    return [{ ...prev, at: now }, ...state.activity.slice(1)]
  }
  return [{ ...a, at: now }, ...state.activity].slice(0, MAX_ACTIVITY)
}

function reducer(state: ProgressState, action: Action): ProgressState {
  const now = new Date().toISOString()
  switch (action.type) {
    case 'visit':
      return {
        ...state,
        lastVisited: { lessonId: action.lessonId, at: now },
        activity: log(state, { type: 'visit', lessonId: action.lessonId, label: `Opened “${title(action.lessonId)}”` }),
      }
    case 'complete':
      if (state.completed[action.lessonId]) return state
      return {
        ...state,
        completed: { ...state.completed, [action.lessonId]: now },
        activity: log(state, { type: 'complete', lessonId: action.lessonId, label: `Completed “${title(action.lessonId)}”` }),
      }
    case 'uncomplete': {
      const completed = { ...state.completed }
      delete completed[action.lessonId]
      return { ...state, completed }
    }
    case 'recordQuiz': {
      const prev = state.quizResults[action.lessonId]
      const pct = Math.round((action.score / action.total) * 100)
      return {
        ...state,
        quizResults: {
          ...state.quizResults,
          [action.lessonId]: {
            score: action.score,
            total: action.total,
            bestScore: Math.max(prev?.bestScore ?? 0, pct),
            attempts: (prev?.attempts ?? 0) + 1,
            date: now,
          },
        },
        activity: log(state, {
          type: 'quiz',
          lessonId: action.lessonId,
          label: `Scored ${action.score}/${action.total} on “${title(action.lessonId)}” quiz`,
        }),
      }
    }
    case 'toggleBookmark': {
      const has = state.bookmarks.includes(action.lessonId)
      return {
        ...state,
        bookmarks: has ? state.bookmarks.filter((b) => b !== action.lessonId) : [action.lessonId, ...state.bookmarks],
        activity: has
          ? state.activity
          : log(state, { type: 'bookmark', lessonId: action.lessonId, label: `Bookmarked “${title(action.lessonId)}”` }),
      }
    }
    case 'saveNote': {
      const notes = { ...state.notes }
      if (action.text.trim()) notes[action.lessonId] = { text: action.text, updatedAt: now }
      else delete notes[action.lessonId]
      return {
        ...state,
        notes,
        activity: action.text.trim()
          ? log(state, { type: 'note', lessonId: action.lessonId, label: `Wrote notes on “${title(action.lessonId)}”` })
          : state.activity,
      }
    }
    case 'submitAssignment':
      return {
        ...state,
        assignments: { ...state.assignments, [action.assignmentId]: { text: action.text, submittedAt: now } },
        activity: log(state, { type: 'assignment', lessonId: action.lessonId, label: `Submitted assignment “${action.label}”` }),
      }
    case 'solveSql':
      if (state.sqlSolved[action.challengeId]) return state
      return {
        ...state,
        sqlSolved: { ...state.sqlSolved, [action.challengeId]: now },
        activity: log(state, { type: 'sql', label: `Solved SQL challenge “${action.label}”` }),
      }
    case 'import':
      return action.state
    case 'reset':
      return emptyState()
  }
}

interface Ctx {
  state: ProgressState
  dispatch: React.Dispatch<Action>
}

const ProgressContext = createContext<Ctx | null>(null)

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState)
  useEffect(() => saveState(state), [state])
  return <ProgressContext.Provider value={{ state, dispatch }}>{children}</ProgressContext.Provider>
}

export function useProgress() {
  const ctx = useContext(ProgressContext)
  if (!ctx) throw new Error('useProgress must be used inside ProgressProvider')
  return ctx
}
