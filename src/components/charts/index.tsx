import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  LinearScale,
  LineElement,
  PointElement,
  RadialLinearScale,
  Tooltip,
} from 'chart.js'
import { Bar, Doughnut, Radar } from 'react-chartjs-2'
import { useTheme } from '@/store/ThemeContext'
import type { PathId } from '@/types/content'

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, RadialLinearScale, PointElement, LineElement, Filler, Tooltip)

/** Validated categorical palette (light / dark steps), one hue per learning path. */
export const pathColor = (id: PathId, dark: boolean) =>
  id === 'data-analyst' ? (dark ? '#4f8ff7' : '#1d5cf3') : dark ? '#18a874' : '#0e9f6e'

function useChartTheme() {
  const { resolved } = useTheme()
  const dark = resolved === 'dark'
  return {
    dark,
    surface: dark ? '#0f172a' : '#ffffff',
    track: dark ? '#1e293b' : '#eef2f7',
    grid: dark ? 'rgba(148,163,184,0.12)' : 'rgba(100,116,139,0.12)',
    text: dark ? '#94a3b8' : '#64748b',
    tooltip: {
      backgroundColor: dark ? '#1e293b' : '#0f172a',
      titleColor: '#f8fafc',
      bodyColor: '#e2e8f0',
      padding: 10,
      cornerRadius: 8,
      displayColors: false,
    },
  }
}

/** Completed vs remaining for one path. Single value, so the ring carries the number in its centre. */
export function ProgressDoughnut({ completed, total, pathId, label }: { completed: number; total: number; pathId: PathId; label: string }) {
  const t = useChartTheme()
  const pct = total ? Math.round((completed / total) * 100) : 0
  return (
    <div className="relative mx-auto h-36 w-36">
      <Doughnut
        data={{
          labels: ['Completed', 'Remaining'],
          datasets: [
            {
              data: [completed, Math.max(total - completed, 0)],
              backgroundColor: [pathColor(pathId, t.dark), t.track],
              borderColor: t.surface,
              borderWidth: 2,
              borderRadius: 4,
            },
          ],
        }}
        options={{
          cutout: '78%',
          maintainAspectRatio: false,
          plugins: { tooltip: { ...t.tooltip, callbacks: { label: (c) => `${c.label}: ${c.parsed} lessons` } } },
        }}
        aria-label={`${label}: ${completed} of ${total} lessons completed`}
      />
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-semibold tabular-nums text-slate-900 dark:text-white">{pct}%</span>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {completed}/{total}
        </span>
      </div>
    </div>
  )
}

/** Learning actions per day (single series). */
export function ActivityBar({ data }: { data: { label: string; count: number }[] }) {
  const t = useChartTheme()
  return (
    <div className="h-48">
      <Bar
        data={{
          labels: data.map((d) => d.label),
          datasets: [
            {
              data: data.map((d) => d.count),
              backgroundColor: t.dark ? '#4f8ff7' : '#1d5cf3',
              borderRadius: { topLeft: 4, topRight: 4 },
              borderSkipped: 'bottom',
              maxBarThickness: 18,
            },
          ],
        }}
        options={{
          maintainAspectRatio: false,
          plugins: { tooltip: { ...t.tooltip, callbacks: { label: (c) => `${c.parsed.y} learning action${c.parsed.y === 1 ? '' : 's'}` } } },
          scales: {
            x: { grid: { display: false }, ticks: { color: t.text, font: { size: 10 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 7 }, border: { display: false } },
            y: { beginAtZero: true, ticks: { color: t.text, precision: 0, font: { size: 10 } }, grid: { color: t.grid }, border: { display: false } },
          },
        }}
        aria-label="Learning activity over the last 14 days"
      />
    </div>
  )
}

/** Skill scores for one path (single series, the card title names the path). */
export function SkillsRadar({ data, pathId }: { data: { skill: string; score: number }[]; pathId: PathId }) {
  const t = useChartTheme()
  const c = pathColor(pathId, t.dark)
  return (
    <div className="h-64">
      <Radar
        data={{
          labels: data.map((d) => d.skill),
          datasets: [
            {
              data: data.map((d) => d.score),
              borderColor: c,
              backgroundColor: c + '26',
              borderWidth: 2,
              pointRadius: 4,
              pointHoverRadius: 6,
              pointBackgroundColor: c,
              pointBorderColor: t.surface,
              pointBorderWidth: 2,
              fill: true,
            },
          ],
        }}
        options={{
          maintainAspectRatio: false,
          plugins: { tooltip: { ...t.tooltip, callbacks: { label: (x) => `Skill score: ${x.parsed.r}/100` } } },
          scales: {
            r: {
              min: 0,
              max: 100,
              ticks: { display: false, stepSize: 25 },
              grid: { color: t.grid },
              angleLines: { color: t.grid },
              pointLabels: { color: t.text, font: { size: 11 } },
            },
          },
        }}
        aria-label="Skill scores"
      />
    </div>
  )
}
