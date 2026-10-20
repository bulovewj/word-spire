import { useState } from 'react'
import { findWord } from '../../content'
import { BALANCE } from '../../engine/balance'
import { hasShield, incomingDamage, nextEnemyAttack, reduce, type Action, type GameState } from '../../engine/state'
import { EnemyPanel, PlayerPanel } from '../components/BattleBars'
import Hand, { type HandCard } from '../components/Hand'
import PassagePanel from '../components/PassagePanel'
import QuestionPanel from '../components/QuestionPanel'
import { eventText } from '../eventText'
import './battle.css'

type Panel = { kind: 'question'; id: string } | { kind: 'word'; uid: string } | { kind: 'notice'; text: string } | null

const TYPE_LABEL = { literal: '거기 있음', connect: '연결', author: '글쓴이와 나' } as const

interface Props {
  initial: GameState
  onRestart: () => void
}

export default function BattleScreen({ initial, onRestart }: Props) {
  const [state, setState] = useState(initial)
  const [panel, setPanel] = useState<Panel>(null)
  const [evidence, setEvidence] = useState<number[]>([])
  const p = state.passage

  const dispatch = (a: Action) => {
    setState((s) => reduce(s, a))
    setPanel(null)
    setEvidence([])
  }

  const cards: HandCard[] = [
    ...state.textCards.map((c): HandCard => {
      if (c.kind === 'question') {
        const q = p.questions.find((x) => x.id === c.refId)
        const cost = q ? BALANCE.questionCost[q.type] : 0
        return { key: `q:${c.refId}`, kind: 'question', cost, title: `질문: ${q ? TYPE_LABEL[q.type] : ''}`,
          sub: q?.prompt ?? '', disabled: state.think < cost || c.lockedThisTurn, badge: c.retry ? '다시 보기' : undefined }
      }
      if (c.kind === 'fog') {
        return { key: `f:${c.refId}`, kind: 'fog', cost: BALANCE.fogCost, title: '안개 걷기', sub: '가려진 낱말의 단서 찾기',
          disabled: state.think < BALANCE.fogCost || c.lockedThisTurn }
      }
      return { key: 's', kind: 'summary', cost: BALANCE.summaryCost, title: '요약 봉인', sub: '한 문장으로 요약해 마무리',
        disabled: state.think < BALANCE.summaryCost || c.lockedThisTurn }
    }),
    ...state.hand.map((w): HandCard => ({
      key: `w:${w.uid}`, kind: 'word', cost: BALANCE.wordCardCost, title: findWord(w.wordId)?.word ?? w.wordId,
      sub: '뜻을 쓰면 방어', disabled: state.think < BALANCE.wordCardCost,
    })),
  ]

  const pick = (key: string) => {
    setEvidence([])
    const [kind, id = ''] = key.split(':')
    if (kind === 'q') setPanel({ kind: 'question', id })
    else if (kind === 'w') setPanel({ kind: 'word', uid: id })
    else if (kind === 'f') setPanel({ kind: 'notice', text: '안개 걷기는 M7에서 만든다.' })
    else setPanel({ kind: 'notice', text: '요약 봉인은 M6에서 만든다.' })
  }

  const question = panel?.kind === 'question' ? p.questions.find((q) => q.id === panel.id) : undefined
  const qCard = question && state.textCards.find((c) => c.kind === 'question' && c.refId === question.id)
  const wordCard = panel?.kind === 'word' ? state.hand.find((w) => w.uid === panel.uid) : undefined
  const fog = p.lockedWords.filter((_, i) => !state.fogCleared.includes(i))
  const toggle = (i: number) => setEvidence((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]))

  return (
    <div className="battle">
      <div className="battle-text">
        <PassagePanel title={p.title} sentences={p.sentences} fog={fog} selected={evidence}
          onToggle={question ? toggle : undefined} />
      </div>
      <div className="battle-field">
        <EnemyPanel name={p.enemy.name} hp={state.enemy.hp} maxHp={state.enemy.maxHp}
          nextAttack={nextEnemyAttack(state)} shield={hasShield(state)} />
        <PlayerPanel hp={state.player.hp} maxHp={state.player.maxHp} block={state.player.block}
          incoming={incomingDamage(state)} think={state.think} maxThink={BALANCE.thinkPerTurn} />

        {state.events.length > 0 && (
          <ul className="events" role="status">
            {state.events.map((e, i) => <li key={i}>{eventText(e)}</li>)}
          </ul>
        )}

        {state.outcome === 'lost' ? (
          <div className="overlay">
            <p>쓰러졌어… 다시 읽고 도전해 보자.</p>
            <button type="button" onClick={onRestart}>이 층 다시 하기</button>
          </div>
        ) : question && qCard ? (
          <QuestionPanel
            key={question.id}
            question={question}
            order={state.optionOrder[question.id] ?? question.options.map((_, i) => i)}
            evidence={evidence}
            ctx={{ shield: hasShield(state), retry: qCard.retry }}
            attachables={question.type === 'author'
              ? state.hand.filter((w) => question.bonusWords?.includes(w.wordId))
                .map((w) => ({ uid: w.uid, wordId: w.wordId, word: findWord(w.wordId)?.word ?? w.wordId }))
              : []}
            onCancel={() => setPanel(null)}
            onSubmit={(a, attachedWordUid) => dispatch({ type: 'resolveQuestion', questionId: question.id,
              option: a.option, evidence: a.evidence, confidence: a.confidence, usedHint: false, attachedWordUid })}
          />
        ) : wordCard ? (
          <section className="wpanel" aria-label="낱말 카드">
            <h3>{findWord(wordCard.wordId)?.word}</h3>
            <p>이 말의 뜻을 내 말로 써 봐. (채점기는 M5에서 — 지금은 임시 버튼)</p>
            <div className="row">
              <button type="button" onClick={() => setPanel(null)}>취소</button>
              <button type="button" onClick={() => dispatch({ type: 'resolveWordCard', uid: wordCard.uid, pass: false, answer: '' })}>틀림</button>
              <button type="button" onClick={() => dispatch({ type: 'resolveWordCard', uid: wordCard.uid, pass: true, answer: '' })}>맞음</button>
            </div>
          </section>
        ) : (
          <>
            {panel?.kind === 'notice' && <p className="notice">{panel.text}</p>}
            <Hand cards={cards} onPick={pick} />
            <div className="row">
              <span className="turn">{state.turn}턴</span>
              <button type="button" className="end-turn" onClick={() => dispatch({ type: 'endTurn' })}>턴 끝내기</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
