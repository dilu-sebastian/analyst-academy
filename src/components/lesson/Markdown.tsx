import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { SqlRunner } from '@/components/sql/SqlRunner'
import type { DatasetId } from '@/content/datasets'

type HastNode = { type: string; value?: string; tagName?: string; properties?: { className?: string[] }; children?: HastNode[] }
const text = (n: HastNode): string => (n.type === 'text' ? n.value ?? '' : (n.children ?? []).map(text).join(''))

/**
 * A fenced block with the language `sqlrun` becomes an interactive SQL runner.
 * An optional first line `-- dataset: hr` picks the database (default: retail).
 */
const components: Components = {
  pre({ node, children, ...rest }) {
    const code = (node as HastNode | undefined)?.children?.find((c) => c.tagName === 'code')
    if (code?.properties?.className?.includes('language-sqlrun')) {
      let sql = text(code).replace(/\n$/, '')
      let dataset: DatasetId = 'retail'
      const m = sql.match(/^--\s*dataset:\s*(retail|hr|inventory)\s*\n/)
      if (m) {
        dataset = m[1] as DatasetId
        sql = sql.slice(m[0].length)
      }
      return (
        <div className="my-5">
          <SqlRunner dataset={dataset} initialSql={sql} compact />
        </div>
      )
    }
    return <pre {...rest}>{children}</pre>
  },
}

export function Markdown({ children }: { children: string }) {
  return (
    <div className="lesson-prose">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  )
}
