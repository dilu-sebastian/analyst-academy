import { useEffect, type ReactNode } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import { Badge, Button, Card, EmptyState, Icon, cx } from '@/components/ui'
import { Markdown } from '@/components/lesson/Markdown'
import { QuizBlock } from '@/components/lesson/QuizBlock'
import { AssignmentBlock, ExerciseBlock, InterviewBlock, NotesPanel, TermList } from '@/components/lesson/Blocks'
import { useProgress } from '@/store/ProgressContext'
import { getLesson, getLessonRef, getPath, neighbours } from '@/content/loader'

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

function Section({ id, title, icon, children }: { id: string; title: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-slate-900 dark:text-white">
        {icon}
        {title}
      </h2>
      {children}
    </section>
  )
}

export function LessonPage() {
  const { lessonId = '' } = useParams()
  const { hash } = useLocation()
  const { state, dispatch } = useProgress()
  const ref = getLessonRef(lessonId)
  const lesson = getLesson(lessonId)

  useEffect(() => {
    if (lesson) dispatch({ type: 'visit', lessonId })
  }, [lessonId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (hash) setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }), 50)
  }, [hash, lessonId])

  if (!ref) return <Navigate to="/" replace />
  const path = getPath(ref.pathId)!
  const { prev, next } = neighbours(lessonId)
  const done = !!state.completed[lessonId]
  const bookmarked = state.bookmarks.includes(lessonId)

  const nav = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      {prev ? (
        <Link to={`/lesson/${prev.id}`} className="group flex max-w-[48%] items-center gap-2 text-sm text-slate-600 hover:text-brand-600 dark:text-slate-300">
          <Icon name="arrowLeft" className="h-4 w-4 shrink-0" />
          <span className="truncate">
            <span className="block text-xs text-slate-400">Previous</span>
            {prev.title}
          </span>
        </Link>
      ) : (
        <span />
      )}
      {next && (
        <Link to={`/lesson/${next.id}`} className="group ml-auto flex max-w-[48%] items-center gap-2 text-right text-sm text-slate-600 hover:text-brand-600 dark:text-slate-300">
          <span className="truncate">
            <span className="block text-xs text-slate-400">Next{!next.available && ' (coming soon)'}</span>
            {next.title}
          </span>
          <Icon name="arrowRight" className="h-4 w-4 shrink-0" />
        </Link>
      )}
    </div>
  )

  const header = (
    <div className="mb-6">
      <nav className="mb-3 flex flex-wrap items-center gap-1 text-sm text-slate-500" aria-label="Breadcrumb">
        <Link to={`/paths/${path.id}`} className="hover:text-brand-600">
          {path.title}
        </Link>
        <Icon name="chevronRight" className="h-3.5 w-3.5" />
        <span>{ref.moduleTitle}</span>
      </nav>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">{ref.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge>
              <Icon name="clock" className="h-3 w-3" /> {ref.minutes} min
            </Badge>
            <Badge tone="brand">{ref.skill}</Badge>
            {done && <Badge tone="green">Completed</Badge>}
            {!lesson && <Badge tone="amber">Coming soon</Badge>}
          </div>
        </div>
        {lesson && (
          <Button variant="secondary" icon="bookmark" onClick={() => dispatch({ type: 'toggleBookmark', lessonId })} aria-pressed={bookmarked}>
            {bookmarked ? 'Bookmarked' : 'Bookmark'}
          </Button>
        )}
      </div>
    </div>
  )

  if (!lesson) {
    return (
      <div className="mx-auto max-w-3xl">
        {header}
        <EmptyState icon="book" title="This lesson is not written yet">
          It is part of the planned curriculum and will be added module by module. Nothing here counts as complete until real content exists.
        </EmptyState>
        <div className="mt-8">{nav}</div>
      </div>
    )
  }

  const toc = [
    { id: 'objectives', title: 'Learning objectives' },
    ...lesson.sections.map((s) => ({ id: slug(s.heading), title: s.heading })),
    { id: 'terminology', title: 'Key terminology' },
    { id: 'exercises', title: 'Practice exercises' },
    { id: 'quiz', title: 'Quiz' },
    { id: 'interview', title: 'Interview questions' },
    ...(lesson.assignment ? [{ id: 'assignment', title: 'Assignment' }] : []),
    { id: 'notes', title: 'My notes' },
  ]

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_240px]">
      <article className="min-w-0">
        {header}
        <Card className="space-y-12 sm:p-8">
          {lesson.intro && <Markdown>{lesson.intro}</Markdown>}

          <Section id="objectives" title="Learning objectives">
            <ul className="space-y-2">
              {lesson.objectives.map((o) => (
                <li key={o} className="flex gap-2 text-slate-700 dark:text-slate-300">
                  <Icon name="target" className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
                  {o}
                </li>
              ))}
            </ul>
          </Section>

          {lesson.sections.map((s) => (
            <Section key={s.heading} id={slug(s.heading)} title={s.heading}>
              <Markdown>{s.body}</Markdown>
            </Section>
          ))}

          <Section id="terminology" title="Key terminology">
            <TermList terms={lesson.terminology} />
          </Section>

          <Section id="exercises" title="Practice exercises">
            <ExerciseBlock exercises={lesson.exercises} />
          </Section>

          <Section id="quiz" title="Quiz">
            <QuizBlock
              key={lessonId}
              questions={lesson.quiz}
              best={state.quizResults[lessonId]?.bestScore}
              onSubmit={(score, total) => dispatch({ type: 'recordQuiz', lessonId, score, total })}
            />
          </Section>

          <Section id="interview" title="Interview questions">
            <InterviewBlock questions={lesson.interview} />
          </Section>

          {lesson.assignment && (
            <Section id="assignment" title="Assignment">
              <AssignmentBlock
                key={lessonId}
                assignment={lesson.assignment}
                submission={state.assignments[lesson.assignment.id]}
                onSubmit={(text) =>
                  dispatch({ type: 'submitAssignment', assignmentId: lesson.assignment!.id, lessonId, label: lesson.assignment!.title, text })
                }
              />
            </Section>
          )}

          <Section id="notes" title="My notes">
            <NotesPanel key={lessonId} value={state.notes[lessonId]?.text ?? ''} onSave={(text) => dispatch({ type: 'saveNote', lessonId, text })} />
          </Section>

          <div className={cx('flex flex-wrap items-center justify-between gap-4 rounded-xl p-5', done ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-slate-50 dark:bg-slate-800/60')}>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">{done ? 'Lesson completed' : 'Finished this lesson?'}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {done ? `Completed on ${new Date(state.completed[lessonId]).toLocaleDateString()}` : 'Mark it complete to update your progress and skills.'}
              </p>
            </div>
            {done ? (
              <Button variant="ghost" onClick={() => dispatch({ type: 'uncomplete', lessonId })}>
                Mark as not complete
              </Button>
            ) : (
              <Button icon="check" onClick={() => dispatch({ type: 'complete', lessonId })}>
                Mark lesson complete
              </Button>
            )}
          </div>
        </Card>
        <div className="mt-6">{nav}</div>
      </article>

      <aside className="hidden xl:block">
        <div className="sticky top-24">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">On this page</p>
          <ul className="space-y-1 border-l border-slate-200 text-sm dark:border-slate-800">
            {toc.map((t) => (
              <li key={t.id}>
                <a href={`#/lesson/${lessonId}#${t.id}`} onClick={(e) => { e.preventDefault(); document.getElementById(t.id)?.scrollIntoView({ behavior: 'smooth' }) }} className="-ml-px block border-l border-transparent py-1 pl-3 text-slate-500 hover:border-brand-500 hover:text-slate-900 dark:hover:text-white">
                  {t.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  )
}
