import { Icon } from '../components/Sprite'
import './plate.css'

interface HpProps {
  label: string
  hp: number
  maxHp: number
  tone: 'player' | 'enemy'
  preview?: number          // 곧 깎일 양 (턴 끝에 받을 피해 예고)
}

/** 체력바. 받을 피해는 줄무늬 칸과 -N으로 미리 보여 준다 (기획안 3장) */
export function HpBar({ label, hp, maxHp, tone, preview = 0 }: HpProps) {
  const pct = (n: number) => `${Math.max(0, Math.min(100, (n / maxHp) * 100))}%`
  const shown = Math.min(preview, hp)
  return (
    <div className={`hp hp-${tone}`} role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={maxHp} aria-valuenow={hp}>
      <div className="hp-fill" style={{ width: pct(hp - shown) }} />
      {shown > 0 && <div className="hp-preview" style={{ left: pct(hp - shown), width: pct(shown) }}>-{shown}</div>}
      <span className="hp-text">{hp} / {maxHp}</span>
    </div>
  )
}

interface PlayerProps { hp: number; maxHp: number; block: number; incoming?: number; combo: number }

export function PlayerPlate({ hp, maxHp, block, incoming, combo }: PlayerProps) {
  return (
    <div className="plate plate-player">
      <div className="plate-head">
        <strong className="plate-name">나</strong>
        <span className={`chip chip-block${block > 0 ? ' is-on' : ''}`} aria-label={`방어 ${block}`}>
          <Icon name="defense" />방어 {block}
        </span>
        {combo >= 2 && <span className="chip chip-combo">연속 정타 {combo}</span>}
      </div>
      <HpBar label="내 체력" hp={hp} maxHp={maxHp} tone="player" preview={incoming} />
    </div>
  )
}

export interface EnemyChip { key: string; text: string; tone: 'mist' | 'warn' | 'ease'; title: string }

interface EnemyProps { name: string; hp: number; maxHp: number; attack?: number; big?: boolean }

export function EnemyPlate({ name, hp, maxHp, attack, big = false }: EnemyProps) {
  return (
    <div className="plate plate-enemy">
      <div className="plate-head">
        <strong className="plate-name">{name}</strong>
        {attack !== undefined && <Intent attack={attack} big={big} />}
      </div>
      <HpBar label="요괴 체력" hp={hp} maxHp={maxHp} tone="enemy" />
    </div>
  )
}

/** 요괴에게 걸린 것들(보호막·소문·벌·지침). 상태 패 아래에, 좁은 무대에서는 무대 아래 구석에 */
export function EnemyChips({ chips }: { chips: EnemyChip[] }) {
  if (chips.length === 0) return null
  return (
    <ul className="plate-chips" aria-label="요괴 상태">
      {chips.map((c) => <li key={c.key} className={`chip chip-${c.tone}`} title={c.title}>{c.text}</li>)}
    </ul>
  )
}

/** 요괴의 다음 공격 예고. 큰 공격은 따로 알린다 */
function Intent({ attack, big }: { attack: number; big: boolean }) {
  return (
    <div className={`intent${big ? ' is-big' : ''}`} aria-label={`요괴의 다음 공격 ${attack}`}>
      <span className="intent-label">{big ? '큰 공격!' : '다음 공격'}</span>
      <span className="intent-num"><Icon name="damage" scale={2} />{attack}</span>
    </div>
  )
}
