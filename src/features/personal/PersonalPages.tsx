import { useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Badge, Button, Card, EmptyState, Icon, PageHeader, cx } from '@/components/ui'
import type { IconName } from '@/components/ui/Icon'
import { useProgress } from '@/store/ProgressContext'
import { useTheme, type Theme } from '@/store/ThemeContext'
import { allLessons, getLessonRef, getPath, lessonSearchText } from '@/content/loader'
import { exportState, parseImport } from '@/services/storage'
import { timeAgo } from '@/utils/date'
import type { LessonRef } from '@/types/content'

function LessonRow({ l, extra }: { l: LessonRef; extra?: React.ReactNode }) {
  const { state } = useProgress()
  return (
    <Link to={`/lesson/${l.id}`} className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-brand-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-brand-700">
      <div className="min-w-0 flex-1">
        <p className="font-medium text-slate-900 dark:text-white">{l.title}</p>
        <p className="text-sm text-slate-500">
          {getPath(l.pathId)?.title} · {l.moduleTitle}
        </p>
        {extra}
      </div>
      {state.completed[l.id] && <Badge tone="green">Completed</Badge>}
      {!l.available && <Badge tone="amber">Coming soon</Badge>}
      <Icon name="chevronRight" className="h-4 w-4 text-slate-400" />
    </Link>
  )
}

/* ---------------- Search ---------------- */

export function SearchPage() {
  const [params, setParams] = useSearchParams()
  const q = (params.get('q') ?? '').trim()
  const [pathFilter, setPathFilter] = useState<'all' | 'data-analyst' | 'business-analyst'>('all')

  const results = useMemo(() => {
    if (!q) return []
    const words = q.toLowerCase().split(/\s+/)
    return allLessons
      .filter((l) => pathFilter === 'all' || l.pathId === pathFilter)
      .map((l) => {
        const titleText = `${l.title} ${l.moduleTitle} ${l.skill}`.toLowerCase()
        const body = l.available ? lessonSearchText(l.id).toLowerCase() : ''
        let score = 0
        let snippet = ''
        for (const w of words) {
          if (titleText.includes(w)) score += 5
          const idx = body.indexOf(w)
          if (idx >= 0) {
            score += 1
            if (!snippet) snippet = '…' + body.slice(Math.max(0, idx - 60), idx + 100).replace(/\s+/g, ' ') + '…'
          }
        }
        return { l, score, snippet }
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score || Number(b.l.available) - Number(a.l.available))
  }, [q, pathFilter])

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Search" subtitle="Searches lesson titles, modules, skills and the full text of written lessons." />
      <input
        className="input mb-3 text-base"
        defaultValue={q}
        key={q}
        autoFocus
        placeholder="e.g. pivot table, user story, GROUP BY"
        onKeyDown={(e) => {
          if (e.key === 'Enter') setParams({ q: (e.target as HTMLInputElement).value })
        }}
        aria-label="Search query"
      />
      <div className="mb-5 flex gap-2 text-sm">
        {(['all', 'data-analyst', 'business-analyst'] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPathFilter(p)}
            className={cx('rounded-full px-3 py-1', pathFilter === p ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300')}
          >
            {p === 'all' ? 'All paths' : getPath(p)?.title}
          </button>
        ))}
      </div>
      {!q ? (
        <EmptyState icon="search" title="Type something to search">
          Press Enter to search.
        </EmptyState>
      ) : results.length === 0 ? (
        <EmptyState icon="search" title={`No results for “${q}”`}>
          Try a shorter or different word.
        </EmptyState>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-slate-500">
            {results.length} result{results.length === 1 ? '' : 's'}
          </p>
          {results.map(({ l, snippet }) => (
            <LessonRow key={l.id} l={l} extra={snippet && <p className="mt-1 line-clamp-2 text-xs text-slate-400">{snippet}</p>} />
          ))}
        </div>
      )}
    </div>
  )
}

/* ---------------- Bookmarks ---------------- */

