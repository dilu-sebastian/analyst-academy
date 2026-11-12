export type ActivityType = 'visit' | 'complete' | 'quiz' | 'note' | 'bookmark' | 'assignment' | 'sql'

export interface Activity {
  type: ActivityType
  lessonId?: string
  label: string
  at: string // ISO date-time
}

export interface QuizResult {
  score: number
  total: number
  bestScore: number
  attempts: number
  date: string
}

export interface Note {
  text: string
  updatedAt: string
}

export interface Submission {
  text: string
  submittedAt: string
}

export interface ProgressState {
  version: 1
  completed: Record<string, string>
  quizResults: Record<string, QuizResult>
  bookmarks: string[]
  notes: Record<string, Note>
  assignments: Record<string, Submission>
  activity: Activity[]
  /** SQL practice challenges solved: challenge id → ISO date. */
  sqlSolved: Record<string, string>
  lastVisited?: { lessonId: string; at: string }
}
