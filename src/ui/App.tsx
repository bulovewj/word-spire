import { useState } from 'react'
import { checkContent, passages, starterDeck } from '../content'
import { BALANCE } from '../engine/balance'
import { createBattle, reduce, type Action, type GameState } from '../engine/state'
import BattleScreen from './screens/BattleScreen'

export const GAME_TITLE = '낱말탑'

const contentErrors = checkContent()

function newBattle(): GameState | null {
  const passage = passages[0]
  if (!passage) return null
  return createBattle({
    passage, deck: starterDeck, seed: Date.now() >>> 0,
    playerHp: BALANCE.playerMaxHp, playerMaxHp: BALANCE.playerMaxHp,
  })
}

/** 게임 상태는 여기 한곳에. 화면은 그리기와 action 보내기만 한다 (M8 저장도 여기서) */
export default function App() {
  const [game, setGame] = useState<GameState | null>(newBattle)
  const dispatch = (a: Action) => setGame((s) => (s ? reduce(s, a) : s))

  if (contentErrors.length > 0 || !game) {
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
      <BattleScreen state={game} dispatch={dispatch} onRestart={() => setGame(newBattle())} />
    </main>
  )
}
