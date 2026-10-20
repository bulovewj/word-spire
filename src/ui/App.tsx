import { useEffect, useState } from 'react'
import { checkContent, findPassage, findTower, starterDeck, towerFloors, towers } from '../content'
import { newRun, reduceRun, type RunAction, type RunState } from '../engine/run'
import { prewarmTower } from '../grading/auto'
import { embedder } from '../grading/embedder'
import { clearRun, loadRun, saveRun } from '../storage/store'
import GradingBadge from './components/GradingBadge'
import BattleScreen from './screens/BattleScreen'
import GradingCheck from './screens/GradingCheck'
import { CompleteScreen, IntroScreen, RewardScreen, TitleScreen } from './screens/RunScreens'

export const GAME_TITLE = '낱말탑'

const contentErrors = checkContent()
const devMode = new URLSearchParams(window.location.search).get('dev')

/** 게임 상태는 여기 한곳에. 화면은 그리기와 action 보내기만 하고, 매 action 뒤 자동 저장 */
export default function App() {
  const [run, setRun] = useState<RunState | null>(null)
  const [saved, setSaved] = useState<RunState | null>(() => loadRun(findPassage))
  const send = (a: RunAction) => setRun((r) => (r ? reduceRun(r, a, towerFloors(r.towerId)) : r))
  const towerId = run?.towerId

  useEffect(() => embedder.start(), [])
  useEffect(() => { if (run) saveRun(run) }, [run])
  // 모델이 준비되면(또는 이미 준비됐으면) 이 탑의 뜻·요약 기준 문장을 미리 계산
  useEffect(() => {
    if (!towerId) return
    prewarmTower(towerId)
    return embedder.subscribe((s) => { if (s.state === 'ready') prewarmTower(towerId) })
  }, [towerId])

  if (devMode === 'grading') return <GradingCheck />
  if (contentErrors.length > 0) {
    return (
      <main style={{ padding: 16 }}>
        <h1>데이터 오류</h1>
        <ul>{contentErrors.map((e) => <li key={e}>{e}</li>)}</ul>
      </main>
    )
  }

  const home = () => { clearRun(); setSaved(null); setRun(null) }
  const tower = run ? findTower(run.towerId) : undefined
  let body
  if (!run || !tower) {
    body = (
      <TitleScreen towers={towers} saved={saved && saved.phase !== 'complete' ? saved : null}
        onContinue={() => setRun(saved)} onStart={(id) => setRun(newRun(id, starterDeck, Date.now() >>> 0))} />
    )
  } else if (run.phase === 'intro') {
    body = <IntroScreen tower={tower} onNext={() => send({ type: 'startFloor' })} />
  } else if (run.phase === 'reward') {
    body = <RewardScreen run={run} onNext={() => send({ type: 'startFloor' })} />
  } else if (run.phase === 'complete') {
    body = <CompleteScreen run={run} tower={tower} newWords={run.deck.filter((id) => !starterDeck.includes(id))} onHome={home} />
  } else if (run.battle) {
    body = (
      <BattleScreen key={run.seed} state={run.battle} lastFloor={run.floor >= towerFloors(run.towerId).length}
        dispatch={(action) => send({ type: 'battle', action })}
        onWon={() => send({ type: 'finishFloor' })} onRetry={() => send({ type: 'retryFloor' })} />
    )
  }

  return (
    <main>
      <header style={{ display: 'flex', gap: 12, alignItems: 'center', margin: '12px 12px 0' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>{GAME_TITLE}</h1>
        {tower && <span>{tower.title} 탑 {run?.phase === 'complete' ? '완료' : `${run?.floor}층`}</span>}
        <GradingBadge />
      </header>
      {body}
    </main>
  )
}
