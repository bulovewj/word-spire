import { findWord } from '../../content'
import type { Question } from '../../content/types'
import { BALANCE } from '../../engine/balance'
import type { Grade } from '../../engine/judge'
import { evidenceText } from '../answerText'
import { OPTION_MARKS, QUESTION_LABEL } from '../areaLabels'
import { FOG, maskFog } from '../fog'
import PanelFrame from './PanelFrame'

/** 전투를 시작하기 전: 먼저 글을 읽는다. 요괴는 기다려 준다 */
export function ReadGate({ title, sentences, enemy, onStart }: { title: string; sentences: number; enemy: string; onStart: () => void }) {
  return (
    <section className="panel panel-read" aria-label="글 읽기">
      <div className="panel-body">
        <h3 className="read-title">먼저 글을 읽어 봐</h3>
        <p>「{title}」 · {sentences}문장. 다 읽을 때까지 {enemy}는 기다려 줘.</p>
        <p className="muted">전투 중에도 글은 언제든 다시 읽을 수 있어.</p>
        <button type="button" className="btn btn-gold read-start" autoFocus onClick={onStart}>다 읽었어, 시작!</button>
      </div>
    </section>
  )
}

interface FogProps {
  sentenceNo: number          // 가려진 낱말이 있는 문장 (화면 번호)
  picked: number | undefined  // 고른 문장 index
  think: number
  onSubmit: (sentence: number) => void
  onCancel: () => void
}

/** 안개 걷기 (작업지시서 F3): 가려진 낱말의 뜻을 짐작하게 해 주는 문장 하나를 본문에서 고른다 */
export function FogPanel({ sentenceNo, picked, think, onSubmit, onCancel }: FogProps) {
  return (
    <PanelFrame kind="fog" title="안개 걷기" label="안개 걷기" think={think} onCancel={onCancel}>
      <p className="q-prompt">{sentenceNo}번 문장의 ‘{FOG}’은 무슨 뜻일까?</p>
      <p className="q-guide">그 뜻을 <strong>짐작하게 해 주는 문장 1개</strong>를 본문에서 눌러 골라 봐.</p>
      <p className="q-picked" role="status">고른 문장: {picked !== undefined ? <strong>{picked + 1}번</strong> : '아직 없어'}</p>
      <p className="muted">맞히면 보호막이 걷히고, 이 낱말 카드를 층 보상으로 얻어.</p>
      <button type="button" className="btn btn-ink" disabled={picked === undefined} onClick={() => picked !== undefined && onSubmit(picked)}>안개 걷기!</button>
    </PanelFrame>
  )
}

interface PouchProps {
  deck: string[]
  uses: Record<string, number>
  block: { pick: number; write: number }
  think: number
  onPick: (wordId: string) => void
  onCancel: () => void
}

/** 낱말 방어: 내 낱말 묶음에서 막을 낱말을 고른다. 낱말마다 한 탑에서 정해진 횟수만 (기획안 6-1) */
export function PouchPanel({ deck, uses, block, think, onPick, onCancel }: PouchProps) {
  return (
    <PanelFrame kind="word" title="낱말 방어" label="낱말 방어" think={think} onCancel={onCancel}>
      <p className="q-guide">어떤 낱말로 막을까? 뜻을 <strong>고르면 방어 +{block.pick}</strong>, <strong>쓰면 방어 +{block.write}</strong>.</p>
      <ul className="pouch">
        {deck.map((id) => {
          const left = uses[id] ?? 0
          return (
            <li key={id}>
              <button type="button" className="pouch-word" disabled={left === 0} onClick={() => onPick(id)}>
                <span className="pouch-name">{findWord(id)?.word ?? id}</span>
                <span className="pouch-uses" aria-label={left === 0 ? '다 썼어' : `${left}번 남음`}>
                  {'●'.repeat(left)}{'○'.repeat(Math.max(0, BALANCE.wordUsesPerTower - left))}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      <p className="muted">낱말마다 이 탑에서 {BALANCE.wordUsesPerTower}번. 맞히든 틀리든 한 번 쓰여.</p>
    </PanelFrame>
  )
}

interface RevealProps {
  question: Question
  grade: Grade
  order: number[]             // 보기 표시 순서 (학생이 본 번호로 알려 준다)
  fogWords: string[]
  penalty: number             // 확실로 틀려서 붙은 요괴 공격 +
  onOk: () => void
}

/** 약타·실패 뒤 바로 보여 주는 정답과 근거. 틀린 질문은 다시 풀지 않는다 (기획안 6-2) */
export function RevealPanel({ question, grade, order, fogWords, penalty, onOk }: RevealProps) {
  const pos = order.indexOf(question.answer)
  return (
    <PanelFrame kind={question.type} title={`질문 · ${QUESTION_LABEL[question.type]}`} label="정답과 근거" tone="fail">
      <p className="result-head">{grade === 'weak' ? '약타! 답은 맞았는데 근거가 달랐어.' : '빗나갔어. 고른 답이 글의 내용과 달라.'}</p>
      <p className="q-prompt">{maskFog(question.prompt, fogWords)}</p>
      {grade === 'miss' && <p className="reveal-line"><span className="q-recap-label">정답</span>{OPTION_MARKS[pos] ?? ''} {maskFog(question.options[question.answer] ?? '', fogWords)}</p>}
      <p className="reveal-line"><span className="q-recap-label">근거</span><strong>{evidenceText(question.evidence)}</strong></p>
      <p className="muted">본문에 초록 테두리로 표시했어. 다시 읽어 봐.</p>
      {penalty > 0 && <p className="reveal-warn">확실하다고 했는데 틀려서 요괴의 다음 공격이 +{penalty} 세졌어.</p>}
      <button type="button" className="btn btn-ink" autoFocus onClick={onOk}>확인했어</button>
    </PanelFrame>
  )
}
