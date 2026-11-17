import { useState } from 'react'
import type { Question } from '../../content/types'
import { BALANCE } from '../../engine/balance'
import { previewDamage, type Confidence, type JudgeContext, type QuestionAnswer } from '../../engine/judge'
import { OPTION_MARKS, QUESTION_LABEL } from '../areaLabels'
import { Icon } from '../components/Sprite'
import { maskFog } from '../fog'
import PanelFrame from './PanelFrame'
import './steps.css'

export type Step = 'answer' | 'evidence' | 'bet'
export interface Attachable { wordId: string; word: string; uses: number }
/** dimmed: 지운 보기 index / cost: 이번 단서 비용 / usable: 지금 쓸 수 있는지 */
export interface HintInfo { dimmed?: number; cost: number; usable: boolean; onUse: () => void }

interface Props {
  question: Question
  order: number[]              // 보기 표시 순서(options index)
  evidence: number[]           // 본문에서 고른 근거 문장
  step: Step                   // 본문을 누를 수 있는 때(근거 단계)를 전투 화면이 알아야 해서 밖에 둔다
  onStep: (s: Step) => void
  ctx: JudgeContext
  think: number
  fogWords: string[]           // 안개가 남은 낱말: 질문·보기에서도 가린다
  attachables: Attachable[]    // 붙일 수 있는 내 낱말 (author 전용)
  hint: HintInfo
  onSubmit: (answer: QuestionAnswer) => void
  onCancel: () => void
}

const STEPS: { id: Step; label: string }[] = [{ id: 'answer', label: '답' }, { id: 'evidence', label: '근거' }, { id: 'bet', label: '확신' }]

/** 질문 카드: ① 답 고르기 → ② 근거 문장 찾기 → ③ 확신 걸고 공격. 제출 전에는 정답을 암시하지 않는다 */
export default function QuestionSteps({ question, order, evidence, step, onStep, ctx, think, fogWords, attachables, hint, onSubmit, onCancel }: Props) {
  const [picked, setPicked] = useState<number | null>(null)
  const option = picked === hint.dimmed ? null : picked   // 지워진 보기는 고를 수 없다
  const [attached, setAttached] = useState<string | undefined>(undefined)
  const need = question.evidence.count
  const mark = (idx: number) => OPTION_MARKS[order.indexOf(idx)] ?? ''
  const text = (idx: number) => maskFog(question.options[idx] ?? '', fogWords)
  const sorted = [...evidence].sort((a, b) => a - b)
  const done = (s: Step) => (s === 'answer' ? option !== null : s === 'evidence' ? evidence.length === need : false)
  const submit = (confidence: Confidence) => {
    if (option === null || evidence.length !== need) return
    onSubmit({ option, evidence, confidence, attachedWordId: attached })
  }

  return (
    <PanelFrame kind={question.type} title={`질문 · ${QUESTION_LABEL[question.type]}`} label="질문" think={think} onCancel={onCancel}>
      <ol className="steps" aria-label="순서">
        {STEPS.map((s, i) => (
          <li key={s.id}>
            <button type="button" className={`step${step === s.id ? ' is-now' : ''}${done(s.id) ? ' is-done' : ''}`}
              aria-current={step === s.id ? 'step' : undefined}
              disabled={s.id !== 'answer' && (option === null || (s.id === 'bet' && evidence.length !== need))}
              onClick={() => onStep(s.id)}>
              <span className="step-no">{i + 1}</span>{s.label}
            </button>
          </li>
        ))}
      </ol>
      <p className="q-prompt">{maskFog(question.prompt, fogWords)}</p>

      {step === 'answer' && (
        <>
          <div className="q-options" role="radiogroup" aria-label="보기">
            {order.map((idx) => (
              <button key={idx} type="button" role="radio" aria-checked={option === idx} disabled={hint.dimmed === idx}
                className={`q-opt${option === idx ? ' is-on' : ''}${hint.dimmed === idx ? ' is-dim' : ''}`}
                onClick={() => { setPicked(idx); onStep('evidence') }}>
                <span className="q-mark">{mark(idx)}</span><span>{text(idx)}</span>
              </button>
            ))}
          </div>
          <button type="button" className="btn btn-quiet q-hint" disabled={!hint.usable} onClick={hint.onUse}>
            <Icon name="clue" />
            {hint.dimmed !== undefined ? '단서를 봤어 (틀린 보기 하나를 지웠어)' : `단서 보기: 틀린 보기 하나 지우기 (${hint.cost === 0 ? '공짜' : `생각력 ${hint.cost}`})`}
          </button>
        </>
      )}

      {step !== 'answer' && option !== null && (
        <button type="button" className="q-recap" onClick={() => onStep('answer')}>
          <span className="q-recap-label">내 답</span><span>{mark(option)} {text(option)}</span><span className="q-recap-edit">바꾸기</span>
        </button>
      )}

      {step === 'evidence' && (
        <div className="q-evidence">
          <p className="q-guide"><Icon name="evidence" />이 답의 <strong>근거가 되는 문장 {need}개</strong>를 본문에서 눌러 골라 봐.</p>
          <p className="q-picked" role="status">
            고른 문장 {evidence.length}/{need}{sorted.length > 0 && <strong> · {sorted.map((i) => i + 1).join('번, ')}번</strong>}
          </p>
          <button type="button" className="btn btn-ink" disabled={evidence.length !== need} onClick={() => onStep('bet')}>다 골랐어</button>
        </div>
      )}

      {step === 'bet' && (
        <div className="q-bet">
          <button type="button" className="q-recap" onClick={() => onStep('evidence')}>
            <span className="q-recap-label">근거</span><span>{sorted.map((i) => i + 1).join('번, ')}번 문장</span><span className="q-recap-edit">바꾸기</span>
          </button>
          {attachables.map((a) => (
            <button key={a.wordId} type="button" aria-pressed={attached === a.wordId} className={`q-attach${attached === a.wordId ? ' is-on' : ''}`}
              onClick={() => setAttached((u) => (u === a.wordId ? undefined : a.wordId))}>
              낱말 붙이기: {a.word} (공격 +{BALANCE.bonusWordDamage} · 남은 {a.uses}번 중 1번 씀)
            </button>
          ))}
          <p className="q-guide">얼마나 확실해? 고르면 바로 공격해.</p>
          <div className="q-bets">
            {(['sure', 'unsure'] as const).map((c) => {
              const p = previewDamage(question, c, attached, ctx)
              return (
                <button key={c} type="button" className={`bet bet-${c}`} onClick={() => submit(c)}>
                  <span className="bet-title"><Icon name={c} scale={2} />{c === 'sure' ? '확실해!' : '애매해…'}</span>
                  <span className="bet-line">정타 {p.hit} · 약타 {p.weak}</span>
                  <span className="bet-line">{c === 'sure' ? `틀리면 요괴 공격 +${BALANCE.surePenalty}` : '틀려도 벌 없음 · 단서 1번 공짜'}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </PanelFrame>
  )
}
