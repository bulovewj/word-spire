import { findWord } from '../../content'
import { BALANCE } from '../../engine/balance'
import { hasShield, type Action, type GameState } from '../../engine/state'
import { hintCost } from '../../engine/support'
import FogPanel from '../components/FogPanel'
import QuestionPanel from '../components/QuestionPanel'
import SummaryPanel from '../components/SummaryPanel'
import WordPanel from '../components/WordPanel'
import { activeFogWords } from '../fog'
import type { PanelTarget } from './handCards'

interface Props {
  state: GameState
  target: PanelTarget
  evidence: number[]
  dispatch: (a: Action) => void     // 카드를 내고 패널을 닫는다
  act: (a: Action) => void          // 패널을 연 채로 보내는 action (단서 보기)
  onClose: () => void
}

/** 손패에서 고른 카드의 패널 */
export default function ActivePanel({ state, target, evidence, dispatch, act, onClose }: Props) {
  if (target.kind === 'question') {
    const question = state.passage.questions.find((q) => q.id === target.id)
    const card = state.textCards.find((c) => c.kind === 'question' && c.refId === target.id)
    if (!question || !card) return null
    const attachables = question.type === 'author'
      ? state.hand.filter((w) => question.bonusWords?.includes(w.wordId))
        .map((w) => ({ uid: w.uid, wordId: w.wordId, word: findWord(w.wordId)?.word ?? w.wordId }))
      : []
    const dimmed = state.hints[question.id]
    const cost = hintCost(state)
    return (
      <QuestionPanel
        key={question.id}
        question={question}
        order={state.optionOrder[question.id] ?? question.options.map((_, i) => i)}
        evidence={evidence}
        ctx={{ shield: hasShield(state), retry: card.retry }}
        fogWords={activeFogWords(state)}
        attachables={attachables}
        hint={{
          dimmed, cost,
          usable: dimmed === undefined && state.think >= cost + BALANCE.questionCost[question.type],
          onUse: () => act({ type: 'useHint', questionId: question.id }),
        }}
        onCancel={onClose}
        onSubmit={(a, attachedWordUid) => dispatch({ type: 'resolveQuestion', questionId: question.id,
          option: a.option, evidence: a.evidence, confidence: a.confidence, attachedWordUid })}
      />
    )
  }
  if (target.kind === 'word') {
    const card = state.hand.find((w) => w.uid === target.uid)
    const entry = card && findWord(card.wordId)
    if (!card || !entry) return null
    return (
      <WordPanel
        key={card.uid}
        entry={entry}
        towerId={state.passage.towerId}
        onCancel={onClose}
        onDone={(pass, answer) => dispatch({ type: 'resolveWordCard', uid: card.uid, pass, answer })}
      />
    )
  }
  if (target.kind === 'summary') {
    return (
      <SummaryPanel
        spec={state.passage.summary}
        onCancel={onClose}
        onDone={(pass, answer) => dispatch({ type: 'resolveSummary', pass, answer })}
      />
    )
  }
  const lw = state.passage.lockedWords[target.index]
  if (!lw) return null
  return (
    <FogPanel
      sentenceNo={lw.sentence + 1}
      picked={evidence[0]}
      onCancel={onClose}
      onSubmit={(sentence) => dispatch({ type: 'resolveFog', wordIndex: target.index, sentence })}
    />
  )
}
