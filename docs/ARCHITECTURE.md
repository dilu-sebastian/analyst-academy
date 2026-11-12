# Analyst Academy: Architecture

A personal learning management system (LMS) for becoming job-ready as a **Data Analyst** or **Business Analyst**. It runs fully in the browser: no backend, no login. Progress lives in `localStorage` and can be exported/imported as JSON.

## 1. Goals that shape the design

| Goal | Design decision |
|---|---|
| Teach, not just define | Every lesson follows a fixed 10-part structure (explanation, examples, terminology, demo, practice, mistakes, exercises, quiz, interview questions, completion). The lesson engine renders each part with its own component, so no part can be silently skipped. |
| Easy to add content | Content is data, not code. A lesson is one Markdown file (the teaching) plus one JSON file (terms, quiz, exercises, interview Qs). Drop the two files in a folder and register the lesson id in the curriculum JSON. |
| Honest curriculum status | The curriculum lists every planned lesson. A lesson without content files shows as **Coming soon** in the UI and is excluded from "% complete" maths for available content, so nothing pretends to be finished. |
| Interactive | Quizzes with explanations, Q&A exercises with reveal-able model answers, an in-browser SQL engine (sql.js / SQLite compiled to WebAssembly) running on sample datasets, and an assignment submission box. |
| Scalable | Feature folders, a single typed store with a reducer, and a content loader that is the only place that knows where files live. Moving to a real backend later means replacing `services/storage.ts` and `content/loader.ts`. |

## 2. Tech stack

- **Vite + React 18 + TypeScript** (strict mode)
- **Tailwind CSS 3** with `@tailwindcss/typography` for lesson prose, `darkMode: 'class'`
- **React Router 6** (hash router, so the built app works from any static host or a local file server)
- **Chart.js 4** via `react-chartjs-2` for progress visualisations
- **react-markdown + remark-gfm** for lesson content (tables, task lists)
- **sql.js** for the SQL practice area (real SQLite in the browser)

## 3. Folder structure

```
analyst-academy/
├─ docs/ARCHITECTURE.md          this file
├─ public/                       static assets (sql-wasm.wasm is copied here)
└─ src/
   ├─ main.tsx                   entry: providers + router
   ├─ App.tsx                    route table
   ├─ index.css                  Tailwind layers + design tokens
   │
   ├─ types/                     shared TypeScript types
   │  ├─ content.ts              Path, Module, LessonMeta, LessonContent, Quiz...
   │  └─ progress.ts             ProgressState, Activity, QuizResult...
   │
   ├─ content/                   ALL learning content lives here
   │  ├─ curriculum/
   │  │  ├─ data-analyst.json    Path A: modules, prerequisites, lesson list
   │  │  └─ business-analyst.json Path B
   │  ├─ lessons/
   │  │  └─ <path>/<module>/<lesson-id>.md    teaching text (Markdown)
   │  │  └─ <path>/<module>/<lesson-id>.json  terms, quiz, exercises, interview Qs
   │  ├─ datasets/               sample data (SQL seed scripts / CSV-like TS)
   │  ├─ projects/               project briefs (stage 4)
   │  ├─ interview/              interview banks (stage 4)
   │  └─ loader.ts               the only module that resolves content files
   │
   ├─ store/
   │  ├─ ProgressContext.tsx     React context + reducer, persisted to localStorage
   │  ├─ selectors.ts            derived numbers: % complete, streak, skills...
   │  └─ ThemeContext.tsx        light / dark / system
   │
   ├─ services/
   │  └─ storage.ts              versioned load/save/export/import of state
   │
   ├─ components/
   │  ├─ layout/                 AppLayout (incl. Topbar), Sidebar
   │  ├─ ui/                     Card, Button, Badge, ProgressBar, ProgressRing,
   │  │                          EmptyState, Tabs, StatCard
   │  ├─ charts/                 ProgressDoughnut, ActivityBar, SkillsRadar
   │  └─ lesson/                 Markdown, QuizBlock, TermList, ExerciseBlock,
   │                             InterviewBlock, AssignmentBlock, NotesPanel
   │
   ├─ features/                  one folder per page
   │  ├─ dashboard/              DashboardPage + widgets
   │  ├─ paths/                  PathsPage, PathDetailPage
   │  ├─ lesson/                 LessonPage
   │  ├─ sql/                    SqlPlaygroundPage (stage 2)
   │  ├─ projects/               ProjectsPage (stage 4)
   │  ├─ interview/              InterviewPage (stage 4)
   │  └─ personal/               SearchPage, BookmarksPage, NotesPage,
   │                             SettingsPage (theme, export/import/reset)
   │
   └─ utils/                     dates, formatting, search scoring
```

