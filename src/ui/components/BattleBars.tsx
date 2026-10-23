import { isSheetName } from '../sprites/sprites'
import Actor from './Actor'
import { Icon } from './Sprite'
import './BattleBars.css'

interface BarProps {
  label: string
  hp: number
  maxHp: number
  color: string
  preview?: number          // 곧 깎일 양(받을 피해 예고)
  guarded?: boolean         // 방어가 있으면 파란 테두리
}

export function HpBar({ label, hp, maxHp, color, preview = 0, guarded = false }: BarProps) {
  const pct = (n: number) => `${Math.max(0, Math.min(100, (n / maxHp) * 100))}%`
  const shown = Math.min(preview, hp)
  return (
    <div className={`hpbar${guarded ? ' is-guarded' : ''}`} role="meter" aria-label={label}
      aria-valuemin={0} aria-valuemax={maxHp} aria-valuenow={hp}>
      <div className="hpbar-fill" style={{ width: pct(hp - shown), background: color }} />
      {shown > 0 && <div className="hpbar-preview" style={{ left: pct(hp - shown), width: pct(shown) }}>-{shown}</div>}
      <span className="hpbar-text">{hp} / {maxHp}</span>
    </div>
  )
}

interface EnemyProps {
  name: string; sprite: string; pose: string; hp: number; maxHp: number
  nextAttack?: number; shield: boolean; line?: string; rumor?: string
}

export function EnemyPanel({ name, sprite, pose, hp, maxHp, nextAttack, shield, line, rumor }: EnemyProps) {
  return (
    <section className="unit unit-enemy" aria-label="적">
      <div className="unit-art">
        {isSheetName(sprite) && pose !== 'sealed' && (
          <Actor name={sprite} pose={pose} />
        )}
      </div>
      <div className="unit-info">
        <div className="unit-head">
          <strong>{name}</strong>
          {nextAttack !== undefined && <span className="intent"><Icon name="damage" />다음 공격 피해 {nextAttack}</span>}
        </div>
        {line && <p className="unit-line">“{line}”</p>}
        <HpBar label="적 체력" hp={hp} maxHp={maxHp} color="var(--color-hp)" />
        {shield && <p className="unit-note"><Icon name="fog" />안개 보호막: 내 질문 피해 -2</p>}
        {rumor && <p className="unit-note">{rumor}</p>}
      </div>
    </section>
  )
}

interface PlayerProps { pose: string; hp: number; maxHp: number; block: number; incoming?: number; think: number; maxThink: number }

export function PlayerPanel({ pose, hp, maxHp, block, incoming, think, maxThink }: PlayerProps) {
  return (
    <section className={`unit unit-player${block > 0 ? ' is-guarded' : ''}`} aria-label="나">
      <div className="unit-art"><Actor name="reader" pose={pose} /></div>
      <div className="unit-info">
        <div className="unit-head">
          <strong>나</strong>
          <span className={`block-badge${block > 0 ? ' is-on' : ''}`}><Icon name="defense" />방어 {block}</span>
        </div>
        <HpBar label="내 체력" hp={hp} maxHp={maxHp} color="var(--color-good)" preview={incoming} guarded={block > 0} />
        {incoming !== undefined && (
          <p className="incoming">
            <Icon name="damage" />턴 끝에 받을 피해 {incoming}
            {incoming > 0 && <span className="forecast"> · 체력 {hp} → {Math.max(0, hp - incoming)}</span>}
          </p>
        )}
        <div className="think" aria-label={`생각력 ${think} / ${maxThink}`}>
          {Array.from({ length: maxThink }, (_, i) => (
            <span key={i} className={`gem${i < think ? ' is-on' : ''}`}><Icon name="think" scale={2} /></span>
          ))}
          <span className="think-text">생각력 {think} / {maxThink}</span>
        </div>
      </div>
    </section>
  )
}
