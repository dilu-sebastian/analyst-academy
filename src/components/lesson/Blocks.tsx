import { useState } from 'react'
import type { Assignment, Exercise, InterviewQuestion, Term } from '@/types/content'
import { Badge, Button, Icon, cx } from '@/components/ui'
import { Markdown } from './Markdown'

export function TermList({ terms }: { terms: Term[] }) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {terms.map((t) => (
        <div key={t.term} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
          <dt className="font-semibold text-slate-900 dark:text-white">{t.term}</dt>
          <dd className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t.definition}</dd>
        </div>
      ))}
    </dl>
  )
}

/** Question-and-answer exercise: write your own answer first, then compare with the model answer. */
export function ExerciseBlock({ exercises }: { exercises: Exercise[] }) {
  const [shown, setShown] = useState<Record<number, boolean>>({})
  const [drafts, setDrafts] = useState<Record<number, string>>({})
  return (
    <ol className="space-y-4">
      {exercises.map((e, i) => (
        <li key={i} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
          <p className="font-medium text-slate-800 dark:text-slate-100">
            Exercise {i + 1}: {e.question}
          </p>
          {e.hint && <p className="mt-1 text-sm text-slate-500">Hint: {e.hint}</p>}
          <textarea
            className="input mt-3 min-h-[80px]"
            placeholder="Write your answer here before revealing the model answer…"
            value={drafts[i] ?? ''}
            onChange={(ev) => setDrafts((d) => ({ ...d, [i]: ev.target.value }))}
          />
          <Button variant="secondary" className="mt-2" onClick={() => setShown((s) => ({ ...s, [i]: !s[i] }))}>
            {shown[i] ? 'Hide model answer' : 'Reveal model answer'}
          </Button>
          {shown[i] && (
            <div className="mt-3 rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60">
              <Markdown>{e.answer}</Markdown>
            </div>
          )}
        </li>
      ))}
    </ol>
  )
}

const levelTone = { beginner: 'green', intermediate: 'amber', advanced: 'rose' } as const

export function InterviewBlock({ questions }: { questions: InterviewQuestion[] }) {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <div className="space-y-2">
      {questions.map((q, i) => (
        <div key={i} className="rounded-xl border border-slate-200 dark:border-slate-700">
          <button className="flex w-full items-center gap-3 p-4 text-left focus-ring" onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i}>
            <Badge tone={levelTone[q.level]}>{q.level}</Badge>
            <span className="flex-1 text-sm font-medium text-slate-800 dark:text-slate-100">{q.question}</span>
            <Icon name="chevronDown" className={cx('h-4 w-4 text-slate-400 transition', open === i && 'rotate-180')} />
          </button>
          {open === i && (
            <div className="border-t border-slate-100 px-4 pb-4 pt-3 dark:border-slate-800">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Model answer</p>
              <Markdown>{q.answer}</Markdown>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export function AssignmentBlock({
  assignment,
  submission,
  onSubmit,
}: {
  assignment: Assignment
  submission?: { text: string; submittedAt: string }
  onSubmit: (text: string) => void
}) {
  const [text, setText] = useState(submission?.text ?? '')
  const [editing, setEditing] = useState(!submission)
  return (
    <div>
      <h3 className="font-semibold text-slate-900 dark:text-white">{assignment.title}</h3>
      <div className="mt-2">
        <Markdown>{assignment.brief}</Markdown>
      </div>
      {assignment.deliverables && (
        <ul className="mt-3 space-y-1 text-sm">
          {assignment.deliverables.map((d) => (
            <li key={d} className="flex gap-2">
              <Icon name="check" className="mt-0.5 h-4 w-4 text-brand-600" /> {d}
            </li>
          ))}
        </ul>
      )}
      {editing ? (
        <>
          <textarea className="input mt-4 min-h-[160px]" value={text} onChange={(e) => setText(e.target.value)} placeholder="Write or paste your submission here. It is saved in this browser." />
          <div className="mt-2 flex gap-2">
            <Button
              icon="upload"
              disabled={!text.trim()}
              onClick={() => {
                onSubmit(text)
                setEditing(false)
              }}
            >
              Submit assignment
            </Button>
            {submission && (
              <Button variant="ghost" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            )}
          </div>
        </>
      ) : (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-900/20">
          <p className="flex items-center gap-2 text-sm font-medium text-emerald-800 dark:text-emerald-200">
            <Icon name="checkCircle" className="h-4 w-4" /> Submitted {new Date(submission!.submittedAt).toLocaleString()}
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">{submission!.text}</p>
          <Button variant="secondary" className="mt-3" onClick={() => setEditing(true)}>
            Edit submission
          </Button>
        </div>
      )}
    </div>
  )
}

export function NotesPanel({ value, onSave }: { value: string; onSave: (t: string) => void }) {
  const [text, setText] = useState(value)
  const [saved, setSaved] = useState(true)
  return (
    <div>
      <textarea
        className="input min-h-[140px]"
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          setSaved(false)
        }}
        onBlur={() => {
          if (!saved) {
            onSave(text)
            setSaved(true)
          }
        }}
        placeholder="Your own notes for this lesson. Saved automatically when you click away."
        aria-label="Personal notes"
      />
      <div className="mt-2 flex items-center gap-3">
        <Button
          variant="secondary"
          onClick={() => {
            onSave(text)
            setSaved(true)
          }}
          disabled={saved}
        >
          Save notes
        </Button>
        <span className="text-xs text-slate-400">{saved ? 'All changes saved' : 'Unsaved changes'}</span>
      </div>
    </div>
  )
}
