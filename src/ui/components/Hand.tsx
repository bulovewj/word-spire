import type { PanelTarget } from '../screens/handCards'

export interface HandCard {
  key: string
  title: string
  sub: string
  cost: number
  kind: 'question' | 'fog' | 'summary' | 'rumor'
  target: PanelTarget
  disabled: boolean
}

interface Props {
  cards: HandCard[]
  onPick: (card: HandCard) => void
}

export default function Hand({ cards, onPick }: Props) {
  return (
    <ul className="hand" aria-label="손패">
      {cards.map((c) => (
        <li key={c.key}>
          <button type="button" className={`card card-${c.kind}`} disabled={c.disabled} onClick={() => onPick(c)}>
            <span className="card-cost">생각력 {c.cost}</span>
            <span className="card-title">{c.title}</span>
            <span className="card-sub">{c.sub}</span>
          </button>
        </li>
      ))}
    </ul>
  )
}
