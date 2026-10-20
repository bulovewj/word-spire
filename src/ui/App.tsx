import { useEffect, useState } from 'react'
import { checkContent, passages, starterDeck } from '../content'
import { BALANCE } from '../engine/balance'
import { createBattle, reduce, type Action, type GameState } from '../engine/state'
import { prewarmTower } from '../grading/auto'
import { embedder } from '../grading/embedder'
import GradingBadge from './components/GradingBadge'
import BattleScreen from './screens/BattleScreen'
import GradingCheck from './screens/GradingCheck'

export const GAME_TITLE = '낱말탑'

const contentErrors = checkContent()
const devMode = new URLSearchParams(window.location.search).get('dev')

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
  const towerId = game?.passage.towerId

  // 의미 모델 내려받기는 앱을 열자마자 시작. 그동안은 간이 채점
  useEffect(() => embedder.start(), [])
  // 모델이 준비되면(또는 이미 준비됐으면) 이 탑의 비교 대상 뜻을 미리 계산
  useEffect(() => {
    if (!towerId) return
    prewarmTower(towerId)
    return embedder.subscribe((s) => { if (s.state === 'ready') prewarmTower(towerId) })
  }, [towerId])

  if (devMode === 'grading') return <GradingCheck />

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
      <header style={{ display: 'flex', gap: 12, alignItems: 'center', margin: '12px 12px 0' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>{GAME_TITLE}</h1>
        <GradingBadge />
      </header>
      <BattleScreen state={game} dispatch={dispatch} onRestart={() => setGame(newBattle())} />
    </main>
  )
}
