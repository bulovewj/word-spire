import { useState } from 'react'
import type { WordEntry } from '../../content/types'
import { BALANCE } from '../../engine/balance'
import { gradeWordAuto } from '../../grading/auto'
import { meterValue, type WordGrade } from '../../grading/word'
import { maskExample } from '../maskExample'
import './WordPanel.css'

interface Props {
  entry: WordEntry
  towerId: string
  onDone: (pass: boolean, answer: string) => void
  onCancel: () => void
}

/** 낱말 카드 (작업지시서 F4). 채점은 여기서 하고 결과만 엔진에 보낸다 */
export default function WordPanel({ entry, towerId, onDone, onCancel }: Props) {
  const [answer, setAnswer] = useState('')
  const [showExample, setShowExample] = useState(false)
  const [grading, setGrading] = useState(false)
  const [result, setResult] = useState<WordGrade | null>(null)

  const submit = async () => {
    if (grading || result || answer.trim() === '') return
    setGrading(true)
    setResult(await gradeWordAuto(answer, entry, towerId))
    setGrading(false)
  }

  if (result) {
    return (
      <section className={`wpanel ${result.pass ? 'is-pass' : 'is-fail'}`} aria-label="낱말 카드 결과">
        <h3>{entry.word}</h3>
        <p className="wresult" role="status">
          {result.pass ? `발동! 방어 +${BALANCE.wordCardBlock}` : `카드 실패 — ${result.reason}`}
        </p>
        <p className="wanswer">내 답: {answer}</p>
        {!result.pass && <p className="wmeaning">뜻: {entry.meaning}</p>}
        {result.mode !== 'precheck' && (
          <div className="meter" aria-label="뜻 가까움">
            <span className="meter-label">뜻 가까움{result.mode === 'simple' ? ' (간이 채점)' : ''}</span>
            <span className="meter-bar"><span style={{ width: `${Math.round(meterValue(result) * 100)}%` }} /></span>
          </div>
        )}
        <div className="row">
          <button type="button" autoFocus onClick={() => onDone(result.pass, answer)}>계속</button>
        </div>
      </section>
    )
  }

  return (
    <section className="wpanel" aria-label="낱말 카드">
      <h3>{entry.word}</h3>
      <label className="wlabel" htmlFor="word-answer">이 말의 뜻을 내 말로 써 봐.</label>
      <input
        id="word-answer"
        className="winput"
        value={answer}
        autoFocus
        autoComplete="off"
        disabled={grading}
        onChange={(e) => setAnswer(e.target.value)}
        onKeyDown={(e) => {
          // 한글 조합 중 엔터는 무시
          if (e.key === 'Enter' && !e.nativeEvent.isComposing) void submit()
        }}
      />
      {entry.example && (
        showExample
          ? <p className="wexample">예문: {maskExample(entry.example, entry.word)}</p>
          : <button type="button" className="link" onClick={() => setShowExample(true)}>예문 보기</button>
      )}
      <div className="row">
        <button type="button" onClick={onCancel} disabled={grading}>취소</button>
        <button type="button" onClick={() => void submit()} disabled={grading || answer.trim() === ''}>
          {grading ? '채점 중…' : '제출'}
        </button>
      </div>
    </section>
  )
}
