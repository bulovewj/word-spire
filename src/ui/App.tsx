import { useState } from 'react'
import { checkContent, passages } from '../content'
import { judgeQuestion, type QuestionResult } from '../engine/judge'
import PassagePanel from './components/PassagePanel'
import QuestionPanel from './components/QuestionPanel'

export const GAME_TITLE = '낱말탑'

const contentErrors = checkContent()
const GRADE_LABEL = { hit: '정타', weak: '약타', miss: '실패' } as const

function resultText(r: QuestionResult): string {
  const penalty = r.enemyAttackBonus > 0 ? ` + 다음 적 공격 +${r.enemyAttackBonus}` : ''
  const hint = r.freeHint ? ' (다음 단서 보기 공짜)' : ''
  return `${GRADE_LABEL[r.grade]} ${r.damage}${penalty}${hint}`
}

export default function App() {
  const [selected, setSelected] = useState<number[]>([])
  const [qIndex, setQIndex] = useState(0)
  const [fogCleared, setFogCleared] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const passage = passages[0]

  if (contentErrors.length > 0 || !passage) {
    return (
      <main style={{ padding: 16 }}>
        <h1>데이터 오류</h1>
        <ul>{contentErrors.map((e) => <li key={e}>{e}</li>)}</ul>
      </main>
    )
  }

  const question = passage.questions[qIndex]
  const ctx = { shield: !fogCleared && passage.lockedWords.length > 0, retry: false }
  const toggle = (i: number) =>
    setSelected((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]))
  const pick = (i: number) => { setQIndex(i); setSelected([]); setResult(null) }

  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: 16, display: 'grid', gap: 12 }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, margin: 0 }}>{GAME_TITLE}</h1>
      <PassagePanel
        title={passage.title}
        sentences={passage.sentences}
        fog={fogCleared ? [] : passage.lockedWords}
        selected={selected}
        onToggle={toggle}
      />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {passage.questions.map((q, i) => (
          <button key={q.id} type="button" onClick={() => pick(i)} aria-pressed={i === qIndex}>
            {q.id}
          </button>
        ))}
        <label>
          <input type="checkbox" checked={fogCleared} onChange={(e) => setFogCleared(e.target.checked)} />
          안개 걷음
        </label>
      </div>
      {question && (
        <QuestionPanel
          key={question.id}
          question={question}
          order={question.options.map((_, i) => i)}
          evidence={selected}
          ctx={ctx}
          onSubmit={(a) => setResult(resultText(judgeQuestion(question, a, ctx)))}
        />
      )}
      {result && <p role="status" style={{ fontSize: 20, margin: 0 }}>{result}</p>}
    </main>
  )
}
