import { describe, expect, it } from 'vitest'
import { bee1 } from '../content/passages/bee-1'
import { starChecks, starCount } from './stars'
import { createBattle, type GameState } from './state'

const base = (): GameState => createBattle({ passage: bee1, deck: [], wordUses: {}, seed: 1, playerHp: 30, playerMaxHp: 30 })
const won = (over: Partial<GameState>): GameState => ({ ...base(), outcome: 'won', ...over })

describe('층 별 평가', () => {
  it('봉인만 하면 별 1개, 봉인하지 못하면 0', () => {
    const s = won({ player: { hp: 3, maxHp: 30, block: 0 } })
    expect(starCount(starChecks(s))).toBe(1)
    expect(starCount(starChecks(base()))).toBe(0)
  })
  it('질문을 모두 정타로 내면 +1 (건너뛴 질문이 있으면 아님)', () => {
    const low = { hp: 3, maxHp: 30, block: 0 }
    expect(starChecks(won({ player: low, tally: { hits: 3, misses: 0, summaryFails: 0 } })).allHits).toBe(true)
    expect(starChecks(won({ player: low, tally: { hits: 2, misses: 0, summaryFails: 0 } })).allHits).toBe(false)
  })
  it('체력을 절반 이상 남기면 +1', () => {
    expect(starChecks(won({ player: { hp: 15, maxHp: 30, block: 0 } })).healthy).toBe(true)
    expect(starChecks(won({ player: { hp: 14, maxHp: 30, block: 0 } })).healthy).toBe(false)
  })
  it('셋 다 하면 별 3개', () => {
    expect(starCount(starChecks(won({ tally: { hits: 3, misses: 0, summaryFails: 1 } })))).toBe(3)
  })
})
