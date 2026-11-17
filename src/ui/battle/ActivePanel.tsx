import { findWord } from '../../content'
import { BALANCE } from '../../engine/balance'
import { wordBlock, wordPickOrder } from '../../engine/defend'
import { judgeContext } from '../../engine/question'
import { summaryHelpOn } from '../../engine/select'
import { canUseWord, type Action, type GameState } from '../../engine/state'
import { hintCost } from '../../engine/support'
import { activeFogWords } from '../fog'
import type { PanelTarget } from './handCards'
import QuestionSteps, { type Step } from './QuestionSteps'
import { FogPanel, PouchPanel } from './SmallPanels'
import WordPanel from './WordPanel'
import { RumorPanel, SummaryPanel } from './WritePanels'

interface Props {
  state: GameState
  target: PanelTarget
  evidence: number[]
  step: Step
  onStep: (s: Step) => void
  onTarget: (t: PanelTarget) => void   // 패널 안에서 다른 패널로 (낱말 묶음 ↔ 낱말)
  onLock: () => void                   // 본문 고르기를 잠근다 (제출한 뒤 근거를 바꾸지 못하게)
  dispatch: (a: Action) => void        // 카드를 내고 패널을 닫는다
  act: (a: Action) => void             // 패널을 연 채로 보내는 action (단서 보기)
  onClose: () => void
}

/** 손패에서 고른 카드의 패널 */
export default function ActivePanel({ state, target, evidence, step, onStep, onTarget, onLock, dispatch, act, onClose }: Props) {
  const think = state.think
  const block = { pick: wordBlock(state, 'pick'), write: wordBlock(state, 'write') }

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
      <QuestionSteps key={question.id} question={question} order={state.optionOrder[question.id] ?? question.options.map((_, i) => i)}
        evidence={evidence} step={step} onStep={onStep} ctx={judgeContext(state)} think={think}
        fogWords={activeFogWords(state)} attachables={attachables}
        hint={{
          dimmed, cost,
          usable: dimmed === undefined && state.think >= cost + BALANCE.questionCost[question.type],
          onUse: () => act({ type: 'useHint', questionId: question.id }),
        }}
        onCancel={onClose}
        onSubmit={(a) => dispatch({ type: 'resolveQuestion', questionId: question.id, ...a })} />
    )
  }
  if (target.kind === 'pouch') {
    return (
      <PouchPanel deck={state.deck} uses={state.wordUses} block={block} think={think} onCancel={onClose}
        onPick={(wordId) => onTarget({ kind: 'word', wordId })} />
    )
  }
  if (target.kind === 'word') {
    const entry = findWord(target.wordId)
    if (!entry || !canUseWord(state, target.wordId)) return null
    return (
      <WordPanel key={target.wordId} entry={entry} towerId={state.passage.towerId} block={block} think={think}
        pickOrder={wordPickOrder(state, entry.id, entry.rejects.length + 1)}
        onBack={() => onTarget({ kind: 'pouch' })}
        onPick={(choice) => dispatch({ type: 'resolveWordPick', wordId: entry.id, choice })}
        onWrite={(pass, answer) => dispatch({ type: 'resolveWordCard', wordId: entry.id, pass, answer })} />
    )
  }
  if (target.kind === 'rumor') {
    const rumor = state.passage.rumor
    if (!rumor) return null
    return (
      <RumorPanel rumor={rumor} speaker={state.passage.enemy.name} evidence={evidence} think={think} onCancel={onClose} onLock={onLock}
        onDone={(pass, answer, sent) => dispatch({ type: 'resolveRumor', evidence: sent, pass, answer })} />
    )
  }
  if (target.kind === 'summary') {
    return (
      <SummaryPanel spec={state.passage.summary} help={summaryHelpOn(state)} fogWords={activeFogWords(state)} think={think} onCancel={onClose}
        onDone={(pass, answer) => dispatch({ type: 'resolveSummary', pass, answer })} />
    )
  }
  const lw = state.passage.lockedWords[target.index]
  if (!lw) return null
  return (
    <FogPanel sentenceNo={lw.sentence + 1} picked={evidence[0]} think={think} onCancel={onClose}
      onSubmit={(sentence) => dispatch({ type: 'resolveFog', wordIndex: target.index, sentence })} />
  )
}
