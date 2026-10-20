interface BarProps {
  label: string
  hp: number
  maxHp: number
  color: string
  preview?: number          // 곧 깎일 양(받을 피해 예고)
}

export function HpBar({ label, hp, maxHp, color, preview = 0 }: BarProps) {
  const pct = (n: number) => `${Math.max(0, Math.min(100, (n / maxHp) * 100))}%`
  const shown = Math.min(preview, hp)
  return (
    <div className="hpbar" role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={maxHp} aria-valuenow={hp}>
      <div className="hpbar-fill" style={{ width: pct(hp - shown), background: color }} />
      {shown > 0 && <div className="hpbar-preview" style={{ left: pct(hp - shown), width: pct(shown) }} />}
      <span className="hpbar-text">{hp} / {maxHp}</span>
    </div>
  )
}

interface EnemyProps { name: string; hp: number; maxHp: number; nextAttack: number; shield: boolean; line?: string }

export function EnemyPanel({ name, hp, maxHp, nextAttack, shield, line }: EnemyProps) {
  return (
    <section className="unit unit-enemy" aria-label="적">
      <div className="unit-head">
        <strong>{name}</strong>
        <span className="intent">다음 공격 ⚔ {nextAttack}</span>
      </div>
      {line && <p className="unit-line">“{line}”</p>}
      <HpBar label="적 체력" hp={hp} maxHp={maxHp} color="var(--color-hp)" />
      {shield && <p className="unit-note">안개 보호막: 질문 피해 -2</p>}
    </section>
  )
}

interface PlayerProps { hp: number; maxHp: number; block: number; incoming: number; think: number; maxThink: number }

export function PlayerPanel({ hp, maxHp, block, incoming, think, maxThink }: PlayerProps) {
  return (
    <section className="unit unit-player" aria-label="나">
      <div className="unit-head">
        <strong>나</strong>
        <span>방어 🛡 {block}</span>
        <span className="incoming">받을 피해 {incoming}</span>
      </div>
      <HpBar label="내 체력" hp={hp} maxHp={maxHp} color="var(--color-good)" preview={incoming} />
      <div className="think" aria-label={`생각력 ${think} / ${maxThink}`}>
        {Array.from({ length: maxThink }, (_, i) => (
          <span key={i} className={`gem${i < think ? ' is-on' : ''}`} />
        ))}
        <span className="think-text">생각력 {think}</span>
      </div>
    </section>
  )
}
