# Analyst Academy

A personal learning platform for becoming a job-ready **Data Analyst** or **Business Analyst**.

It runs entirely in the browser: no backend, no account, no login. Your progress, notes, bookmarks and quiz scores are saved in your browser's `localStorage` and can be exported and imported as JSON.

> **Status: Stage 1 of 5.** The app shell, dashboard, progress tracking and lesson engine work. The full curriculum is outlined, but only **6 of 111 lessons** have content so far. See [Content status](#content-status).

---

## Features

**Working now (Stage 1)**

- Two learning paths, each with 12 modules: **Data Analyst** (58 lessons) and **Business Analyst** (53 lessons)
- Dashboard with overall progress, current streak, recent activity, a 14-day activity chart and a skills radar
- Path pages showing modules, prerequisites and per-lesson status (Completed, In progress, Coming soon)
- Lesson engine with a fixed teaching structure: objectives, explanation, real-world examples, terminology, step-by-step demo, practical example, common mistakes, exercises with reveal-able answers, a scored quiz with explanations, interview questions, and an optional assignment
- Mark lessons complete, bookmark lessons, and keep per-lesson notes
- Full-text search across lesson content and terminology
- Light, dark and system theme
- Settings page to export, import or reset your progress
- Lessons without content show as **Coming soon** instead of pretending to be finished

**Planned** (see [Roadmap](#roadmap)): SQL playground, projects, interview prep with mock interviews, and the rest of the lesson content. The SQL, Projects and Interview pages currently show placeholders.

## Tech stack

| Area | Choice |
|---|---|
| Build | [Vite 5](https://vitejs.dev/) |
| UI | React 18 + TypeScript (strict) |
| Styling | Tailwind CSS 3 + `@tailwindcss/typography`, class-based dark mode |
| Routing | React Router 6 (hash router, so the build works from any static host) |
| Charts | Chart.js 4 via `react-chartjs-2` |
| Lesson content | Markdown via `react-markdown` + `remark-gfm` |
| SQL practice | `sql.js` (SQLite compiled to WebAssembly), wired up in Stage 2 |
| Storage | Browser `localStorage`, versioned (`analyst-academy:v1`) |
| Linting | ESLint 9 + `typescript-eslint` |

## Getting started

You need [Node.js](https://nodejs.org/) 18 or newer (tested with Node 22 on Windows 11).

```bash
git clone https://github.com/dilu-sebastian/analyst-academy.git
cd analyst-academy
npm install
npm run dev
```

Then open http://localhost:5180.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server with hot reload at http://localhost:5180 |
| `npm run build` | Type-check with `tsc -b`, then build a static site into `dist/` |
| `npm run preview` | Serve the built `dist/` folder at http://localhost:5181 to check the production build |
| `npm run lint` | Run ESLint over the project |
| `npm run validate` | Check every written lesson (sections, quiz answers, ids) and print the content count |
| `npm run datasets` | Regenerate the SQL sample datasets (deterministic) |

The production build uses relative paths (`base: './'`) and a hash router, so `dist/` can be dropped onto any static host (GitHub Pages, Netlify, Cloudflare Pages) without extra config.

## Folder structure

```
analyst-academy/
├─ docs/ARCHITECTURE.md      design notes, content and state model
├─ public/                   static assets (favicon, sql-wasm.wasm)
└─ src/
   ├─ main.tsx               entry: providers + router
   ├─ App.tsx                route table
   ├─ index.css              Tailwind layers and design tokens
   ├─ types/                 shared TypeScript types (content, progress)
   ├─ content/               ALL learning content
   │  ├─ curriculum/         one JSON per path: modules, prerequisites, lesson list
   │  ├─ lessons/            <path>/<module>/<lesson-id>.md + .json
   │  └─ loader.ts           the only module that knows where content lives
   ├─ store/                 progress reducer + context, theme, derived selectors
   ├─ services/storage.ts    versioned load / save / export / import
   ├─ components/
   │  ├─ layout/             AppLayout, Sidebar
   │  ├─ ui/                 Card, Button, Badge, ProgressBar, ProgressRing, ...
   │  ├─ charts/             ProgressDoughnut, ActivityBar, SkillsRadar
   │  └─ lesson/             Markdown, QuizBlock, lesson section blocks
   ├─ features/              one folder per page
   │  ├─ dashboard/          DashboardPage
   │  ├─ paths/              PathsPage, PathDetailPage
   │  ├─ lesson/             LessonPage
   │  └─ personal/           Search, Bookmarks, Notes, Settings, placeholder pages
   └─ utils/                 date helpers
```

For the full design rationale, the content model and the state model, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## How to add a lesson

Content is data, not code. A lesson is two files with the same id.

1. **Find the lesson id** in `src/content/curriculum/<path>.json`, for example `da-01-02` in `data-analyst.json`.

2. **Write the teaching text** in `src/content/lessons/<path>/<module>/<id>.md`, for example `src/content/lessons/data-analyst/da-01/da-01-02.md`. Use these `##` headings; the engine splits the file on them:

   ```markdown
   ## Explanation
   ## Real-world examples
   ## Step-by-step demonstration
   ## Practical example
   ## Common mistakes
   ```

   Anything above the first `##` heading becomes the lesson intro.

3. **Write the structured parts** in `<id>.json` next to the Markdown file:

   ```jsonc
   {
     "id": "da-01-02",
     "objectives":  ["..."],
     "terminology": [{ "term": "...", "definition": "..." }],
     "exercises":   [{ "question": "...", "answer": "..." }],
     "quiz":        [{ "question": "...", "options": ["a", "b", "c", "d"], "answer": 1, "explanation": "..." }],
     "interview":   [{ "question": "...", "level": "beginner", "answer": "..." }],
     "assignment":  { "title": "...", "brief": "..." }
   }
   ```

   `answer` in a quiz item is the zero-based index of the correct option. `assignment` is optional.

4. **That's it.** Files are discovered at build time with `import.meta.glob`, so the lesson switches from "Coming soon" to available on the next reload. Use `da-01-01` and `ba-01-01` as reference examples.

5. Update the [Content status](#content-status) table below and in `docs/ARCHITECTURE.md`.

To add a brand-new lesson to the outline, first add `{ "id", "title", "minutes" }` to the right module in the curriculum JSON.

## Content status

The curriculum outline is complete; the written content is not.

| Path | Modules | Lessons planned | Lessons written |
|---|---|---|---|
| Data Analyst | 12 | 58 | 2 (`da-01-01`, `da-01-02`) |
| Business Analyst | 12 | 53 | 4 (all of module 1, `ba-01-01` to `ba-01-04`) |
| **Total** | **24** | **111** | **6** |

**Data Analyst modules:** Introduction to Data Analytics, Excel Fundamentals, Advanced Excel, SQL Fundamentals, Advanced SQL, Data Cleaning, Statistics, Power BI, Python Fundamentals, Python for Data Analysis, Real-world Projects, Interview Preparation.

**Business Analyst modules:** Business Analysis Fundamentals, Business Requirements, Requirement Gathering, BRD/FRD/SRS, UML and Process Flow Diagrams, BPMN, User Stories and Acceptance Criteria, Agile and Scrum, Jira and Confluence, Stakeholder Management, Real-world Case Studies, Interview Preparation.

## Roadmap

1. **Architecture, scaffold and dashboard** ✅ *(done)*: layout, theme, progress store, search, bookmarks, notes, dashboard, full curriculum outline, lesson engine with two sample lessons.
2. **Data Analyst content + SQL playground**: write the Data Analyst modules one by one, and add an in-browser SQL practice area on sample datasets using `sql.js`.
3. **Business Analyst content**: write the Business Analyst modules, with UML and BPMN diagrams.
4. **Projects and interview preparation**: six portfolio projects with briefs, datasets and rubrics; interview question banks by level, with a mock interview mode.
5. **Polish**: accessibility pass, keyboard shortcuts, tests for the selectors, code-splitting the bundle.

## Known issues

- The production JS bundle is about 600 kB (200 kB gzipped), which triggers Vite's chunk size warning. Code-splitting is planned for Stage 5.
- ESLint reports 4 `react-refresh/only-export-components` warnings. They only affect hot reload, not the app.
- Progress lives in one browser. Use **Settings → Export progress** to back it up or move it to another device.

## License

Private project. All rights reserved.
