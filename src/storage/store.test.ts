import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { findPassage, starterDeck, towerFloors } from '../content'
import { newRun, reduceRun, type RunState } from '../engine/run'
import { computeStats } from '../engine/stats'
import { loadProfile, loadRecords, loadRun, saveRun, saveRecords } from './store'

const memory = new Map<string, string>()
beforeEach(() => {
  memory.clear()
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => memory.get(k) ?? null,
    setItem: (k: string, v: string) => memory.set(k, v),
    removeItem: (k: string) => memory.delete(k),
  })
})
afterEach(() => vi.unstubAllGlobals())
const ctx = { floors: towerFloors('bee'), wordPool: [] }
const intro = () => newRun('bee', starterDeck, 42)
const battle = () => reduceRun(intro(), { type: 'startFloor' }, ctx)
function corrupt(change: (r: RunState) => void) {
  const r = battle()
  change(r)
  saveRun(r)
}

describe('이어하기 저장', () => {
  it('소개·전투·보상·완료를 현재 글 데이터로 복원한다', () => {
    let r = intro()
    const check = () => { saveRun(r); expect(loadRun(findPassage)).toEqual(r) }
    check()
    for (let floor = 1; floor <= 3; floor++) {
      r = reduceRun(r, { type: 'startFloor' }, ctx)
      check()
      r = { ...r, battle: { ...r.battle!, outcome: 'won' } }
      r = reduceRun(r, { type: 'finishFloor' }, ctx)
      check()
      if (r.phase === 'reward') { r = reduceRun(r, { type: 'chooseReward', index: 0 }, ctx); check() }
    }
  })
  it('버전만 맞고 전투 구조가 깨진 저장은 이어하지 않는다', () => {
    corrupt((r) => { Reflect.deleteProperty(r.battle!, 'tally') })
    expect(loadRun(findPassage)).toBeNull()
    corrupt((r) => { r.battle!.optionOrder = {} })
    expect(loadRun(findPassage)).toBeNull()
    corrupt((r) => { r.battle = null })
    expect(loadRun(findPassage)).toBeNull()
    corrupt((r) => { r.towerId = '없는 탑' })
    expect(loadRun(findPassage)).toBeNull()
  })
  it('존재하지 않는 글·잘못된 JSON은 버린다', () => {
    saveRun(battle())
    expect(loadRun(() => undefined)).toBeNull()
    memory.set('wordSpire.v2.run', '{broken')
    expect(loadRun(findPassage)).toBeNull()
  })
  it('저장이 차단되어도 플레이를 막지 않는다', () => {
    vi.stubGlobal('localStorage', { getItem() { throw new Error('차단') }, setItem() { throw new Error('차단') } })
    expect(() => saveRun(battle())).not.toThrow()
    expect(loadRun(findPassage)).toBeNull()
  })
})

describe('기록 복구', () => {
  it('깨진 확신도만 버려 정상 기록의 집계가 멈추지 않는다', () => {
    const good = { area: 'literal' as const, ref: 'q1', correct: true, helped: false, firstTry: true, scope: '1', at: 1 }
    saveRecords([good])
    memory.set('wordSpire.v2.records', JSON.stringify({ format: 1, log: [good, { ...good, confidence: 'broken' }] }))
    expect(computeStats(loadRecords()).areas.literal).toEqual({ correct: 1, total: 1, helped: 0 })
  })
  it('배열을 성장 기록 맵으로 받아들이지 않는다', () => {
    memory.set('wordSpire.v2.profile', JSON.stringify({ version: 1, stars: [], sealed: {}, seals: [], seen: [], words: {} }))
    expect(loadProfile().stars).toEqual({})
  })
})
