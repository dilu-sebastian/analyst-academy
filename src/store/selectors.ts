import type { ProgressState } from '@/types/progress'
import type { LessonRef, PathId } from '@/types/content'
import { allLessons, lessonsInPath, paths } from '@/content/loader'
import { addDays, dayKeyOf, todayKey } from '@/utils/date'

export interface PathStats {
  total: number
  available: number
  completed: number
  percent: number // of all planned lessons
  availablePercent: number // of lessons that have content
}

export function pathStats(state: ProgressState, pathId?: PathId): PathStats {
  const list = pathId ? lessonsInPath(pathId) : allLessons
  const total = list.length
  const available = list.filter((l) => l.available).length
  const completed = list.filter((l) => state.completed[l.id]).length
  return {
    total,
    available,
    completed,
    percent: total ? Math.round((completed / total) * 100) : 0,
    availablePercent: available ? Math.round((completed / available) * 100) : 0,
  }
}

export function moduleStats(state: ProgressState, moduleId: string) {
  const list = allLessons.filter((l) => l.moduleId === moduleId)
  const completed = list.filter((l) => state.completed[l.id]).length
  return {
    total: list.length,
    available: list.filter((l) => l.available).length,
    completed,
    percent: list.length ? Math.round((completed / list.length) * 100) : 0,
  }
}

/** Days with any activity, as a Set of YYYY-MM-DD keys. */
export function activeDays(state: ProgressState) {
  return new Set(state.activity.map((a) => dayKeyOf(a.at)))
}

/** Consecutive days with activity, ending today (or yesterday, so a streak isn't lost before you study today). */
export function currentStreak(state: ProgressState) {
  const days = activeDays(state)
  let cursor = new Date()
  if (!days.has(todayKey(cursor))) cursor = addDays(cursor, -1)
  let streak = 0
  while (days.has(todayKey(cursor))) {
    streak++
    cursor = addDays(cursor, -1)
  }
  return streak
}

export function longestStreak(state: ProgressState) {
  const keys = [...activeDays(state)].sort()
  let best = 0
  let run = 0
  let prev: string | null = null
  for (const k of keys) {
    run = prev && todayKey(addDays(new Date(prev + 'T12:00:00'), 1)) === k ? run + 1 : 1
    best = Math.max(best, run)
    prev = k
  }
  return best
}

/** Counts of activity per day for the last `n` days (oldest first). */
export function dailyActivity(state: ProgressState, n = 14) {
  const counts = new Map<string, number>()
  for (const a of state.activity) {
    if (a.type === 'visit') continue
    const k = dayKeyOf(a.at)
    counts.set(k, (counts.get(k) ?? 0) + 1)
  }
  return Array.from({ length: n }, (_, i) => {
    const d = addDays(new Date(), i - (n - 1))
    const key = todayKey(d)
    return { key, label: d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }), count: counts.get(key) ?? 0 }
  })
}

/** Skill score 0-100: 70% lesson completion + 30% average best quiz score (quiz part only counts where taken). */
export function skillScores(state: ProgressState, pathId: PathId) {
  const path = paths.find((p) => p.id === pathId)!
  const bySkill = new Map<string, LessonRef[]>()
  for (const l of lessonsInPath(pathId)) bySkill.set(l.skill, [...(bySkill.get(l.skill) ?? []), l])
  const order = [...new Set(path.modules.map((m) => m.skill))]
  return order.map((skill) => {
    const lessons = bySkill.get(skill) ?? []
    const done = lessons.filter((l) => state.completed[l.id]).length
    const quizzes = lessons.map((l) => state.quizResults[l.id]?.bestScore).filter((x): x is number => x != null)
    const completion = lessons.length ? done / lessons.length : 0
    const quiz = quizzes.length ? quizzes.reduce((a, b) => a + b, 0) / quizzes.length / 100 : completion
    return { skill, score: Math.round((completion * 0.7 + quiz * 0.3) * 100) }
  })
}

/** The lesson to resume: last visited if not complete, else the next available incomplete lesson in that path. */
export function continueLesson(state: ProgressState, pathId?: PathId): LessonRef | undefined {
  const last = state.lastVisited ? allLessons.find((l) => l.id === state.lastVisited!.lessonId) : undefined
  if (!pathId && last && !state.completed[last.id]) return last
  const pid = pathId ?? last?.pathId ?? 'data-analyst'
  if (pathId && last?.pathId === pathId && !state.completed[last.id]) return last
  return lessonsInPath(pid).find((l) => l.available && !state.completed[l.id])
}

export function averageQuiz(state: ProgressState) {
  const r = Object.values(state.quizResults)
  return r.length ? Math.round(r.reduce((a, b) => a + b.bestScore, 0) / r.length) : null
}
