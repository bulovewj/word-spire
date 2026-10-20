import { useState } from 'react'
import type { Question } from '../../content/types'
import { previewDamage, type Confidence, type JudgeContext, type QuestionAnswer } from '../../engine/judge'
import './QuestionPanel.css'

interface Props {
  question: Question
  order: number[]              // 보기 표시 순서(options index)
  evidence: number[]           // 본문에서 고른 근거 문장
  ctx: JudgeContext
  attachedWordId?: string
  onSubmit: (answer: QuestionAnswer) => void
  onCancel?: () => void
}

const MARKS = ['①', '②', '③', '④']
const TYPE_LABEL = { literal: '거기 있음', connect: '연결', author: '글쓴이와 나' } as const

export default function QuestionPanel({ question, order, evidence, ctx, attachedWordId, onSubmit, onCancel }: Props) {
  const [option, setOption] = useState<number | null>(null)
  const [confidence, setConfidence] = useState<Confidence | null>(null)
  const ready = option !== null && evidence.length > 0 && confidence !== null
  const preview = previewDamage(question, confidence ?? 'unsure', attachedWordId, ctx)

  return (
    <section className="qpanel" aria-label="질문">
      <p className="qpanel-type">질문: {TYPE_LABEL[question.type]}</p>
      <h3 className="qpanel-prompt">{question.prompt}</h3>

      <div className="qpanel-options" role="radiogroup" aria-label="보기">
        {order.map((idx, pos) => (
          <button
            key={idx}
            type="button"
            role="radio"
            aria-checked={option === idx}
            className={`qopt${option === idx ? ' is-on' : ''}`}
            onClick={() => setOption(idx)}
          >
            {MARKS[pos]} {question.options[idx]}
          </button>
        ))}
      </div>

      <p className="qpanel-hint">
        본문에서 근거 문장을 눌러 골라 봐. 고른 문장: {evidence.length > 0 ? [...evidence].sort((a, b) => a - b).map((i) => i + 1).join(', ') + '번' : '없음'}
      </p>

      <div className="qpanel-conf" role="radiogroup" aria-label="확신도">
        {(['sure', 'unsure'] as const).map((c) => (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={confidence === c}
            className={`qconf${confidence === c ? ' is-on' : ''}`}
            onClick={() => setConfidence(c)}
          >
            {c === 'sure' ? '확실' : '애매'}
          </button>
        ))}
      </div>

      <p className="qpanel-preview">정타 {preview.hit} / 약타 {preview.weak} / 실패 0</p>

      <div className="qpanel-actions">
        {onCancel && <button type="button" onClick={onCancel}>취소</button>}
        <button
          type="button"
          className="qsubmit"
          disabled={!ready}
          onClick={() => {
            if (option === null || confidence === null) return
            onSubmit({ option, evidence, confidence, attachedWordId })
          }}
        >
          제출
        </button>
      </div>
    </section>
  )
}
