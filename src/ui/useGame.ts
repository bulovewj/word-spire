import { useEffect, useMemo, useRef, useState } from 'react'
import { findPassage, rewardWordPool, starterFor, towerFloors } from '../content'
import { afterBattle, afterFloor, afterTower, collectWords, markSeen, type Profile } from '../engine/profile'
import { addRecords, judgementsFrom } from '../engine/records'
import { newRun, recordScope, reduceRun, type RunAction, type RunState } from '../engine/run'
import { computeStats } from '../engine/stats'
import { prewarmTower } from '../grading/auto'
import { embedder } from '../grading/embedder'
import {
  clearRun, loadName, loadProfile, loadRecords, loadRun, loadSettings, saveName, saveProfile, saveRecords, saveRun, saveSettings,
} from '../storage/store'

/**
 * 게임 상태는 여기 한곳에: 지금 오르는 탑(진행), 성장 기록, 판정 기록, 이름, 설정.
 * 화면은 그리기와 action 보내기만 하고, 바뀔 때마다 기기에 저장한다
 */
export function useGame() {
  const [run, setRunState] = useState<RunState | null>(() => loadRun(findPassage))
  // 같은 렌더 안에서 두 번 눌러도 최신 진행에 이어 적용하도록 (기록이 두 번 쌓이지 않게)
  const runRef = useRef<RunState | null>(run)
  const setRun = (r: RunState | null) => { runRef.current = r; setRunState(r) }
  const [profile, setProfile] = useState<Profile>(loadProfile)
  const [records, setRecords] = useState(loadRecords)
  const [name, setName] = useState(loadName)
  const [settings, setSettings] = useState(loadSettings)
  const stats = useMemo(() => computeStats(records), [records])
  const towerId = run?.towerId

  useEffect(() => embedder.start(), [])
  useEffect(() => { if (run) saveRun(run) }, [run])
  useEffect(() => saveProfile(profile), [profile])
  useEffect(() => saveRecords(records), [records])
  useEffect(() => saveName(name), [name])
  useEffect(() => saveSettings(settings), [settings])
  // 모델이 준비되면(또는 이미 준비됐으면) 이 탑의 뜻·요약 기준 문장을 미리 계산
  useEffect(() => {
    if (!towerId) return
    prewarmTower(towerId)
    return embedder.subscribe((s) => { if (s.state === 'ready') prewarmTower(towerId) })
  }, [towerId])

  const send = (a: RunAction) => {
    const cur = runRef.current
    if (!cur) return
    const next = reduceRun(cur, a, { floors: towerFloors(cur.towerId), wordPool: rewardWordPool })
    if (next === cur) return
    if (a.type === 'battle' && cur.battle && next.battle) {
      const before = cur.battle
      const after = next.battle
      const items = judgementsFrom(before, a.action, after)
      if (items.length > 0) setRecords((log) => addRecords(log, items, recordScope(cur), Date.now()))
      setProfile((p) => afterBattle(p, after))
    }
    if (a.type === 'finishFloor' && cur.battle && next.reward) {
      const sprite = cur.battle.passage.enemy.sprite
      const reward = next.reward
      setProfile((p) => {
        const out = afterFloor(p, reward.result, sprite, reward.words)
        return next.phase === 'complete' ? afterTower(out, cur.towerId) : out
      })
    }
    if (a.type === 'chooseReward') {
      const offer = cur.reward?.offers[a.index]
      if (offer?.kind === 'word') setProfile((p) => collectWords(p, [offer.id]))
    }
    setRun(next)
  }

  /** 새 탑 오르기. 진행 중이던 탑은 덮어쓴다 */
  const start = (id: string) => {
    const deck = starterFor(id)
    setProfile((p) => collectWords(p, deck))
    setRun(newRun(id, deck, Date.now() >>> 0))
  }
  /** 다 오른(또는 그만둔) 진행을 지운다 */
  const drop = () => { clearRun(); setRun(null) }

  return {
    run, profile, stats, name, settings, send, start, drop, setName,
    seen: (key: string) => setProfile((p) => markSeen(p, key)),
    toggleSound: () => setSettings((s) => ({ ...s, sound: !s.sound })),
  }
}

export type Game = ReturnType<typeof useGame>
