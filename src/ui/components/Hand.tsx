export interface HandCard {
  key: string
  title: string
  sub: string
  cost: number
  kind: 'question' | 'fog' | 'summary' | 'word'
  disabled: boolean
  badge?: string
}

interface Props {
  cards: HandCard[]
  onPick: (key: string) => void
}

export default function Hand({ cards, onPick }: Props) {
  return (
    <div className="hand" role="list" aria-label="손패">
      {cards.map((c) => (
        <button
          key={c.key}
          type="button"
          role="listitem"
          className={`card card-${c.kind}`}
          disabled={c.disabled}
          onClick={() => onPick(c.key)}
        >
          <span className="card-cost">{c.cost}</span>
          <span className="card-title">{c.title}</span>
          <span className="card-sub">{c.sub}</span>
          {c.badge && <span className="card-badge">{c.badge}</span>}
        </button>
      ))}
    </div>
  )
}
