import { NavLink } from 'react-router-dom'
import { Icon, ProgressBar, cx } from '@/components/ui'
import type { IconName } from '@/components/ui/Icon'
import { useProgress } from '@/store/ProgressContext'
import { pathStats } from '@/store/selectors'
import { paths } from '@/content/loader'

const main: { to: string; label: string; icon: IconName }[] = [
  { to: '/', label: 'Dashboard', icon: 'home' },
  { to: '/sql', label: 'SQL Practice', icon: 'database' },
  { to: '/projects', label: 'Projects', icon: 'folder' },
  { to: '/interview', label: 'Interview Prep', icon: 'mic' },
]

const personal: { to: string; label: string; icon: IconName }[] = [
  { to: '/search', label: 'Search', icon: 'search' },
  { to: '/bookmarks', label: 'Bookmarks', icon: 'bookmark' },
  { to: '/notes', label: 'My Notes', icon: 'note' },
  { to: '/settings', label: 'Settings', icon: 'settings' },
]

const linkCls = ({ isActive }: { isActive: boolean }) =>
  cx(
    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition focus-ring',
    isActive
      ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white',
  )

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { state } = useProgress()
  return (
    <nav className="flex h-full flex-col gap-6 overflow-y-auto px-3 py-5" aria-label="Main">
      <NavLink to="/" onClick={onNavigate} className="flex items-center gap-2.5 px-3">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white">
          <Icon name="chart" className="h-5 w-5" strokeWidth={2.2} />
        </span>
        <span>
          <span className="block text-sm font-bold text-slate-900 dark:text-white">Analyst Academy</span>
          <span className="block text-xs text-slate-500 dark:text-slate-400">Data &amp; Business Analysis</span>
        </span>
      </NavLink>

      <div className="space-y-1">
        {main.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.to === '/'} className={linkCls} onClick={onNavigate}>
            <Icon name={l.icon} />
            {l.label}
          </NavLink>
        ))}
      </div>

      <div>
        <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Learning paths</p>
        <div className="space-y-1">
          {paths.map((p) => {
            const s = pathStats(state, p.id)
            return (
              <NavLink key={p.id} to={`/paths/${p.id}`} className={linkCls} onClick={onNavigate}>
                <Icon name={p.id === 'data-analyst' ? 'chart' : 'briefcase'} />
                <span className="flex-1">
                  <span className="flex items-center justify-between">
                    {p.title}
                    <span className="text-xs tabular-nums text-slate-400">{s.percent}%</span>
                  </span>
                  <ProgressBar value={s.percent} className="mt-1.5 h-1" color={p.color} />
                </span>
              </NavLink>
            )
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Personal</p>
        <div className="space-y-1">
          {personal.map((l) => (
            <NavLink key={l.to} to={l.to} className={linkCls} onClick={onNavigate}>
              <Icon name={l.icon} />
              {l.label}
              {l.to === '/bookmarks' && state.bookmarks.length > 0 && (
                <span className="ml-auto text-xs tabular-nums text-slate-400">{state.bookmarks.length}</span>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  )
}
