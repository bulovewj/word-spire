import { useState } from 'react'
import { STORY } from '../../content/story'
import { BALANCE } from '../../engine/balance'
import { hasShield, incomingDamage, nextEnemyAttack, type Action, type GameState } from '../../engine/state'
import AnswerReveal from '../components/AnswerReveal'
import { EnemyPanel, PlayerPanel } from '../components/BattleBars'
import Hand from '../components/Hand'
import PassagePanel from '../components/PassagePanel'
import WordPouch from '../components/WordPouch'
import Sprite, { Icon } from '../components/Sprite'
import { eventIcon, eventText } from '../eventText'
import { usePoses } from '../usePoses'
import { activeFogWords } from '../fog'
import ActivePanel from './ActivePanel'
import { buildHandCards, type PanelTarget } from './handCards'
import './battle.css'

interface Props {
  state: GameState
  dispatch: (a: Action) => void
  lastFloor: boolean          // 3층이면 이긴 뒤 "탑 완료"
  onWon: () => void           // 이긴 전투를 마치고 보상으로
  onRetry: () => void         // 진 층을 다시
}

/** 전투 화면. 상태는 그리기만 하고 바꾸는 건 action으로만 */
export default function BattleScreen({ state, dispatch, lastFloor, onWon, onRetry }: Props) {
  const [target, setTarget] = useState<PanelTarget | null>(null)
  const [evidence, setEvidence] = useState<number[]>([])
  const p = state.passage

  const close = () => { setTarget(null); setEvidence([]) }
  const send = (a: Action) => { dispatch(a); close() }
  const open = (t: PanelTarget) => { setEvidence([]); setTarget(t) }
  const cap = target?.kind === 'question' ? p.questions.find((q) => q.id === target.id)?.evidence.count ?? 0
    : target?.kind === 'fog' ? 1 : target?.kind === 'rumor' ? p.rumor?.evidence.count ?? 0 : 0
  // 근거는 정해진 개수까지만 고를 수 있다(1개면 다른 문장을 누르면 바뀜). 바꾸려면 고른 문장을 다시 눌러 뺀다
  const toggle = (i: number) => setEvidence((s) =>
    s.includes(i) ? s.filter((x) => x !== i) : s.length < cap ? [...s, i] : cap === 1 ? [i] : s)
  const fog = p.lockedWords.filter((_, i) => !state.fogCleared.includes(i))
  const picking = target?.kind === 'question' || target?.kind === 'fog' || target?.kind === 'rumor'
  const playing = state.outcome === 'playing'   // 끝난 전투에는 예고를 보이지 않는다
  const poses = usePoses(state)
  const missed = state.events.find((e) => e.kind === 'question' && e.grade !== 'hit')
  const missedQ = missed?.kind === 'question' ? p.questions.find((q) => q.id === missed.questionId) : undefined

  return (
    <div className="battle">
      <div className="battle-text">
        <PassagePanel title={p.title} sentences={p.sentences} fog={fog} selected={evidence}
          onToggle={picking ? toggle : undefined} />
      </div>
      <div className="battle-field">
        <EnemyPanel name={p.enemy.name} sprite={p.enemy.sprite} pose={poses.enemy} hp={state.enemy.hp} maxHp={state.enemy.maxHp}
          nextAttack={playing ? nextEnemyAttack(state) : undefined} shield={playing && hasShield(state)}
          rumor={!playing ? undefined : state.rumor === 'active' ? '헛소문: 적 공격 +2 (반박하면 사라짐)' : state.rumor === 'spread' ? '헛소문이 퍼짐: 이 층 동안 적 공격 +2' : undefined}
          line={state.turn === 1 && state.events.length === 0 ? p.enemy.introLine : undefined} />
        <PlayerPanel pose={poses.reader} hp={state.player.hp} maxHp={state.player.maxHp} block={state.player.block}
          incoming={playing ? incomingDamage(state) : undefined} think={state.think} maxThink={BALANCE.thinkPerTurn} />

        {state.events.length > 0 && (
          <ul className="events" role="status">
            {state.events.map((e, i) => <li key={i}><Icon name={eventIcon(e)} />{eventText(e)}</li>)}
          </ul>
        )}
        {missed?.kind === 'question' && missedQ && !target && (
          <AnswerReveal question={missedQ} grade={missed.grade} fogWords={activeFogWords(state)}
            order={state.optionOrder[missedQ.id] ?? missedQ.options.map((_, i) => i)} />
        )}

        {state.outcome === 'won' ? (
          <div className="overlay overlay-won">
            <Sprite name="seal" scale={2} cycle={{ count: 3, ms: 720, once: true }} label="안개를 호리병에 봉인했어" />
            <p className="unit-line">“{p.enemy.sealLine}”</p>
            <p><strong>{p.enemy.name}</strong> — {STORY.sealed}</p>
            <button type="button" autoFocus onClick={() => { close(); onWon() }}>{lastFloor ? '탑 완료' : '보상 받기'}</button>
          </div>
        ) : state.outcome === 'lost' ? (
          <div className="overlay">
            <p>{STORY.defeatLine}</p>
            <button type="button" autoFocus onClick={() => { close(); onRetry() }}>이 층 다시 하기</button>
          </div>
        ) : target ? (
          <ActivePanel state={state} target={target} evidence={evidence} dispatch={send} act={dispatch} onClose={close} />
        ) : (
          <>
            <Hand cards={buildHandCards(state)} onPick={(c) => open(c.target)} />
            <WordPouch deck={state.deck} uses={state.wordUses} think={state.think} onPick={(wordId) => open({ kind: 'word', wordId })} />
            <div className="row">
              <span className="turn">{state.turn}턴</span>
              <button type="button" className="end-turn" onClick={() => send({ type: 'endTurn' })}>턴 끝내기</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
