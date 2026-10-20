import { useState } from 'react'
import type { SummarySpec } from '../../content/types'
import { gradeSummaryAuto } from '../../grading/auto'
import { POLICY } from '../../grading/policy'
import type { SummaryGrade } from '../../grading/summary'
import './WordPanel.css'

interface Props {
  spec: SummarySpec
  onDone: (pass: boolean, answer: string) => void
  onCancel: () => void
}

/** 요약 봉인 (작업지시서 F5). 본문은 계속 보인다. 채점은 여기서, 결과만 엔진에 */
export default function SummaryPanel({ spec, onDone, onCancel }: Props) {
  const [answer, setAnswer] = useState('')
  const [grading, setGrading] = useState(false)
  const [result, setResult] = useState<SummaryGrade | null>(null)
  const count = answer.replace(/\s/g, '').length

  const submit = async () => {
    if (grading || result || answer.trim() === '') return
    setGrading(true)
    setResult(await gradeSummaryAuto(answer, spec))
    setGrading(false)
  }

  if (result) {
    return (
      <section className={`wpanel ${result.pass ? 'is-pass' : 'is-fail'}`} aria-label="요약 봉인 결과">
        <h3>요약 봉인</h3>
        <p className="wresult" role="status">{result.pass ? '봉인 성공!' : `봉인 실패 — ${result.reason}`}</p>
        <p className="wanswer">내 요약: {answer}</p>
        {!result.pass && <p className="wmeaning">다음 턴에 다시 도전할 수 있어. 본문을 다시 읽어 봐.</p>}
        {result.mode === 'simple' && <p className="wanswer">(간이 채점)</p>}
        <div className="row">
          <button type="button" autoFocus onClick={() => onDone(result.pass, answer)}>계속</button>
        </div>
      </section>
    )
  }

  return (
    <section className="wpanel" aria-label="요약 봉인">
      <h3>요약 봉인</h3>
      <label className="wlabel" htmlFor="summary-answer">이 글을 한 문장으로 요약해 봐.</label>
      <textarea
        id="summary-answer"
        className="winput"
        rows={2}
        value={answer}
        autoFocus
        disabled={grading}
        onChange={(e) => setAnswer(e.target.value)}
        onKeyDown={(e) => {
          // 엔터로 제출(한글 조합 중 제외), 줄바꿈 없이 한 문장
          if (e.key === 'Enter' && !e.nativeEvent.isComposing) { e.preventDefault(); void submit() }
        }}
      />
      <p className="wanswer">{count}자 (공백 빼고 {POLICY.summaryMinLength}~{POLICY.summaryMaxLength}자)</p>
      <div className="row">
        <button type="button" onClick={onCancel} disabled={grading}>취소</button>
        <button type="button" onClick={() => void submit()} disabled={grading || answer.trim() === ''}>
          {grading ? '채점 중…' : '제출'}
        </button>
      </div>
    </section>
  )
}
