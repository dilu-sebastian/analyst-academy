import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Badge, Card, Icon, LinkButton, PageHeader, ProgressBar, cx } from '@/components/ui'
import { useProgress } from '@/store/ProgressContext'
import { continueLesson, moduleStats, pathStats } from '@/store/selectors'
import { allLessons, getPath, paths } from '@/content/loader'

export function PathsPage() {
  const { state } = useProgress()
  return (
    <div>
      <PageHeader title="Learning paths" subtitle="Two independent career paths. Follow one, or both side by side." />
      <div className="grid gap-6 md:grid-cols-2">
        {paths.map((p) => {
          const s = pathStats(state, p.id)
          return (
            <Card key={p.id}>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{p.title}</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{p.description}</p>
              <ProgressBar value={s.percent} className="mt-4" color={p.color} />
              <p className="mt-1 text-xs text-slate-500">
                {s.completed}/{s.total} lessons · {p.modules.length} modules
              </p>
              <LinkButton to={`/paths/${p.id}`} className="mt-4" icon="arrowRight">
                Open path
              </LinkButton>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export function PathDetailPage() {
  const { pathId = '' } = useParams()
  const path = getPath(pathId)
  const { state } = useProgress()
  const [open, setOpen] = useState<Record<string, boolean>>({})
  if (!path) return <Navigate to="/paths" replace />

  const s = pathStats(state, path.id)
  const resume = continueLesson(state, path.id)
  const titleOf = (id: string) => path.modules.find((m) => m.id === id)?.title ?? id

  return (
    <div>
      <PageHeader
        title={`${path.title} path`}
        subtitle={path.description}
        action={resume && <LinkButton to={`/lesson/${resume.id}`} icon="arrowRight">Continue: {resume.title}</LinkButton>}
      />

      <Card className="mb-6">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex-1">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-200">Path progress</span>
              <span className="tabular-nums text-slate-500">
                {s.completed} of {s.total} lessons ({s.percent}%)
              </span>
            </div>
            <ProgressBar value={s.percent} className="mt-2" color={path.color} />
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-200">{s.available}</span> {s.available === 1 ? "lesson" : "lessons"} with content ·{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-200">{s.total - s.available}</span> coming soon
          </div>
        </div>
      </Card>

      <ol className="space-y-3">
        {path.modules.map((m, i) => {
          const ms = moduleStats(state, m.id)
          const prereqsDone = m.prerequisites.every((p) => moduleStats(state, p).percent === 100)
          const isOpen = open[m.id] ?? i === 0
          const lessons = allLessons.filter((l) => l.moduleId === m.id)
          return (
            <li key={m.id} className="card overflow-hidden">
              <button
                onClick={() => setOpen((o) => ({ ...o, [m.id]: !isOpen }))}
                className="flex w-full items-center gap-4 p-5 text-left focus-ring"
                aria-expanded={isOpen}
              >
                <span
                  className={cx(
                    'grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm font-bold',
                    ms.percent === 100 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
                  )}
                >
                  {ms.percent === 100 ? <Icon name="check" className="h-5 w-5" /> : i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-900 dark:text-white">{m.title}</span>
                    <Badge>{m.skill}</Badge>
                    {ms.available === 0 && <Badge tone="amber">Content coming soon</Badge>}
                    {ms.available > 0 && ms.available < ms.total && <Badge tone="amber">{ms.available}/{ms.total} lessons ready</Badge>}
                  </span>
                  <span className="mt-1 block text-sm text-slate-500 dark:text-slate-400">{m.summary}</span>
                  <span className="mt-2 flex items-center gap-3">
                    <ProgressBar value={ms.percent} className="h-1.5 max-w-xs" color={path.color} />
                    <span className="text-xs tabular-nums text-slate-400">
                      {ms.completed}/{ms.total}
                    </span>
                  </span>
                </span>
                <Icon name="chevronDown" className={cx('h-5 w-5 shrink-0 text-slate-400 transition', isOpen && 'rotate-180')} />
              </button>

              {isOpen && (
                <div className="border-t border-slate-100 px-5 pb-4 pt-3 dark:border-slate-800">
                  {m.prerequisites.length > 0 && (
                    <p className={cx('mb-3 flex items-center gap-2 text-xs', prereqsDone ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400')}>
                      <Icon name={prereqsDone ? 'checkCircle' : 'lock'} className="h-4 w-4" />
                      Prerequisites: {m.prerequisites.map(titleOf).join(', ')}
                      {!prereqsDone && ' (recommended first, not enforced)'}
                    </p>
                  )}
                  <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                    {lessons.map((l, j) => {
                      const done = !!state.completed[l.id]
                      const quiz = state.quizResults[l.id]
                      const row = (
                        <>
                          <span className={cx('grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs', done ? 'bg-emerald-500 text-white' : 'border border-slate-300 text-slate-500 dark:border-slate-600')}>
                            {done ? <Icon name="check" className="h-3.5 w-3.5" strokeWidth={3} /> : j + 1}
                          </span>
                          <span className="flex-1 text-sm">{l.title}</span>
                          {quiz && <Badge tone="violet">Quiz {quiz.bestScore}%</Badge>}
                          {!l.available && <Badge tone="amber">Coming soon</Badge>}
                          <span className="text-xs tabular-nums text-slate-400">{l.minutes} min</span>
                        </>
                      )
                      return (
                        <li key={l.id}>
                          {l.available ? (
                            <Link to={`/lesson/${l.id}`} className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800/60">
                              {row}
                            </Link>
                          ) : (
                            <div className="flex items-center gap-3 px-2 py-2.5 text-slate-400">{row}</div>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
