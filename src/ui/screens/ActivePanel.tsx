import { findWord } from '../../content'
import { BALANCE } from '../../engine/balance'
import { canUseWord, hasShield, type Action, type GameState } from '../../engine/state'
import { hintCost } from '../../engine/support'
import FogPanel from '../components/FogPanel'
import QuestionPanel from '../components/QuestionPanel'
import RumorPanel from '../components/RumorPanel'
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

/** 손패·낱말 묶음에서 고른 것의 패널 */
export default function ActivePanel({ state, target, evidence, dispatch, act, onClose }: Props) {
  if (target.kind === 'question') {
    const question = state.passage.questions.find((q) => q.id === target.id)
    if (!question) return null
    const attachables = question.type === 'author'
      ? (question.bonusWords ?? []).filter((id) => canUseWord(state, id))
        .map((id) => ({ wordId: id, word: findWord(id)?.word ?? id, uses: state.wordUses[id] ?? 0 }))
      : []
    const dimmed = state.hints[question.id]
    const cost = hintCost(state)
    return (
      <QuestionPanel
        key={question.id}
        question={question}
        order={state.optionOrder[question.id] ?? question.options.map((_, i) => i)}
        evidence={evidence}
        ctx={{ shield: hasShield(state) }}
        fogWords={activeFogWords(state)}
        attachables={attachables}
        hint={{
          dimmed, cost,
          usable: dimmed === undefined && state.think >= cost + BALANCE.questionCost[question.type],
          onUse: () => act({ type: 'useHint', questionId: question.id }),
        }}
        onCancel={onClose}
        onSubmit={(a) => dispatch({ type: 'resolveQuestion', questionId: question.id,
          option: a.option, evidence: a.evidence, confidence: a.confidence, attachedWordId: a.attachedWordId })}
      />
    )
  }
  if (target.kind === 'word') {
    const entry = findWord(target.wordId)
    if (!entry || !canUseWord(state, target.wordId)) return null
    return (
      <WordPanel
        key={target.wordId}
        entry={entry}
        towerId={state.passage.towerId}
        onCancel={onClose}
        onDone={(pass, answer) => dispatch({ type: 'resolveWordCard', wordId: target.wordId, pass, answer })}
      />
    )
  }
  if (target.kind === 'rumor') {
    const rumor = state.passage.rumor
    if (!rumor) return null
    return (
      <RumorPanel rumor={rumor} speaker={state.passage.enemy.name} evidence={evidence} onCancel={onClose}
        onDone={(pass, answer) => dispatch({ type: 'resolveRumor', evidence, pass, answer })} />
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
