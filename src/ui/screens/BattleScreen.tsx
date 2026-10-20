import { useState } from 'react'
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
  onRestart: () => void
}

/** 전투 화면. 상태는 그리기만 하고 바꾸는 건 action으로만 */
export default function BattleScreen({ state, dispatch, onRestart }: Props) {
  const [target, setTarget] = useState<PanelTarget | null>(null)
  const [evidence, setEvidence] = useState<number[]>([])
  const p = state.passage

  const close = () => { setTarget(null); setEvidence([]) }
  const send = (a: Action) => { dispatch(a); close() }
  const open = (t: PanelTarget) => { setEvidence([]); setTarget(t) }
  const toggle = (i: number) => setEvidence((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]))
  const fog = p.lockedWords.filter((_, i) => !state.fogCleared.includes(i))
  const picking = target?.kind === 'question'

  return (
    <div className="battle">
      <div className="battle-text">
        <PassagePanel title={p.title} sentences={p.sentences} fog={fog} selected={evidence}
          onToggle={picking ? toggle : undefined} />
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
            <button type="button" onClick={() => { close(); onRestart() }}>이 층 다시 하기</button>
          </div>
        ) : target ? (
          <ActivePanel state={state} target={target} evidence={evidence} dispatch={send} onClose={close} />
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
