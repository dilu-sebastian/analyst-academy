// Checks every written lesson: valid JSON, matching curriculum id, required Markdown
// sections, quiz answer indexes in range, and non-empty parts. Run: npm run validate
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'content')
const REQUIRED = ['Explanation', 'Real-world examples', 'Step-by-step demonstration', 'Practical example', 'Common mistakes']
let problems = 0
const fail = (id, msg) => { problems++; console.error(`  ✗ ${id}: ${msg}`) }

const planned = new Map()
for (const f of ['data-analyst', 'business-analyst']) {
  const path = JSON.parse(readFileSync(join(root, 'curriculum', `${f}.json`), 'utf8'))
  for (const m of path.modules) for (const l of m.lessons) planned.set(l.id, { path: f, module: m.id })
}

const counts = { 'data-analyst': 0, 'business-analyst': 0 }
for (const [id, { path, module }] of planned) {
  const dir = join(root, 'lessons', path, module)
  const md = join(dir, `${id}.md`), js = join(dir, `${id}.json`)
  if (!existsSync(md) && !existsSync(js)) continue
  if (!existsSync(md) || !existsSync(js)) { fail(id, 'needs both .md and .json'); continue }
  counts[path]++
  const text = readFileSync(md, 'utf8')
  const headings = [...text.matchAll(/^## +(.+)$/gm)].map((m) => m[1].trim())
  for (const h of REQUIRED) if (!headings.includes(h)) fail(id, `missing "## ${h}"`)
  if (/(TODO|TBD|lorem ipsum|placeholder)/i.test(text)) fail(id, 'contains placeholder text')
  let d
  try { d = JSON.parse(readFileSync(js, 'utf8')) } catch (e) { fail(id, `invalid JSON: ${e.message}`); continue }
  if (d.id !== id) fail(id, `json id is "${d.id}"`)
  for (const k of ['objectives', 'terminology', 'exercises', 'quiz', 'interview']) if (!Array.isArray(d[k]) || !d[k].length) fail(id, `empty "${k}"`)
  if ((d.quiz ?? []).length < 5) fail(id, 'quiz needs at least 5 questions')
  for (const [i, q] of (d.quiz ?? []).entries()) {
    if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= (q.options ?? []).length) fail(id, `quiz ${i + 1}: answer index out of range`)
    if (!q.explanation) fail(id, `quiz ${i + 1}: missing explanation`)
  }
  if (d.assignment && d.assignment.id !== `asg-${id}`) fail(id, `assignment id should be asg-${id}`)
}
const total = { 'data-analyst': 0, 'business-analyst': 0 }
for (const { path } of planned.values()) total[path]++
console.log(`Data Analyst: ${counts['data-analyst']}/${total['data-analyst']} lessons written`)
console.log(`Business Analyst: ${counts['business-analyst']}/${total['business-analyst']} lessons written`)
if (problems) { console.error(`${problems} problem(s)`); process.exit(1) }
console.log('All written lessons are valid.')
