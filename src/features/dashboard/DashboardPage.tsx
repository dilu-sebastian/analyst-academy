import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Card, CardHeader, EmptyState, Icon, LinkButton, ProgressBar, StatCard, cx } from '@/components/ui'
import type { IconName } from '@/components/ui/Icon'
import { ActivityBar, ProgressDoughnut, SkillsRadar } from '@/components/charts'
import { useProgress } from '@/store/ProgressContext'
import { averageQuiz, continueLesson, currentStreak, dailyActivity, longestStreak, pathStats, skillScores } from '@/store/selectors'
import { allLessons, getLesson, paths } from '@/content/loader'
import type { PathId } from '@/types/content'
import type { ActivityType } from '@/types/progress'
import { timeAgo } from '@/utils/date'

const activityIcon: Record<ActivityType, IconName> = {
  visit: 'book',
  complete: 'checkCircle',
  quiz: 'target',
  note: 'note',
  bookmark: 'bookmark',
  assignment: 'clipboard',
}

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

export function DashboardPage() {
  const { state } = useProgress()
  const [skillPath, setSkillPath] = useState<PathId>('data-analyst')

  const overall = pathStats(state)
  const streak = currentStreak(state)
  const best = longestStreak(state)
  const avgQuiz = averageQuiz(state)
  const resume = continueLesson(state)

  const upcoming = allLessons
    .filter((l) => l.available)
    .map((l) => ({ ref: l, a: getLesson(l.id)?.assignment }))
    .filter((x) => x.a && !state.assignments[x.a.id])
    .slice(0, 4)

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="card relative overflow-hidden p-6 sm:p-8">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-500/10 blur-2xl" aria-hidden />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-xl">
            <p className="text-sm font-medium text-brand-600 dark:text-brand-300">{greeting()}</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">Your analyst journey</h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              Two career paths, {overall.total} lessons, built to take you from absolute beginner to job-ready. Small steps every day beat long sessions once a week.
            </p>
          </div>
          {resume ? (
            <div className="w-full rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/60 sm:w-80">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Continue learning</p>
              <p className="mt-1 font-semibold text-slate-900 dark:text-white">{resume.title}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {resume.moduleTitle} · {resume.minutes} min
              </p>
              <LinkButton to={`/lesson/${resume.id}`} icon="arrowRight" className="mt-3 w-full">
                {state.lastVisited?.lessonId === resume.id ? 'Resume lesson' : 'Start lesson'}
              </LinkButton>
            </div>
          ) : (
            <div className="w-full rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200 sm:w-80">
              You have finished every lesson that is available right now. New modules are on the way.
            </div>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon="chart" label="Overall progress" value={`${overall.percent}%`} hint={`of ${overall.total} planned lessons`} />
        <StatCard icon="checkCircle" tone="green" label="Completed lessons" value={overall.completed} hint={avgQuiz != null ? `Average best quiz score ${avgQuiz}%` : 'No quizzes taken yet'} />
        <StatCard icon="clock" tone="amber" label="Pending lessons" value={overall.total - overall.completed} hint={`${overall.available - overall.completed} ready to study now`} />
        <StatCard icon="flame" tone="rose" label="Current streak" value={`${streak} day${streak === 1 ? '' : 's'}`} hint={`Longest: ${best} day${best === 1 ? '' : 's'}`} />
      </div>

      {/* Paths + activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        {paths.map((p) => {
          const s = pathStats(state, p.id)
          const next = continueLesson(state, p.id)
          return (
            <Card key={p.id} className="flex flex-col">
              <CardHeader
                title={`${p.title} path`}
                subtitle={p.tagline}
                action={<Badge tone={p.id === 'data-analyst' ? 'brand' : 'green'}>{p.modules.length} modules</Badge>}
              />
              <ProgressDoughnut completed={s.completed} total={s.total} pathId={p.id} label={`${p.title} progress`} />
              <p className="mt-3 text-center text-xs text-slate-500 dark:text-slate-400">
                {s.available} of {s.total} lessons have content so far
              </p>
              <div className="mt-auto flex items-center justify-between gap-2 pt-4">
                <Link to={`/paths/${p.id}`} className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-300">
                  View curriculum
                </Link>
                {next && <LinkButton to={`/lesson/${next.id}`} variant="secondary" icon="arrowRight">Next lesson</LinkButton>}
              </div>
            </Card>
          )
        })}
        <Card>
          <CardHeader title="Learning activity" subtitle="Lessons, quizzes, notes and submissions, last 14 days" />
          <ActivityBar data={dailyActivity(state, 14)} />
        </Card>
      </div>

      {/* Skills + recent + upcoming */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader
            title="Skills development"
            subtitle="70% lessons done + 30% best quiz scores"
            action={
              <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs dark:bg-slate-800" role="tablist">
                {paths.map((p) => (
                  <button
                    key={p.id}
                    role="tab"
                    aria-selected={skillPath === p.id}
                    onClick={() => setSkillPath(p.id)}
                    className={cx(
                      'rounded-md px-2.5 py-1 font-medium transition',
                      skillPath === p.id ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-500',
                    )}
                  >
                    {p.id === 'data-analyst' ? 'DA' : 'BA'}
                  </button>
                ))}
              </div>
            }
          />
          <SkillsRadar data={skillScores(state, skillPath)} pathId={skillPath} />
          <details className="mt-2 text-sm">
            <summary className="cursor-pointer text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">Show as table</summary>
            <table className="mt-2 w-full text-left">
              <tbody>
                {skillScores(state, skillPath).map((s) => (
                  <tr key={s.skill} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="py-1.5">{s.skill}</td>
                    <td className="py-1.5 text-right tabular-nums">{s.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </Card>

        <Card>
          <CardHeader title="Recent activity" />
          {state.activity.length === 0 ? (
            <EmptyState icon="sparkles" title="Nothing yet">
              Open your first lesson and your activity will show up here.
            </EmptyState>
          ) : (
            <ul className="space-y-3">
              {state.activity.slice(0, 7).map((a, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 rounded-lg bg-slate-100 p-1.5 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    <Icon name={activityIcon[a.type]} className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    {a.lessonId ? (
                      <Link to={`/lesson/${a.lessonId}`} className="block truncate text-sm text-slate-700 hover:text-brand-600 dark:text-slate-200">
                        {a.label}
                      </Link>
                    ) : (
                      <p className="truncate text-sm text-slate-700 dark:text-slate-200">{a.label}</p>
                    )}
                    <p className="text-xs text-slate-400">{timeAgo(a.at)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Upcoming assignments" subtitle="From lessons with content, in curriculum order" />
          {upcoming.length === 0 ? (
            <EmptyState icon="clipboard" title="No open assignments">
              Assignments appear here as lessons that include them are added.
            </EmptyState>
          ) : (
            <ul className="space-y-3">
              {upcoming.map(({ ref, a }) => (
                <li key={a!.id}>
                  <Link
                    to={`/lesson/${ref.id}#assignment`}
                    className="block rounded-xl border border-slate-200 p-3 transition hover:border-brand-300 hover:bg-brand-50/40 dark:border-slate-700 dark:hover:border-brand-700 dark:hover:bg-brand-900/20"
                  >
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{a!.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{ref.moduleTitle}</p>
                    <ProgressBar value={state.completed[ref.id] ? 100 : 0} className="mt-2 h-1" />
                    <p className="mt-1 text-xs text-slate-400">{state.completed[ref.id] ? 'Lesson done, ready to submit' : 'Finish the lesson first'}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
