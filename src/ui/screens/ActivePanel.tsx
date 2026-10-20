import { findWord } from '../../content'
import { hasShield, type Action, type GameState } from '../../engine/state'
import QuestionPanel from '../components/QuestionPanel'
import { activeFogWords } from '../fog'
import WordPanel from '../components/WordPanel'
import type { PanelTarget } from './handCards'

interface Props {
  state: GameState
  target: PanelTarget
  evidence: number[]
  dispatch: (a: Action) => void
  onClose: () => void
}

/** 손패에서 고른 카드의 패널. 열 수 없는 카드면 안내 문구 */
export default function ActivePanel({ state, target, evidence, dispatch, onClose }: Props) {
  if (target.kind === 'question') {
    const question = state.passage.questions.find((q) => q.id === target.id)
    const card = state.textCards.find((c) => c.kind === 'question' && c.refId === target.id)
    if (!question || !card) return null
    const attachables = question.type === 'author'
      ? state.hand.filter((w) => question.bonusWords?.includes(w.wordId))
        .map((w) => ({ uid: w.uid, wordId: w.wordId, word: findWord(w.wordId)?.word ?? w.wordId }))
      : []
    return (
      <QuestionPanel
        key={question.id}
        question={question}
        order={state.optionOrder[question.id] ?? question.options.map((_, i) => i)}
        evidence={evidence}
        ctx={{ shield: hasShield(state), retry: card.retry }}
        fogWords={activeFogWords(state)}
        attachables={attachables}
        onCancel={onClose}
        onSubmit={(a, attachedWordUid) => dispatch({ type: 'resolveQuestion', questionId: question.id,
          option: a.option, evidence: a.evidence, confidence: a.confidence, usedHint: false, attachedWordUid })}
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
  const text = target.kind === 'fog' ? '안개 걷기는 M7에서 만든다.' : '요약 봉인은 M6에서 만든다.'
  return (
    <section className="wpanel">
      <p>{text}</p>
      <div className="row"><button type="button" onClick={onClose}>닫기</button></div>
    </section>
  )
}
