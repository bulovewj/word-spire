import { useEffect, useState } from 'react'
import { checkContent, findTower, passages, starterFor, towerFloors, towers } from '../content'
import { starsOf } from '../engine/profile'
import BattleScreen from './screens/BattleScreen'
import BookScreen from './screens/BookScreen'
import CompleteScreen from './screens/CompleteScreen'
import GradingCheck from './screens/GradingCheck'
import MapScreen from './screens/MapScreen'
import PrologueScreen from './screens/PrologueScreen'
import RewardScreen from './screens/RewardScreen'
import StatsScreen from './screens/StatsScreen'
import TeacherScreen from './screens/TeacherScreen'
import TitleScreen from './screens/TitleScreen'
import TowerScreen from './screens/TowerScreen'
import { play, setSound } from './sfx'
import { useGame } from './useGame'

export const GAME_TITLE = '낱말탑'

const contentErrors = checkContent()
const devMode = new URLSearchParams(window.location.search).get('dev')
const ALL_PASSAGES = passages.map((p) => p.id)

/** title 처음 · prologue 이야기 · map 닫힌궁(탑 고르기) · run 탑 오르는 중 · book 부적첩 · stats 내 기록 · teacher 선생님 */
type View = 'title' | 'prologue' | 'map' | 'run' | 'book' | 'stats' | 'teacher'

/** 어느 화면을 보일지만 정한다. 게임 상태는 useGame 한곳에 */
export default function App() {
  const g = useGame()
  const [view, setView] = useState<View>('title')
  const [from, setFrom] = useState<View>('title')   // 부적첩에서 돌아갈 곳
  useEffect(() => setSound(g.settings.sound), [g.settings.sound])

  if (devMode === 'grading') return <GradingCheck />
  if (contentErrors.length > 0) {
    return (
      <main style={{ padding: 16 }}>
        <h1>데이터 오류</h1>
        <ul>{contentErrors.map((e) => <li key={e}>{e}</li>)}</ul>
      </main>
    )
  }

  const { run, profile } = g
  const tower = run ? findTower(run.towerId) : undefined
  const active = run && tower && run.phase !== 'complete' ? run : null   // 이어할 수 있는 진행
  const go = (v: View) => { play('tap'); setView(v) }
  const book = (back: View) => { setFrom(back); go('book') }
  const adventure = () => go(profile.seen.includes('prologue') ? 'map' : 'prologue')
  const toggleSound = () => { g.toggleSound(); if (!g.settings.sound) { setSound(true); play('spark') } }

  if (view === 'teacher') return <TeacherScreen onBack={() => go('title')} />
  if (view === 'stats') return <StatsScreen stats={g.stats} name={g.name} onName={g.setName} onBack={() => go('title')} />
  if (view === 'book') return <BookScreen profile={profile} onBack={() => go(from)} />
  if (view === 'prologue') return <PrologueScreen onDone={() => { g.seen('prologue'); go('map') }} />
  if (view === 'map') {
    return (
      <MapScreen towers={towers} profile={profile} run={active} onBack={() => go('title')} onBook={() => book('map')}
        onContinue={() => go('run')} onStart={(id) => { g.start(id); go('run') }} />
    )
  }
  if (view === 'run' && run && tower) {
    const floors = towerFloors(run.towerId)
    if (run.phase === 'intro') {
      return <TowerScreen tower={tower} floors={floors} profile={profile} deck={run.deck} onBack={() => go('map')} onStart={() => g.send({ type: 'startFloor' })} />
    }
    if (run.phase === 'reward') {
      return (
        <RewardScreen run={run} tower={tower.title} next={floors[run.floor - 1]}
          onPick={(index) => { play('spark'); g.send({ type: 'chooseReward', index }) }} onNext={() => g.send({ type: 'startFloor' })} />
      )
    }
    if (run.phase === 'complete') {
      return (
        <CompleteScreen run={run} tower={tower} floors={floors} starter={starterFor(tower.id)}
          allSealed={towers.every((t) => profile.seals.includes(t.id))} onHome={() => { g.drop(); go('map') }} />
      )
    }
    if (run.battle) {
      return (
        <BattleScreen key={`${run.seed}`} state={run.battle} tower={tower.title} floor={run.floor} floors={floors.length} retries={run.retries}
          sound={g.settings.sound} onSound={toggleSound} coach={!profile.seen.includes('coach')} onCoachDone={() => g.seen('coach')}
          dispatch={(action) => g.send({ type: 'battle', action })}
          onWon={() => g.send({ type: 'finishFloor' })} onRetry={() => g.send({ type: 'retryFloor' })} onExit={() => go('map')} />
      )
    }
  }
  return (
    <TitleScreen saved={active && tower ? { tower: tower.title, floor: active.floor } : null}
      stars={starsOf(profile, ALL_PASSAGES)} seals={profile.seals.length} sound={g.settings.sound} onSound={toggleSound}
      onContinue={() => go('run')} onAdventure={adventure} onBook={() => book('title')} onStats={() => go('stats')} onTeacher={() => go('teacher')} />
  )
}
