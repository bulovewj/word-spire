import { useEffect, useState } from 'react'
import type { BattleEvent, GameState } from '../engine/state'

const FLASH_MS = 700

interface Poses { reader: string; enemy: string }

/** 방금 일어난 일에 맞춰 잠깐 바뀌는 포즈 (frames.json labels). 끝난 전투는 고정 포즈 */
function flashFor(events: BattleEvent[]): Partial<Poses> {
  const p: Partial<Poses> = {}
  for (const e of events) {
    if (e.kind === 'enemy') p.enemy = 'attack'
    if ((e.kind === 'question' || e.kind === 'rumor') && e.grade !== 'miss') { p.enemy = 'flinch'; p.reader = 'point' }
    if (e.kind === 'word' && e.pass) p.reader = 'defend'
  }
  return p
}

export function usePoses(state: GameState): Poses {
  const [flash, setFlash] = useState<Partial<Poses>>({})
  useEffect(() => {
    const f = flashFor(state.events)
    setFlash(f)
    if (Object.keys(f).length === 0) return
    const t = window.setTimeout(() => setFlash({}), FLASH_MS)
    return () => window.clearTimeout(t)
  }, [state])
  if (state.outcome === 'lost') return { reader: 'down', enemy: 'idle' }
  if (state.outcome === 'won') return { reader: 'stamp', enemy: 'sealed' }   // 적은 호리병 안으로
  return { reader: flash.reader ?? 'idle', enemy: flash.enemy ?? 'idle' }
}