export function BookmarksPage() {
  const { state } = useProgress()
  const list = state.bookmarks.map(getLessonRef).filter((x): x is LessonRef => !!x)
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Bookmarks" subtitle="Lessons you saved to come back to." />
      {list.length === 0 ? (
        <EmptyState icon="bookmark" title="No bookmarks yet">
          Use the Bookmark button at the top of any lesson.
        </EmptyState>
      ) : (
        <div className="space-y-3">{list.map((l) => <LessonRow key={l.id} l={l} />)}</div>
      )}
    </div>
  )
}

/* ---------------- Notes ---------------- */

export function NotesPage() {
  const { state } = useProgress()
  const [filter, setFilter] = useState('')
  const notes = Object.entries(state.notes)
    .map(([id, n]) => ({ ref: getLessonRef(id), ...n }))
    .filter((n) => n.ref && (!filter || n.text.toLowerCase().includes(filter.toLowerCase()) || n.ref.title.toLowerCase().includes(filter.toLowerCase())))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="My notes" subtitle="Every note you have written, newest first." />
      {Object.keys(state.notes).length > 0 && <input className="input mb-5" placeholder="Filter notes…" value={filter} onChange={(e) => setFilter(e.target.value)} />}
      {notes.length === 0 ? (
        <EmptyState icon="note" title="No notes yet">
          Each lesson has a “My notes” box at the bottom.
        </EmptyState>
      ) : (
        <div className="space-y-4">
          {notes.map((n) => (
            <Card key={n.ref!.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Link to={`/lesson/${n.ref!.id}#notes`} className="font-semibold text-slate-900 hover:text-brand-600 dark:text-white">
                    {n.ref!.title}
                  </Link>
                  <p className="text-xs text-slate-500">
                    {n.ref!.moduleTitle} · edited {timeAgo(n.updatedAt)}
                  </p>
                </div>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">{n.text}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

/* ---------------- Settings ---------------- */

export function SettingsPage() {
  const { state, dispatch } = useProgress()
  const { theme, setTheme } = useTheme()
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState('')

  const download = () => {
    const blob = new Blob([exportState(state)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `analyst-academy-progress-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const upload = async (f: File) => {
    const parsed = parseImport(await f.text())
    if (!parsed) return setMsg('That file is not a valid Analyst Academy progress export.')
    dispatch({ type: 'import', state: parsed })
    setMsg('Progress imported.')
  }

  const themes: { id: Theme; label: string; icon: IconName }[] = [
    { id: 'light', label: 'Light', icon: 'sun' },
    { id: 'dark', label: 'Dark', icon: 'moon' },
    { id: 'system', label: 'System', icon: 'settings' },
  ]

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Settings" />
      <Card>
        <h2 className="font-semibold text-slate-900 dark:text-white">Appearance</h2>
        <div className="mt-3 flex gap-2">
          {themes.map((t) => (
            <Button key={t.id} variant={theme === t.id ? 'primary' : 'secondary'} icon={t.icon} onClick={() => setTheme(t.id)}>
              {t.label}
            </Button>
          ))}
        </div>
      </Card>
      <Card>
        <h2 className="font-semibold text-slate-900 dark:text-white">Your progress data</h2>
        <p className="mt-1 text-sm text-slate-500">
          Progress is stored only in this browser. Export it as a backup or to move to another device.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="secondary" icon="download" onClick={download}>
            Export progress
          </Button>
          <Button variant="secondary" icon="upload" onClick={() => fileRef.current?.click()}>
            Import progress
          </Button>
          <input ref={fileRef} type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          <Button
            variant="danger"
            icon="trash"
            onClick={() => {
              if (confirm('Delete all progress, notes, bookmarks and submissions? This cannot be undone.')) {
                dispatch({ type: 'reset' })
                setMsg('All progress was reset.')
              }
            }}
          >
            Reset everything
          </Button>
        </div>
        {msg && <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{msg}</p>}
      </Card>
    </div>
  )
}

/* ---------------- Sections that arrive in later stages ---------------- */

export function UpcomingPage({ title, icon, children }: { title: string; icon: IconName; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={title} />
      <EmptyState icon={icon} title="Being built in a later stage">
        {children}
      </EmptyState>
    </div>
  )
}
