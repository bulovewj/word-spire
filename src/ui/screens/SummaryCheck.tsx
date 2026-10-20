import { useState } from 'react'
import { passages } from '../../content'
import { embedder } from '../../grading/embedder'
import { POLICY } from '../../grading/policy'
import { gradeSummary, gradeSummarySimple, type SummaryGrade } from '../../grading/summary'
import { useEmbedderStatus } from '../useEmbedderStatus'
import { fmt, splitLines } from './checkUtil'

// 채점 점검: 요약 (작업지시서 F10, M6). own 분포를 보고 summaryOwnMin을 정한다.

interface Row { answer: string; grade: SummaryGrade }

export default function SummaryCheck() {
  const status = useEmbedderStatus()
  const [passageId, setPassageId] = useState(passages[0]?.id ?? '')
  const [text, setText] = useState('')
  const [rows, setRows] = useState<Row[]>([])
  const [busy, setBusy] = useState(false)
  const passage = passages.find((p) => p.id === passageId)

  const run = async () => {
    if (!passage) return
    setBusy(true)
    const out: Row[] = []
    for (const answer of splitLines(text)) {
      const grade = status.state === 'ready'
        ? await gradeSummary(answer, passage.summary, (a, r) => embedder.similarities(a, r))
        : gradeSummarySimple(answer, passage.summary)
      out.push({ answer, grade })
    }
    setRows(out)
    setBusy(false)
  }

  return (
    <section className="gcheck-body">
      <p>글을 고르고 학생 요약을 한 줄에 하나씩 붙여 넣으세요. 지금 기준 own ≥ {POLICY.summaryOwnMin}</p>
      <label>
        글{' '}
        <select value={passageId} onChange={(e) => { setPassageId(e.target.value); setRows([]) }}>
          {passages.map((p) => <option key={p.id} value={p.id}>{p.floor}층 {p.title} ({p.id})</option>)}
        </select>
      </label>
      {passage && (
        <details className="gmeaning">
          <summary>모범 요약·핵심 개념·오답 앵커</summary>
          <ul>{passage.summary.models.map((m) => <li key={m}>{m}</li>)}</ul>
          <p>핵심 개념({passage.summary.minConcepts}개 이상): {passage.summary.concepts.map((c, i) =>
            `${passage.summary.conceptLabels[i]} [${c.join(', ')}]`).join(' · ')}</p>
          <p>오답 앵커: {passage.summary.rejects.join(' / ')}</p>
        </details>
      )}
      <textarea rows={10} value={text} onChange={(e) => setText(e.target.value)}
        placeholder={'꿀벌이 줄어들면 과일과 채소도 줄어서 밥상이 위험해진다\n꿀벌은 꽃가루를 옮긴다'} />
      <button type="button" onClick={() => void run()} disabled={busy}>{busy ? '채점 중…' : '채점'}</button>
      {rows.length > 0 && (
        <table>
          <thead>
            <tr><th>요약</th><th>방식</th><th>own</th><th>reject</th><th>빠진 개념</th><th>판정</th><th>이유</th></tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className={r.grade.pass ? 'pass' : 'fail'}>
                <td>{r.answer}</td><td>{r.grade.mode}</td>
                <td>{fmt(r.grade.own)}</td><td>{fmt(r.grade.reject)}</td><td>{r.grade.missing.join(', ')}</td>
                <td>{r.grade.pass ? '통과' : '실패'}</td><td>{r.grade.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
