export type PathId = 'data-analyst' | 'business-analyst'
export type Level = 'beginner' | 'intermediate' | 'advanced'

export interface LessonMeta {
  id: string
  title: string
  minutes: number
}

export interface Module {
  id: string
  title: string
  summary: string
  skill: string
  prerequisites: string[]
  lessons: LessonMeta[]
}

export interface LearningPath {
  id: PathId
  title: string
  tagline: string
  description: string
  color: string
  modules: Module[]
}

export interface Term {
  term: string
  definition: string
}

export interface Exercise {
  question: string
  answer: string
  hint?: string
}

export interface QuizQuestion {
  question: string
  options: string[]
  answer: number
  explanation: string
}

export interface InterviewQuestion {
  question: string
  level: Level
  answer: string
}

export interface Assignment {
  id: string
  title: string
  brief: string
  deliverables?: string[]
}

/** Structured half of a lesson (from the .json file). */
export interface LessonData {
  id: string
  objectives: string[]
  terminology: Term[]
  exercises: Exercise[]
  quiz: QuizQuestion[]
  interview: InterviewQuestion[]
  assignment?: Assignment
}

/** A markdown section split out of the .md file by its `##` heading. */
export interface LessonSection {
  heading: string
  body: string
}

export interface LessonContent extends LessonData {
  sections: LessonSection[]
}

/** A lesson with its position in the curriculum. */
export interface LessonRef extends LessonMeta {
  pathId: PathId
  moduleId: string
  moduleTitle: string
  skill: string
  index: number // position in the whole path
  available: boolean
}
