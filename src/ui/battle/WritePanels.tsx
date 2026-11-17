import { useState } from 'react'
import type { Rumor, SummarySpec } from '../../content/types'
import { gradeSummaryAuto } from '../../grading/auto'
import { POLICY } from '../../grading/policy'
import type { SummaryGrade } from '../../grading/summary'
import { evidenceText } from '../answerText'
import { maskFog } from '../fog'
import { summaryFrame } from '../summaryFrame'
import PanelFrame from './PanelFrame'

interface WriteBoxProps { id: string; value: string; grading: boolean; onChange: (v: string) => void; onSubmit: () => void }

/** 한두 문장 쓰는 칸. 엔터로 제출(한글 조합 중 제외), 줄바꿈 없이 */
function WriteBox({ id, value, grading, onChange, onSubmit }: WriteBoxProps) {
  return (
    <textarea id={id} className="write-input" rows={2} value={value} autoFocus disabled={grading}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) { e.preventDefault(); onSubmit() } }} />
  )
}

interface SummaryProps {
  spec: SummarySpec
  help: boolean               // 여러 번 실패해 요약 틀을 보여 줄 때
  fogWords: string[]
  think: number
  onDone: (pass: boolean, answer: string) => void
  onCancel: () => void
}

/** 요약 봉인 (작업지시서 F5). 본문은 계속 보인다. 채점은 여기서, 결과만 엔진에 */
export function SummaryPanel({ spec, help, fogWords, think, onDone, onCancel }: SummaryProps) {
  const [answer, setAnswer] = useState('')
  const [grading, setGrading] = useState(false)
  const [result, setResult] = useState<SummaryGrade | null>(null)
  const count = answer.replace(/\s/g, '').length
  const frame = { kind: 'summary' as const, title: '요약 봉인', label: '요약 봉인', think }

  const submit = async () => {
    if (grading || result || answer.trim() === '') return
    setGrading(true)
    setResult(await gradeSummaryAuto(answer, spec))
    setGrading(false)
  }

  if (result) {
    return (
      <PanelFrame {...frame} tone={result.pass ? 'pass' : 'fail'}>
        <p className="result-head" role="status">{result.pass ? '요약이 요괴를 묶었어!' : `봉인 실패 — ${result.reason}`}</p>
        <p className="reveal-line"><span className="q-recap-label">내 요약</span>{answer}</p>
        {!result.pass && <p className="muted">다음 턴에 다시 쓸 수 있어. 빠진 것을 본문에서 찾아봐.</p>}
        {result.mode === 'simple' && <p className="muted">(간이 채점)</p>}
        <button type="button" className="btn btn-ink" autoFocus onClick={() => onDone(result.pass, answer)}>{result.pass ? '봉인!' : '계속'}</button>
      </PanelFrame>
    )
  }

  return (
    <PanelFrame {...frame} onCancel={grading ? undefined : onCancel}>
      <label className="q-prompt" htmlFor="summary-answer">이 글을 한 문장으로 요약해 봐. 가장 중요한 것만 내 말로!</label>
      {help && <p className="write-help"><strong>요약 틀</strong> {maskFog(summaryFrame(spec), fogWords)}</p>}
      <WriteBox id="summary-answer" value={answer} grading={grading} onChange={setAnswer} onSubmit={() => void submit()} />
      <div className="write-foot">
        <span className="muted">{count}자 · 공백 빼고 {POLICY.summaryMinLength}~{POLICY.summaryMaxLength}자</span>
        <button type="button" className="btn btn-gold" onClick={() => void submit()} disabled={grading || answer.trim() === ''}>
          {grading ? '채점 중…' : '이 요약으로 봉인'}
        </button>
      </div>
    </PanelFrame>
  )
}

interface RumorProps {
  rumor: Rumor
  speaker: string
  evidence: number[]          // 본문에서 고른 근거 문장
  think: number
  onLock: () => void          // 제출하면 근거를 더 바꿀 수 없게 본문을 잠근다
  onDone: (pass: boolean, answer: string, evidence: number[]) => void
  onCancel: () => void
}

/**
 * 헛소문 반박 (작업지시서 F11). 반박 글은 요약 채점기로 채점하고 결과만 엔진에.
 * 간이 채점은 소문에 동의하는 글을 못 거르므로 통과로 치지 않는다(근거가 맞으면 약타까지).
 * 근거는 제출하는 순간의 것으로 굳힌다(결과에서 정답 근거를 본 뒤 바꿔 내지 못하게)
 */
export function RumorPanel({ rumor, speaker, evidence, think, onLock, onDone, onCancel }: RumorProps) {
  const [answer, setAnswer] = useState('')
  const [grading, setGrading] = useState(false)
  const [result, setResult] = useState<SummaryGrade | null>(null)
  const [sent, setSent] = useState<number[]>([])
  const need = rumor.evidence.count
  const ready = evidence.length === need && answer.trim() !== '' && !grading
  const frame = { kind: 'rumor' as const, title: '헛소문 반박', label: '헛소문 반박', think }

  const submit = async () => {
    if (!ready || result) return
    setSent([...evidence])
    onLock()
    setGrading(true)
    setResult(await gradeSummaryAuto(answer, rumor.rebuttal))
    setGrading(false)
  }

  if (result) {
    const pass = result.pass && result.mode === 'semantic'
    return (
      <PanelFrame {...frame} tone={pass ? 'pass' : 'fail'}>
        <p className="result-head" role="status">
          {pass ? '반박 글 통과!' : result.mode === 'simple' ? '반박 글은 의미 채점이 준비돼야 통과할 수 있어.' : `반박 글이 모자라 — ${result.reason}`}
        </p>
        <p className="reveal-line"><span className="q-recap-label">내 반박</span>{answer}</p>
        {!pass && (
          <>
            <p className="reveal-line"><span className="q-recap-label">이렇게</span>{rumor.rebuttal.models[0]}</p>
            <p className="reveal-line"><span className="q-recap-label">근거</span><strong>{evidenceText(rumor.evidence)}</strong></p>
          </>
        )}
        <button type="button" className="btn btn-ink" autoFocus onClick={() => onDone(pass, answer, sent)}>계속</button>
      </PanelFrame>
    )
  }

  return (
    <PanelFrame {...frame} onCancel={grading ? undefined : onCancel}>
      <p className="rumor-claim">{speaker}: “{rumor.claim}”</p>
      <label className="q-guide" htmlFor="rumor-answer">이 소문이 틀린 <strong>근거 문장 {need}개</strong>를 본문에서 고르고 ({evidence.length}/{need}), 왜 틀렸는지 써 봐.</label>
      <WriteBox id="rumor-answer" value={answer} grading={grading} onChange={setAnswer} onSubmit={() => void submit()} />
      <div className="write-foot">
        <span className="muted">한 번만 낼 수 있어. 묶지 못하면 소문이 퍼져.</span>
        <button type="button" className="btn btn-ink" onClick={() => void submit()} disabled={!ready}>{grading ? '채점 중…' : '반박하기'}</button>
      </div>
    </PanelFrame>
  )
}
