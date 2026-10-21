import { findWord } from '../../content'
import { BALANCE } from '../../engine/balance'
import './WordPouch.css'

interface Props {
  deck: string[]
  uses: Record<string, number>   // 낱말별 이 탑에 남은 횟수
  think: number
  onPick: (wordId: string) => void
}

/** 내 낱말 묶음. 낱말을 골라 뜻을 쓰면 방어. 낱말마다 한 탑에서 정해진 횟수만 (기획안 6-1) */
export default function WordPouch({ deck, uses, think, onPick }: Props) {
  const affordable = think >= BALANCE.wordCardCost
  return (
    <section className="pouch" aria-label="내 낱말 묶음">
      <p className="pouch-head">
        <strong>낱말로 방어</strong> · 생각력 {BALANCE.wordCardCost} · 뜻을 쓰면 방어 +{BALANCE.wordCardBlock}
        <span className="pouch-note"> (낱말마다 한 탑에 {BALANCE.wordUsesPerTower}번)</span>
      </p>
      <ul className="pouch-list">
        {deck.map((id) => {
          const left = uses[id] ?? 0
          return (
            <li key={id}>
              <button type="button" className="pouch-word" disabled={!affordable || left === 0} onClick={() => onPick(id)}>
                <span className="pouch-name">{findWord(id)?.word ?? id}</span>
                <span className="pouch-uses" aria-label={`남은 횟수 ${left}`}>
                  {'●'.repeat(left)}{'○'.repeat(Math.max(0, BALANCE.wordUsesPerTower - left))} {left === 0 ? '다 씀' : `${left}번`}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
