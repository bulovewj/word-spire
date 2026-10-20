import { useState } from 'react'
import type { Question } from '../../content/types'
import { previewDamage, type Confidence, type JudgeContext, type QuestionAnswer } from '../../engine/judge'
import { maskFog } from '../fog'
import './QuestionPanel.css'

interface Props {
  question: Question
  order: number[]              // 보기 표시 순서(options index)
  evidence: number[]           // 본문에서 고른 근거 문장
  ctx: JudgeContext
  fogWords: string[]           // 안개가 남은 낱말: 질문·보기에서도 가린다
  attachables?: Attachable[]   // 붙일 수 있는 손패 낱말 카드 (author 전용)
  hint: HintInfo               // 단서 보기 상태
  onSubmit: (answer: QuestionAnswer, attachedUid?: string) => void
  onCancel?: () => void
}

export interface Attachable { uid: string; wordId: string; word: string }

/** dimmed: 지운 보기 index / cost: 이번 단서 비용 / usable: 지금 쓸 수 있는지 */
export interface HintInfo { dimmed?: number; cost: number; usable: boolean; onUse: () => void }

const MARKS = ['①', '②', '③', '④']
const TYPE_LABEL = { literal: '거기 있음', connect: '연결', author: '글쓴이와 나' } as const

export default function QuestionPanel({ question, order, evidence, ctx, fogWords, attachables = [], hint, onSubmit, onCancel }: Props) {
  const [picked, setOption] = useState<number | null>(null)
  const option = picked === hint.dimmed ? null : picked   // 지워진 보기는 고를 수 없다
  const [confidence, setConfidence] = useState<Confidence | null>(null)
  const [attachedUid, setAttachedUid] = useState<string | undefined>(undefined)
  const attachedWordId = attachables.find((a) => a.uid === attachedUid)?.wordId
  const need = question.evidence.count
  const ready = option !== null && evidence.length === need && confidence !== null
  const preview = previewDamage(question, confidence ?? 'unsure', attachedWordId, ctx)

  return (
    <section className="qpanel" aria-label="질문">
      <p className="qpanel-type">질문: {TYPE_LABEL[question.type]}</p>
      <h3 className="qpanel-prompt">{maskFog(question.prompt, fogWords)}</h3>

      <div className="qpanel-options" role="radiogroup" aria-label="보기">
        {order.map((idx, pos) => (
          <button
            key={idx}
            type="button"
            role="radio"
            aria-checked={option === idx}
            className={`qopt${option === idx ? ' is-on' : ''}${hint.dimmed === idx ? ' is-dim' : ''}`}
            disabled={hint.dimmed === idx}
            onClick={() => setOption(idx)}
          >
            {MARKS[pos]} {maskFog(question.options[idx] ?? '', fogWords)}
          </button>
        ))}
      </div>

      <div className="qpanel-cluebar">
        <button type="button" className="qclue" disabled={!hint.usable} onClick={hint.onUse}>
          {hint.dimmed !== undefined ? '단서 보기 (이미 씀)' : `단서 보기 (${hint.cost === 0 ? '공짜' : `생각력 ${hint.cost}`})`}
        </button>
      </div>

      <p className="qpanel-hint">
        본문에서 근거 문장 <strong>{need}개</strong>를 골라 봐. ({evidence.length}/{need}{evidence.length > 0 ? ` · ${[...evidence].sort((a, b) => a - b).map((i) => i + 1).join(', ')}번` : ''})
      </p>

      {attachables.length > 0 && (
        <div className="qpanel-attach">
          {attachables.map((a) => (
            <button
              key={a.uid}
              type="button"
              aria-pressed={attachedUid === a.uid}
              className={attachedUid === a.uid ? 'is-on' : ''}
              onClick={() => setAttachedUid((u) => (u === a.uid ? undefined : a.uid))}
            >
              낱말 카드 붙이기: {a.word} (+4)
            </button>
          ))}
        </div>
      )}

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
            onSubmit({ option, evidence, confidence, attachedWordId }, attachedUid)
          }}
        >
          제출
        </button>
      </div>
    </section>
  )
}
