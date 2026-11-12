import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import type { Database } from 'sql.js'
import { Badge, Button, Icon, cx } from '@/components/ui'
import { openDatabase, runSql, sameResult, type RunOutcome } from '@/services/sql'
import type { DatasetId } from '@/content/datasets'

const MAX_ROWS = 200

/** Opens a private copy of a dataset; `reset` throws away any changes. */
export function useDatabase(dataset: DatasetId) {
  const [db, setDb] = useState<Database | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let alive = true
    let opened: Database | null = null
    setDb(null)
    setError(null)
    openDatabase(dataset)
      .then((d) => {
        if (alive) {
          opened = d
          setDb(d)
        } else d.close()
      })
      .catch((e) => alive && setError(e instanceof Error ? e.message : String(e)))
    return () => {
      alive = false
      opened?.close()
    }
  }, [dataset, version])

  const reset = useCallback(() => setVersion((v) => v + 1), [])
  return { db, error, reset }
}

export interface SqlChallengeCheck {
  solution: string
  ordered: boolean
}

export function ResultTable({ columns, rows }: { columns: string[]; rows: (string | number | null)[][] }) {
  const shown = rows.slice(0, MAX_ROWS)
  return (
    <div>
      <div className="max-h-96 overflow-auto rounded-lg border border-slate-200 dark:border-slate-700">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800">
            <tr>
              {columns.map((c, i) => (
                <th key={i} className="whitespace-nowrap px-3 py-2 font-semibold text-slate-700 dark:text-slate-200">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((r, i) => (
              <tr key={i} className="border-t border-slate-100 odd:bg-white even:bg-slate-50/60 dark:border-slate-800 dark:odd:bg-slate-900 dark:even:bg-slate-800/40">
                {r.map((v, j) => (
                  <td key={j} className={cx('whitespace-nowrap px-3 py-1.5 font-mono text-[13px]', typeof v === 'number' && 'text-right tabular-nums', v === null && 'italic text-slate-400')}>
                    {v === null ? 'NULL' : String(v)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-1.5 text-xs text-slate-500">
        {rows.length} row{rows.length === 1 ? '' : 's'}
        {rows.length > MAX_ROWS && ` (showing the first ${MAX_ROWS})`}
      </p>
    </div>
  )
}

export function SqlRunner({
  dataset,
  initialSql,
  compact = false,
  challenge,
  onSolved,
}: {
  dataset: DatasetId
  initialSql: string
  compact?: boolean
  challenge?: SqlChallengeCheck
  onSolved?: () => void
}) {
  const { db, error: loadError, reset } = useDatabase(dataset)
  const [sql, setSql] = useState(initialSql)
  const [outcome, setOutcome] = useState<RunOutcome | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [check, setCheck] = useState<{ ok: boolean; reason: string } | null>(null)
  const area = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setSql(initialSql)
    setOutcome(null)
    setError(null)
    setCheck(null)
  }, [initialSql, dataset])

  const run = useCallback(() => {
    if (!db) return null
    setCheck(null)
    try {
      const o = runSql(db, sql)
      setOutcome(o)
      setError(null)
      return o
    } catch (e) {
      setOutcome(null)
      setError(e instanceof Error ? e.message : String(e))
      return null
    }
  }, [db, sql])

  const checkAnswer = () => {
    if (!db || !challenge) return
    const mine = run()
    if (!mine) {
      setCheck({ ok: false, reason: 'Fix the error in your query first.' })
      return
    }
    try {
      const expected = runSql(db, challenge.solution)
      const res = sameResult(mine.results[mine.results.length - 1], expected.results[expected.results.length - 1], challenge.ordered)
      setCheck(res)
      if (res.ok) onSolved?.()
    } catch {
      setCheck({ ok: false, reason: 'The reference answer could not run, probably because your query changed the data. Reset the database and try again.' })
    }
  }

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      run()
    } else if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault()
      const el = e.currentTarget
      const { selectionStart: s, selectionEnd: end } = el
      const next = sql.slice(0, s) + '  ' + sql.slice(end)
      setSql(next)
      requestAnimationFrame(() => el.setSelectionRange(s + 2, s + 2))
    }
  }

  const last = outcome?.results[outcome.results.length - 1]

  return (
    <div className={cx('not-prose rounded-xl border border-slate-200 bg-slate-50/60 dark:border-slate-700 dark:bg-slate-900/60', compact ? 'p-3' : 'p-4')}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Icon name="database" className="h-4 w-4" />
          <span>
            Database: <strong className="text-slate-700 dark:text-slate-200">{dataset}</strong>
          </span>
          {!db && !loadError && <Badge tone="amber">Loading…</Badge>}
        </div>
        <span className="hidden text-xs text-slate-400 sm:inline">Ctrl + Enter to run</span>
      </div>
      <textarea
        ref={area}
        value={sql}
        onChange={(e) => setSql(e.target.value)}
        onKeyDown={onKey}
        spellCheck={false}
        aria-label="SQL query"
        rows={Math.min(16, Math.max(compact ? 4 : 7, sql.split('\n').length + 1))}
        className="block w-full resize-y rounded-lg border border-slate-200 bg-white p-3 font-mono text-[13px] leading-relaxed text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
      />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Button icon="play" onClick={() => run()} disabled={!db}>
          Run query
        </Button>
        {challenge && (
          <Button variant="secondary" icon="check" onClick={checkAnswer} disabled={!db}>
            Check answer
          </Button>
        )}
        <Button variant="ghost" onClick={() => { setSql(initialSql); setOutcome(null); setError(null); setCheck(null) }}>
          Reset query
        </Button>
        <Button variant="ghost" onClick={() => { reset(); setOutcome(null); setError(null); setCheck(null) }} title="Undo any INSERT, UPDATE or DELETE you ran">
          Reset data
        </Button>
        {outcome && <span className="ml-auto text-xs text-slate-400">{outcome.ms} ms</span>}
      </div>

      {loadError && <p className="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">Could not load the SQL engine: {loadError}</p>}

      {check && (
        <div className={cx('mt-3 flex items-start gap-2 rounded-lg p-3 text-sm', check.ok ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200' : 'bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200')}>
          <Icon name={check.ok ? 'checkCircle' : 'x'} className="mt-0.5 h-4 w-4 shrink-0" />
          {check.ok ? 'Correct! Your result matches the expected answer.' : `Not quite. ${check.reason}`}
        </div>
      )}

      {error && (
        <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-rose-50 p-3 font-mono text-[13px] text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">Error: {error}</pre>
      )}

      {outcome && !error && (
        <div className="mt-3">
          {last ? (
            <ResultTable columns={last.columns} rows={last.rows} />
          ) : (
            <p className="text-sm text-slate-500">Query ran. {outcome.changes ? `${outcome.changes} row(s) changed.` : 'No rows returned.'}</p>
          )}
        </div>
      )}
    </div>
  )
}
