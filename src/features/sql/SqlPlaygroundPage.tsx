import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Badge, Button, Card, CardHeader, Icon, PageHeader, ProgressBar, cx } from '@/components/ui'
import { Markdown } from '@/components/lesson/Markdown'
import { SqlRunner, useDatabase } from '@/components/sql/SqlRunner'
import { datasets, getDataset, type DatasetId } from '@/content/datasets'
import { challenges, type SqlChallenge } from '@/content/sql/challenges'
import { describe, type TableInfo } from '@/services/sql'
import { getLessonRef } from '@/content/loader'
import { useProgress } from '@/store/ProgressContext'

const levelTone = { beginner: 'green', intermediate: 'amber', advanced: 'violet' } as const

function SchemaPanel({ dataset, onPick }: { dataset: DatasetId; onPick: (sql: string) => void }) {
  const { db, error } = useDatabase(dataset)
  const [tables, setTables] = useState<TableInfo[]>([])
  const [open, setOpen] = useState<string | null>(null)
  const meta = getDataset(dataset)

  useEffect(() => {
    if (!db) return
    try {
      const t = describe(db)
      setTables(t)
      setOpen((cur) => cur ?? t[0]?.name ?? null)
    } catch {
      /* database was closed by a reload; the next one will repopulate */
    }
  }, [db])

  return (
    <Card>
      <CardHeader title="Tables" subtitle="Click a table name to preview it" />
      {error && <p className="text-sm text-rose-600">{error}</p>}
      {!db && !error && <p className="text-sm text-slate-500">Loading database…</p>}
      <ul className="space-y-2">
        {tables.map((t) => {
          const desc = meta.tables.find((x) => x.name === t.name)?.description
          const expanded = open === t.name
          return (
            <li key={t.name} className="rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 px-3 py-2">
                <button className="focus-ring rounded p-0.5 text-slate-400 hover:text-slate-700" onClick={() => setOpen(expanded ? null : t.name)} aria-expanded={expanded} aria-label={`Show columns of ${t.name}`}>
                  <Icon name={expanded ? 'chevronDown' : 'chevronRight'} className="h-4 w-4" />
                </button>
                <button className="focus-ring rounded font-mono text-sm font-semibold text-brand-700 hover:underline dark:text-brand-300" onClick={() => onPick(`SELECT *\nFROM ${t.name}\nLIMIT 10;`)}>
                  {t.name}
                </button>
                <span className="ml-auto text-xs tabular-nums text-slate-400">{t.rows.toLocaleString()} rows</span>
              </div>
              {expanded && (
                <div className="border-t border-slate-100 px-3 py-2 dark:border-slate-800">
                  {desc && <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">{desc}</p>}
                  <ul className="space-y-0.5">
                    {t.columns.map((c) => (
                      <li key={c.name} className="flex items-center justify-between gap-2 font-mono text-xs">
                        <span className="text-slate-700 dark:text-slate-200">
                          {c.name}
                          {c.pk && <span className="ml-1 text-amber-600" title="Primary key">🔑</span>}
                        </span>
                        <span className="text-slate-400">{c.type}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

function ChallengePanel({ c, solved, onClose }: { c: SqlChallenge; solved: boolean; onClose: () => void }) {
  const [hint, setHint] = useState(false)
  const [solution, setSolution] = useState(false)
  const lesson = c.lessonId ? getLessonRef(c.lessonId) : undefined
  useEffect(() => {
    setHint(false)
    setSolution(false)
  }, [c.id])
  return (
    <div className="mb-4 rounded-xl border border-brand-200 bg-brand-50/60 p-4 dark:border-brand-900 dark:bg-brand-900/20">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Badge tone={levelTone[c.level]}>{c.level}</Badge>
        <h3 className="font-semibold text-slate-900 dark:text-white">{c.title}</h3>
        {solved && <Badge tone="green">Solved</Badge>}
        <button onClick={onClose} className="focus-ring ml-auto rounded p-1 text-slate-400 hover:text-slate-700" aria-label="Close challenge">
          <Icon name="x" className="h-4 w-4" />
        </button>
      </div>
      <Markdown>{c.prompt}</Markdown>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <Button variant="ghost" onClick={() => setHint((h) => !h)}>{hint ? 'Hide hint' : 'Show hint'}</Button>
        <Button variant="ghost" onClick={() => setSolution((s) => !s)}>{solution ? 'Hide solution' : 'Show solution'}</Button>
        {lesson && (
          <Link to={`/lesson/${lesson.id}`} className="ml-auto text-brand-600 hover:underline">
            Lesson: {lesson.title}
          </Link>
        )}
      </div>
      {hint && <p className="mt-2 rounded-lg bg-white p-3 text-sm text-slate-700 dark:bg-slate-900 dark:text-slate-300">💡 {c.hint}</p>}
      {solution && <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-900 p-3 font-mono text-[13px] text-slate-100">{c.solution}</pre>}
    </div>
  )
}

export function SqlPlaygroundPage() {
  const [params, setParams] = useSearchParams()
  const dataset = getDataset(params.get('db') ?? 'retail').id
  const challengeId = params.get('challenge')
  const active = challenges.find((c) => c.id === challengeId && c.dataset === dataset)
  const meta = getDataset(dataset)
  const { state, dispatch } = useProgress()
  const [picked, setPicked] = useState<string | null>(null)

  useEffect(() => setPicked(null), [dataset, challengeId])

  const list = useMemo(() => challenges.filter((c) => c.dataset === dataset), [dataset])
  const solvedCount = challenges.filter((c) => state.sqlSolved[c.id]).length
  const initial = picked ?? (active ? `-- ${active.title}\n` : meta.starter)

  const go = (db: DatasetId, challenge?: string) => {
    const p = new URLSearchParams({ db })
    if (challenge) p.set('challenge', challenge)
    setParams(p)
  }

  return (
    <div>
      <PageHeader
        title="SQL Practice"
        subtitle="A real SQLite database running in your browser. Write any query, explore three business datasets and solve challenges. Nothing you run can break anything: reset the data at any time."
        action={
          <div className="w-56">
            <p className="mb-1 text-right text-sm text-slate-500">
              {solvedCount} / {challenges.length} challenges solved
            </p>
            <ProgressBar value={(solvedCount / challenges.length) * 100} />
          </div>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3" role="tablist" aria-label="Dataset">
        {datasets.map((d) => {
          const total = challenges.filter((c) => c.dataset === d.id)
          const done = total.filter((c) => state.sqlSolved[c.id]).length
          return (
            <button
              key={d.id}
              role="tab"
              aria-selected={d.id === dataset}
              onClick={() => go(d.id)}
              className={cx(
                'focus-ring rounded-xl border p-4 text-left transition',
                d.id === dataset
                  ? 'border-brand-500 bg-brand-50 dark:border-brand-500 dark:bg-brand-900/30'
                  : 'border-slate-200 bg-white hover:border-brand-300 dark:border-slate-800 dark:bg-slate-900',
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900 dark:text-white">{d.title}</span>
                <span className="text-xs text-slate-500">{done}/{total.length}</span>
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{d.description}</p>
            </button>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        <div className="order-2 space-y-6 lg:order-1">
          <SchemaPanel dataset={dataset} onPick={(sql) => setPicked(sql)} />
        </div>

        <div className="order-1 min-w-0 space-y-6 lg:order-2">
          <Card>
            {active && <ChallengePanel c={active} solved={!!state.sqlSolved[active.id]} onClose={() => go(dataset)} />}
            <SqlRunner
              key={`${dataset}-${active?.id ?? 'free'}`}
              dataset={dataset}
              initialSql={initial}
              challenge={active ? { solution: active.solution, ordered: active.ordered } : undefined}
              onSolved={() => active && dispatch({ type: 'solveSql', challengeId: active.id, label: active.title })}
            />
          </Card>

          <Card>
            <CardHeader title="Challenges" subtitle={`${list.length} tasks on the ${meta.title.toLowerCase()} data, from beginner to advanced`} />
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {list.map((c) => {
                const solved = !!state.sqlSolved[c.id]
                return (
                  <li key={c.id}>
                    <button
                      onClick={() => {
                        go(dataset, c.id)
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }}
                      className={cx('focus-ring flex w-full items-center gap-3 rounded-lg px-2 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60', active?.id === c.id && 'bg-brand-50/60 dark:bg-brand-900/20')}
                    >
                      <Icon name={solved ? 'checkCircle' : 'target'} className={cx('h-5 w-5 shrink-0', solved ? 'text-emerald-500' : 'text-slate-300')} />
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium text-slate-900 dark:text-white">{c.title}</span>
                        <span className="block truncate text-sm text-slate-500">{c.prompt.replace(/`/g, '').replace(/\*\*/g, '')}</span>
                      </span>
                      <Badge tone={levelTone[c.level]}>{c.level}</Badge>
                    </button>
                  </li>
                )
              })}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  )
}
