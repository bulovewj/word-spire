import { BALANCE } from '../../engine/balance'
import { hasShield, incomingDamage, nextEnemyAttack, type GameState } from '../../engine/state'
import Actor from '../components/Actor'
import Sprite from '../components/Sprite'
import { isSheetName } from '../sprites/sprites'
import type { KeyedFloat, LiveFx } from './useBattleFx'
import { EnemyChips, EnemyPlate, PlayerPlate, type EnemyChip } from './UnitPlate'
import './stage.css'
import './stage-bg.css'

const BIG_ATTACK = 9          // 이만큼 이상이면 '큰 공격!'으로 알린다 (연출만)

interface Props {
  state: GameState
  poses: { reader: string; enemy: string }
  fx: LiveFx
  floor: number
  boss: boolean               // 우두머리 층: 그림이 크다
}

function Floats({ items }: { items: KeyedFloat[] }) {
  return (
    <div className="floats" aria-hidden="true">
      {items.map((f, i) => <span key={f.id} className={`float float-${f.tone}`} style={{ animationDelay: `${i * 140}ms` }}>{f.text}</span>)}
    </div>
  )
}

function enemyChips(s: GameState): EnemyChip[] {
  const chips: EnemyChip[] = []
  if (hasShield(s)) chips.push({ key: 'fog', text: `안개 보호막: 내 공격 -${BALANCE.fogShield}`, tone: 'mist', title: '안개 걷기 카드로 보호막을 없앨 수 있어' })
  if (s.rumor === 'active') chips.push({ key: 'rumor', text: `헛소문 +${BALANCE.rumorAttackBonus}`, tone: 'warn', title: '헛소문이 살아 있는 동안 요괴의 공격이 세져. 반박하면 사라져' })
  if (s.rumor === 'spread') chips.push({ key: 'rumor', text: `퍼진 소문 +${BALANCE.rumorAttackBonus}`, tone: 'warn', title: '소문이 퍼져서 이 층 동안 요괴의 공격이 세져' })
  if (s.enemy.attackBonus > 0) chips.push({ key: 'sure', text: `틀린 확신 +${s.enemy.attackBonus}`, tone: 'warn', title: '확실하다고 했는데 틀려서 다음 공격이 세졌어' })
  if (s.enemy.ease > 0) chips.push({ key: 'ease', text: `지친 요괴 -${s.enemy.ease}`, tone: 'ease', title: '다시 도전해서 요괴의 공격이 약해졌어' })
  return chips
}

/** 전투 무대: 밤 서고에서 나와 요괴가 마주 본다. 상태를 그리기만 한다 */
export default function Stage({ state, poses, fx, floor, boss }: Props) {
  const p = state.passage
  const playing = state.outcome === 'playing'
  const won = state.outcome === 'won'
  const attack = nextEnemyAttack(state)
  const fresh = state.turn === 1 && state.events.length === 0
  const line = fx.line ?? (fresh && playing ? p.enemy.introLine : undefined)
  const cls = ['stage', `stage-f${floor}`, boss ? 'is-boss' : '', fx.shake ? 'is-shake' : '', playing && hasShield(state) ? 'has-mist' : '']

  return (
    <section className={cls.filter(Boolean).join(' ')} aria-label="전투 무대">
      <div className="stage-bg" aria-hidden="true">
        <span className="bg-window" /><span className="bg-shelf bg-shelf-l" /><span className="bg-shelf bg-shelf-r" />
        <span className="bg-lantern bg-lantern-l" /><span className="bg-lantern bg-lantern-r" />
        <span className="bg-floor" /><span className="bg-mist" />
      </div>

      <div className="stage-side stage-player">
        <PlayerPlate hp={state.player.hp} maxHp={state.player.maxHp} block={state.player.block}
          incoming={playing ? incomingDamage(state) : undefined} combo={state.combo} />
        <div className={`stage-actor${fx.flash === 'player' ? ' is-flash' : ''}${state.player.block > 0 && playing ? ' is-guarded' : ''}`}>
          <Actor name="reader" pose={poses.reader} />
          <Floats items={fx.floats.filter((f) => f.side === 'player')} />
        </div>
      </div>

      <div className="stage-side stage-enemy">
        <EnemyPlate name={p.enemy.name} hp={state.enemy.hp} maxHp={state.enemy.maxHp} attack={playing ? attack : undefined} big={attack >= BIG_ATTACK} />
        {playing && <EnemyChips chips={enemyChips(state)} />}
        <div className={`stage-actor${fx.flash === 'enemy' ? ' is-flash' : ''}`}>
          {won
            ? <Sprite name="seal" play={{ count: 3, ms: 720 }} label="요괴를 호리병에 봉인했어" />
            : isSheetName(p.enemy.sprite) && <Actor name={p.enemy.sprite} pose={poses.enemy} />}
          <Floats items={fx.floats.filter((f) => f.side === 'enemy')} />
        </div>
      </div>
      {line && <p className="bubble" role="status"><span className="bubble-who">{p.enemy.name}</span>{line}</p>}
    </section>
  )
}
