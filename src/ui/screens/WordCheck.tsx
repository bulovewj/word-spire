import { useState } from 'react'
import { compareWords, passages, wordPacks } from '../../content'
import type { WordEntry } from '../../content/types'
import { embedder } from '../../grading/embedder'
import { gradeWord, gradeWordSimple, type WordGrade } from '../../grading/word'
import { useEmbedderStatus } from '../useEmbedderStatus'
import { fmt, splitLines } from './checkUtil'

// 채점 점검: 낱말 뜻 (작업지시서 F10)

interface Row { answer: string; grade: WordGrade }

const towerOf = (w: WordEntry) =>
  passages.find((p) => p.lockedWords.some((lw) => lw.card.id === w.id))?.towerId ?? passages[0]?.towerId ?? ''
const allWords: WordEntry[] = [...Object.values(wordPacks).flat(), ...passages.flatMap((p) => p.lockedWords.map((lw) => lw.card))]

export default function WordCheck() {
  const status = useEmbedderStatus()
  const [wordId, setWordId] = useState(allWords[0]?.id ?? '')
  const [text, setText] = useState('')
  const [rows, setRows] = useState<Row[]>([])
  const [busy, setBusy] = useState(false)
  const entry = allWords.find((w) => w.id === wordId)

  const run = async () => {
    if (!entry) return
    setBusy(true)
    const answers = splitLines(text)
    const out: Row[] = []
    for (const answer of answers) {
      const grade = status.state === 'ready'
        ? await gradeWord(answer, entry, compareWords(entry.id, towerOf(entry)), (a, r) => embedder.similarities(a, r))
        : gradeWordSimple(answer, entry)
      out.push({ answer, grade })
    }
    setRows(out)
    setBusy(false)
  }

  return (
    <section className="gcheck-body">
      <p>낱말을 고르고 학생 답을 한 줄에 하나씩 붙여 넣으세요.</p>
      <label>
        낱말{' '}
        <select value={wordId} onChange={(e) => { setWordId(e.target.value); setRows([]) }}>
          {allWords.map((w) => <option key={w.id} value={w.id}>{w.word} ({w.id})</option>)}
        </select>
      </label>
      {entry && <p className="gmeaning">뜻: {entry.meaning} · 반대 앵커: {entry.rejects.join(' / ')}</p>}
      <textarea rows={8} value={text} onChange={(e) => setText(e.target.value)} placeholder={'친구가 많다\n발이 크다\n모르겠어요'} />
      <button type="button" onClick={() => void run()} disabled={busy}>{busy ? '채점 중…' : '채점'}</button>
      {rows.length > 0 && (
        <table>
          <thead>
            <tr><th>답</th><th>방식</th><th>own</th><th>other</th><th>reject</th><th>판정</th><th>이유</th></tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className={r.grade.pass ? 'pass' : 'fail'}>
                <td>{r.answer}</td><td>{r.grade.mode}</td>
                <td>{fmt(r.grade.own)}</td><td>{fmt(r.grade.other)}</td><td>{fmt(r.grade.reject)}</td>
                <td>{r.grade.pass ? '통과' : '실패'}</td><td>{r.grade.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
