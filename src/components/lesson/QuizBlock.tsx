import { useState } from 'react'
import type { QuizQuestion } from '@/types/content'
import { Button, Icon, cx } from '@/components/ui'

/** Multiple-choice quiz: answer all, submit, see score and an explanation for every question. */
export function QuizBlock({ questions, best, onSubmit }: { questions: QuizQuestion[]; best?: number; onSubmit: (score: number, total: number) => void }) {
  const [answers, setAnswers] = useState<(number | null)[]>(() => questions.map(() => null))
  const [submitted, setSubmitted] = useState(false)

  const score = answers.filter((a, i) => a === questions[i].answer).length
  const allAnswered = answers.every((a) => a !== null)

  const submit = () => {
    setSubmitted(true)
    onSubmit(score, questions.length)
  }
  const retry = () => {
    setAnswers(questions.map(() => null))
    setSubmitted(false)
  }

  return (
    <div className="space-y-5">
      {best != null && !submitted && <p className="text-sm text-slate-500">Your best score so far: {best}%</p>}
      {questions.map((q, qi) => (
        <fieldset key={qi} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
          <legend className="px-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
            {qi + 1}. {q.question}
          </legend>
          <div className="mt-2 space-y-2">
            {q.options.map((opt, oi) => {
              const chosen = answers[qi] === oi
              const correct = q.answer === oi
              return (
                <label
                  key={oi}
                  className={cx(
                    'flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2 text-sm transition',
                    !submitted && (chosen ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30' : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800'),
                    submitted && correct && 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20',
                    submitted && chosen && !correct && 'border-rose-500 bg-rose-50 dark:bg-rose-900/20',
                    submitted && !chosen && !correct && 'border-slate-200 opacity-70 dark:border-slate-700',
                  )}
                >
                  <input
                    type="radio"
                    name={`q${qi}`}
                    checked={chosen}
                    disabled={submitted}
                    onChange={() => setAnswers((a) => a.map((x, i) => (i === qi ? oi : x)))}
                    className="mt-0.5 accent-brand-600"
                  />
                  <span className="flex-1">{opt}</span>
                  {submitted && correct && <Icon name="check" className="h-4 w-4 text-emerald-600" />}
                  {submitted && chosen && !correct && <Icon name="x" className="h-4 w-4 text-rose-600" />}
                </label>
              )
            })}
          </div>
          {submitted && (
            <p className={cx('mt-3 rounded-lg p-3 text-sm', answers[qi] === q.answer ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200' : 'bg-amber-50 text-amber-900 dark:bg-amber-900/20 dark:text-amber-200')}>
              <strong>{answers[qi] === q.answer ? 'Correct. ' : 'Not quite. '}</strong>
              {q.explanation}
            </p>
          )}
        </fieldset>
      ))}
      <div className="flex flex-wrap items-center gap-3">
        {!submitted ? (
          <Button onClick={submit} disabled={!allAnswered} icon="target">
            Submit quiz
          </Button>
        ) : (
          <>
            <p className="text-lg font-semibold text-slate-900 dark:text-white">
              Score: {score}/{questions.length} ({Math.round((score / questions.length) * 100)}%)
            </p>
            <Button variant="secondary" onClick={retry}>
              Try again
            </Button>
          </>
        )}
        {!submitted && !allAnswered && <span className="text-sm text-slate-500">Answer every question to submit.</span>}
      </div>
    </div>
  )
}
