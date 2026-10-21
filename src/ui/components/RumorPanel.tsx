import { useState } from 'react'
import type { Rumor } from '../../content/types'
import { gradeSummaryAuto } from '../../grading/auto'
import type { SummaryGrade } from '../../grading/summary'
import { evidenceText } from '../answerText'
import './WordPanel.css'

interface Props {
  rumor: Rumor
  speaker: string
  evidence: number[]          // 본문에서 고른 근거 문장
  onDone: (pass: boolean, answer: string) => void
  onCancel: () => void
}

/**
 * 헛소문 반박 (작업지시서 F11). 반박 글은 요약 채점기로 채점하고 결과만 엔진에.
 * 간이 채점은 소문에 동의하는 글을 못 거르므로 통과로 치지 않는다(근거가 맞으면 약타까지)
 */
export default function RumorPanel({ rumor, speaker, evidence, onDone, onCancel }: Props) {
  const [answer, setAnswer] = useState('')
  const [grading, setGrading] = useState(false)
  const [result, setResult] = useState<SummaryGrade | null>(null)
  const need = rumor.evidence.count
  const ready = evidence.length === need && answer.trim() !== '' && !grading

  const submit = async () => {
    if (!ready || result) return
    setGrading(true)
    setResult(await gradeSummaryAuto(answer, rumor.rebuttal))
    setGrading(false)
  }

  if (result) {
    const pass = result.pass && result.mode === 'semantic'
    return (
      <section className={`wpanel ${pass ? 'is-pass' : 'is-fail'}`} aria-label="헛소문 반박 결과">
        <h3>헛소문 반박</h3>
        <p className="wresult" role="status">
          {pass ? '반박 글 통과!' : result.mode === 'simple' ? '반박 글은 의미 채점이 준비돼야 통과할 수 있어.' : `반박 글이 모자라 — ${result.reason}`}
        </p>
        <p className="wanswer">내 반박: {answer}</p>
        {!pass && (
          <>
            <p className="wmeaning">이렇게 반박할 수 있어: {rumor.rebuttal.models[0]}</p>
            <p className="wmeaning">근거 문장: {evidenceText(rumor.evidence)}</p>
          </>
        )}
        <div className="row">
          <button type="button" autoFocus onClick={() => onDone(pass, answer)}>계속</button>
        </div>
      </section>
    )
  }

  return (
    <section className="wpanel" aria-label="헛소문 반박">
      <h3>헛소문 반박</h3>
      <p className="unit-line">{speaker}: “{rumor.claim}”</p>
      <p className="wlabel">본문에서 이 소문이 틀린 근거 문장 <strong>{need}개</strong>를 골라 봐. ({evidence.length}/{need})</p>
      <label className="wlabel" htmlFor="rumor-answer">그리고 왜 틀렸는지 한두 문장으로 반박해 봐.</label>
      <textarea id="rumor-answer" className="winput" rows={2} value={answer} disabled={grading}
        onChange={(e) => setAnswer(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) { e.preventDefault(); void submit() } }} />
      <p className="wanswer">한 번만 낼 수 있어. 봉인하지 못하면 소문이 퍼져서 이 층 동안 적 공격이 세져.</p>
      <div className="row">
        <button type="button" onClick={onCancel} disabled={grading}>취소</button>
        <button type="button" onClick={() => void submit()} disabled={!ready}>{grading ? '채점 중…' : '제출'}</button>
      </div>
    </section>
  )
}
