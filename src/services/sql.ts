import type { Database, SqlJsStatic } from 'sql.js'
import { getDataset, type DatasetId } from '@/content/datasets'

/**
 * Thin wrapper around sql.js (SQLite compiled to WebAssembly).
 * The engine and each dataset are loaded once, then every runner gets its own
 * fresh copy of the database so a DELETE in one place never affects another.
 */
let enginePromise: Promise<SqlJsStatic> | null = null
const seeded = new Map<DatasetId, Promise<Uint8Array>>()

function engine() {
  if (!enginePromise) {
    enginePromise = import('sql.js').then((m) => {
      const init = (m as unknown as { default: typeof m.default }).default ?? m
      return init({ locateFile: () => `${import.meta.env.BASE_URL}sql-wasm.wasm` })
    })
    enginePromise.catch(() => (enginePromise = null))
  }
  return enginePromise
}

function seedBytes(id: DatasetId) {
  let p = seeded.get(id)
  if (!p) {
    p = Promise.all([engine(), getDataset(id).load()]).then(([SQL, script]) => {
      const db = new SQL.Database()
      db.run(script)
      const bytes = db.export()
      db.close()
      return bytes
    })
    p.catch(() => seeded.delete(id))
    seeded.set(id, p)
  }
  return p
}

export async function openDatabase(id: DatasetId): Promise<Database> {
  const [SQL, bytes] = await Promise.all([engine(), seedBytes(id)])
  return new SQL.Database(bytes)
}

export interface QueryResult {
  columns: string[]
  rows: (string | number | null)[][]
}

export interface RunOutcome {
  results: QueryResult[]
  changes: number
  ms: number
}

export function runSql(db: Database, sql: string): RunOutcome {
  const t = performance.now()
  const res = db.exec(sql)
  return {
    results: res.map((r) => ({ columns: r.columns, rows: r.values as (string | number | null)[][] })),
    changes: db.getRowsModified(),
    ms: Math.round(performance.now() - t),
  }
}

export interface TableInfo {
  name: string
  rows: number
  columns: { name: string; type: string; pk: boolean }[]
}

export function describe(db: Database): TableInfo[] {
  const names = db.exec("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY rowid")[0]?.values ?? []
  return names.map(([n]) => {
    const name = String(n)
    const cols = db.exec(`PRAGMA table_info("${name}")`)[0]?.values ?? []
    const rows = Number(db.exec(`SELECT COUNT(*) FROM "${name}"`)[0]?.values[0][0] ?? 0)
    return { name, rows, columns: cols.map((c) => ({ name: String(c[1]), type: String(c[2] || 'ANY'), pk: Number(c[5]) > 0 })) }
  })
}

/** Normalise a result for answer checking: round numbers, optionally ignore row order. */
function normalise(r: QueryResult | undefined, ordered: boolean) {
  if (!r) return { width: 0, rows: [] as string[] }
  const rows = r.rows.map((row) => row.map((v) => (typeof v === 'number' ? (Math.round(v * 100) / 100).toString() : v === null ? '∅' : String(v))).join('␟'))
  return { width: r.columns.length, rows: ordered ? rows : [...rows].sort() }
}

export function sameResult(actual: QueryResult | undefined, expected: QueryResult | undefined, ordered: boolean) {
  const a = normalise(actual, ordered)
  const e = normalise(expected, ordered)
  if (a.width !== e.width) return { ok: false, reason: `Your result has ${a.width} column(s); the expected result has ${e.width}.` }
  if (a.rows.length !== e.rows.length) return { ok: false, reason: `Your result has ${a.rows.length} row(s); the expected result has ${e.rows.length}.` }
  for (let i = 0; i < a.rows.length; i++) {
    if (a.rows[i] !== e.rows[i]) return { ok: false, reason: ordered ? `Row ${i + 1} differs from the expected result (check the values and the sort order).` : 'Some values differ from the expected result.' }
  }
  return { ok: true, reason: '' }
}
