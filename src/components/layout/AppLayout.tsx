import { useEffect, useState, type FormEvent } from 'react'
import { Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Icon } from '@/components/ui'
import { useTheme } from '@/store/ThemeContext'

function Topbar({ onMenu }: { onMenu: () => void }) {
  const { resolved, toggle } = useTheme()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [q, setQ] = useState(params.get('q') ?? '')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    navigate(`/search?q=${encodeURIComponent(q.trim())}`)
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200/80 bg-white/80 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80 sm:px-6">
      <button onClick={onMenu} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 focus-ring dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden" aria-label="Open menu">
        <Icon name="menu" />
      </button>
      <form onSubmit={submit} className="relative max-w-md flex-1" role="search">
        <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search lessons, terms, topics…"
          className="input pl-9"
          aria-label="Search lessons"
        />
      </form>
      <div className="ml-auto flex items-center gap-1">
        <button
          onClick={toggle}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 focus-ring dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label={`Switch to ${resolved === 'dark' ? 'light' : 'dark'} mode`}
          title={`Switch to ${resolved === 'dark' ? 'light' : 'dark'} mode`}
        >
          <Icon name={resolved === 'dark' ? 'sun' : 'moon'} />
        </button>
      </div>
    </header>
  )
}

export function AppLayout() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="min-h-screen">
      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 lg:block">
        <Sidebar />
      </aside>

      {/* mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-white shadow-xl dark:bg-slate-900">
            <button onClick={() => setOpen(false)} className="absolute right-3 top-4 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Close menu">
              <Icon name="x" />
            </button>
            <Sidebar onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <Topbar onMenu={() => setOpen(true)} />
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