## 4. Content model

### Curriculum JSON (one per path)

```jsonc
{
  "id": "data-analyst",
  "title": "Data Analyst",
  "modules": [
    {
      "id": "da-01",
      "title": "Introduction to Data Analytics",
      "summary": "...",
      "skill": "Foundations",          // feeds the Skills chart
      "prerequisites": [],             // module ids
      "lessons": [
        { "id": "da-01-01", "title": "What is data analytics?", "minutes": 25 }
      ]
    }
  ]
}
```

### Lesson files

`da-01-01.md` is plain Markdown with fixed `##` headings that the engine splits into sections:

```
## Explanation
## Real-world examples
## Step-by-step demonstration
## Practical example
## Common mistakes
```

`da-01-01.json` holds the structured parts:

```jsonc
{
  "id": "da-01-01",
  "objectives": ["..."],
  "terminology": [{ "term": "Dataset", "definition": "..." }],
  "exercises":  [{ "question": "...", "answer": "..." }],
  "quiz":       [{ "question": "...", "options": ["..."], "answer": 1, "explanation": "..." }],
  "interview":  [{ "question": "...", "level": "beginner", "answer": "..." }],
  "assignment": { "title": "...", "brief": "..." }   // optional
}
```

`content/loader.ts` uses Vite's `import.meta.glob` to find every `.md`/`.json` pair at build time. If a lesson listed in the curriculum has no files, `getLesson()` returns `null` and the UI shows **Coming soon**.

## 5. State model (`localStorage` key `analyst-academy:v1`)

```ts
interface ProgressState {
  version: 1
  completed: Record<lessonId, isoDate>
  quizResults: Record<lessonId, { score; total; attempts; bestScore; date }>
  bookmarks: lessonId[]
  notes: Record<lessonId, { text; updatedAt }>
  assignments: Record<assignmentId, { text; submittedAt }>
  activity: Activity[]          // last 200 events, newest first
  lastVisited?: { lessonId; at }
}
```

All writes go through a reducer (`complete`, `uncomplete`, `recordQuiz`, `toggleBookmark`, `saveNote`, `submitAssignment`, `visit`, `import`, `reset`). A `useEffect` persists to storage after each change. Derived values (streak, % per path, skill scores, weekly activity) are pure functions in `selectors.ts`, so they are easy to test.

**Streak** = number of consecutive calendar days, ending today or yesterday, with at least one learning activity.

**Skill score** per module skill = 70% lesson completion + 30% average best quiz score.

## 6. Reusable components (stage 1)

| Component | Purpose |
|---|---|
| `AppLayout` | Sidebar + topbar + content, responsive drawer on mobile |
| `Sidebar` | Navigation, both paths with per-path progress |
| `Topbar` | Search box (jumps to search page), theme toggle, menu button |
| `Card`, `StatCard` | Surface and KPI tile |
| `ProgressBar`, `ProgressRing` | Linear and circular progress indicators |
| `Badge` | Status chips (Completed, In progress, Coming soon, levels) |
| `Button` | Primary / secondary / ghost variants |
| `EmptyState` | Friendly message when a list is empty |
| Charts | `ProgressDoughnut`, `ActivityBar` (last 14 days), `SkillsRadar` |

## 7. Build stages

1. **Architecture + scaffold + dashboard** (this stage): layout, theme, store, search, bookmarks, notes, dashboard, curriculum outline for both paths, lesson engine with first sample lessons.
2. **Lesson engine + Data Analyst content**: full lesson components, quizzes, exercises, SQL practice area with sample datasets, assignments; write modules one by one.
3. **Business Analyst content**: write modules one by one; diagrams for UML/BPMN.
4. **Projects + Interview preparation**: six projects with briefs, datasets and rubrics; interview banks with levels and mock interview mode.
5. **Polish**: accessibility pass, keyboard shortcuts, export/import, tests for selectors.

## 8. Running it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static files in dist/
```

## 9. Content status (kept honest)

| Path | Lessons planned | Lessons written |
|---|---|---|
| Data Analyst | 58 | 1 (`da-01-01` What is data analytics?) |
| Business Analyst | 53 | 1 (`ba-01-01` What is business analysis?) |

Update this table whenever lessons are added.
