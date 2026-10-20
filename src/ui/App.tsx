import { useState } from 'react'
import { checkContent, passages, starterDeck } from '../content'
import { BALANCE } from '../engine/balance'
import { createBattle } from '../engine/state'
import BattleScreen from './screens/BattleScreen'

export const GAME_TITLE = '낱말탑'

const contentErrors = checkContent()

function newBattle() {
  const passage = passages[0]
  if (!passage) return null
  return createBattle({
    passage, deck: starterDeck, seed: Date.now() >>> 0,
    playerHp: BALANCE.playerMaxHp, playerMaxHp: BALANCE.playerMaxHp,
  })
}

export default function App() {
  const [battle, setBattle] = useState(newBattle)
  const [round, setRound] = useState(0)

  if (contentErrors.length > 0 || !battle) {
    return (
      <main style={{ padding: 16 }}>
        <h1>데이터 오류</h1>
        <ul>{contentErrors.map((e) => <li key={e}>{e}</li>)}</ul>
      </main>
    )
  }

  return (
    <main>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: '12px 12px 0' }}>{GAME_TITLE}</h1>
      <BattleScreen key={round} initial={battle} onRestart={() => { setBattle(newBattle()); setRound((r) => r + 1) }} />
    </main>
  )
}
