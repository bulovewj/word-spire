import { useState } from 'react'
import { STORY } from '../../content/story'
import { BALANCE } from '../../engine/balance'
import { hasShield, incomingDamage, nextEnemyAttack, type Action, type GameState } from '../../engine/state'
import { EnemyPanel, PlayerPanel } from '../components/BattleBars'
import Hand from '../components/Hand'
import PassagePanel from '../components/PassagePanel'
import { eventText } from '../eventText'
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
    : target?.kind === 'fog' ? 1 : 0
  // 근거는 정해진 개수까지만 고를 수 있다(1개면 다른 문장을 누르면 바뀜). 바꾸려면 고른 문장을 다시 눌러 뺀다
  const toggle = (i: number) => setEvidence((s) =>
    s.includes(i) ? s.filter((x) => x !== i) : s.length < cap ? [...s, i] : cap === 1 ? [i] : s)
  const fog = p.lockedWords.filter((_, i) => !state.fogCleared.includes(i))
  const picking = target?.kind === 'question' || target?.kind === 'fog'
  const playing = state.outcome === 'playing'   // 끝난 전투에는 예고를 보이지 않는다

  return (
    <div className="battle">
      <div className="battle-text">
        <PassagePanel title={p.title} sentences={p.sentences} fog={fog} selected={evidence}
          onToggle={picking ? toggle : undefined} />
      </div>
      <div className="battle-field">
        <EnemyPanel name={p.enemy.name} hp={state.enemy.hp} maxHp={state.enemy.maxHp}
          nextAttack={playing ? nextEnemyAttack(state) : undefined} shield={playing && hasShield(state)}
          line={state.turn === 1 && state.events.length === 0 ? p.enemy.introLine : undefined} />
        <PlayerPanel hp={state.player.hp} maxHp={state.player.maxHp} block={state.player.block}
          incoming={playing ? incomingDamage(state) : undefined} think={state.think} maxThink={BALANCE.thinkPerTurn} />

        {state.events.length > 0 && (
          <ul className="events" role="status">
            {state.events.map((e, i) => <li key={i}>{eventText(e)}</li>)}
          </ul>
        )}

        {state.outcome === 'won' ? (
          <div className="overlay overlay-won">
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
