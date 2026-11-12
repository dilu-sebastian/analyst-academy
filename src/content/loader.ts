import daJson from './curriculum/data-analyst.json'
import baJson from './curriculum/business-analyst.json'
import type { LearningPath, LessonContent, LessonData, LessonRef, LessonSection, PathId } from '@/types/content'

/**
 * The only module that knows where content files live.
 * Lessons are discovered at build time: lessons/<path>/<module>/<lesson-id>.{md,json}
 */
const mdFiles = import.meta.glob('./lessons/**/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>
const jsonFiles = import.meta.glob('./lessons/**/*.json', { import: 'default', eager: true }) as Record<string, LessonData>

const fileId = (p: string) => p.split('/').pop()!.replace(/\.(md|json)$/, '')

const mdById = new Map(Object.entries(mdFiles).map(([p, v]) => [fileId(p), v]))
const dataById = new Map(Object.entries(jsonFiles).map(([p, v]) => [fileId(p), v]))

export const paths: LearningPath[] = [daJson as LearningPath, baJson as LearningPath]

export const getPath = (id: string) => paths.find((p) => p.id === id)

/** Flat, ordered list of every lesson in every path, with availability. */
export const allLessons: LessonRef[] = paths.flatMap((path) => {
  let index = 0
  return path.modules.flatMap((m) =>
    m.lessons.map((l) => ({
      ...l,
      pathId: path.id as PathId,
      moduleId: m.id,
      moduleTitle: m.title,
      skill: m.skill,
      index: index++,
      available: mdById.has(l.id) && dataById.has(l.id),
    })),
  )
})

const refById = new Map(allLessons.map((l) => [l.id, l]))
export const getLessonRef = (id: string) => refById.get(id)

export const lessonsInPath = (pathId: string) => allLessons.filter((l) => l.pathId === pathId)

/** Split a markdown file into sections by `## ` headings. */
function splitSections(md: string): { intro: string; sections: LessonSection[] } {
  const parts = md.split(/^## +/m)
  const intro = parts.shift()?.trim() ?? ''
  const sections = parts.map((p) => {
    const nl = p.indexOf('\n')
    return { heading: p.slice(0, nl).trim(), body: p.slice(nl + 1).trim() }
  })
  return { intro, sections }
}

export function getLesson(id: string): (LessonContent & { intro: string }) | null {
  const md = mdById.get(id)
  const data = dataById.get(id)
  if (!md || !data) return null
  const { intro, sections } = splitSections(md)
  return { ...data, intro, sections }
}

export function neighbours(id: string) {
  const ref = refById.get(id)
  if (!ref) return { prev: undefined, next: undefined }
  const list = lessonsInPath(ref.pathId)
  return { prev: list[ref.index - 1], next: list[ref.index + 1] }
}

/** Plain text of a lesson for search. */
export function lessonSearchText(id: string): string {
  const md = mdById.get(id) ?? ''
  const d = dataById.get(id)
  const terms = d?.terminology.map((t) => `${t.term} ${t.definition}`).join(' ') ?? ''
  return `${md} ${terms}`.replace(/[#*`|>_-]+/g, ' ')
}
