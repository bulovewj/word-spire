import { Icon } from '../components/Sprite'
import Stamp, { CARD_KIND } from '../components/Stamp'
import type { HandCard } from './handCards'
import './hand.css'

interface Props {
  cards: HandCard[]
  onPick: (card: HandCard) => void
}

/** 생각력 비용: 마패 표식을 비용만큼 */
export function Cost({ cost }: { cost: number }) {
  return (
    <span className="cost" aria-hidden="true">
      {Array.from({ length: cost }, (_, i) => <Icon key={i} name="think" />)}
    </span>
  )
}

/** 손패: 부적패 모양 카드. 고르면 그 카드의 패널이 열린다 */
export default function Hand({ cards, onPick }: Props) {
  return (
    <ul className="hand" aria-label="손패">
      {cards.map((c, i) => {
        const info = CARD_KIND[c.kind]
        const question = c.kind === 'literal' || c.kind === 'connect' || c.kind === 'author'
        return (
          <li key={c.key} style={{ animationDelay: `${i * 45}ms` }}>
            <button type="button" className={`card card-${c.kind}${c.glow ? ' is-glow' : ''}`} disabled={c.disabled}
              data-card={c.key} title={c.detail}
              aria-label={`${question ? '질문 ' : ''}${info.title}, 생각력 ${c.cost}, ${c.power}. ${c.detail}${c.note ? `. ${c.note}` : ''}`}
              onClick={() => onPick(c)}>
              <span className="card-top"><Cost cost={c.cost} /><span className="card-power">{c.power}</span></span>
              <Stamp kind={c.kind} size="lg" />
              <span className="card-title">{info.title}</span>
              <span className="card-caption">{c.note ?? (question ? '질문' : info.caption)}</span>
              {question && <span className="card-detail">{c.detail}</span>}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
