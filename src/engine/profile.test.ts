import { describe, expect, it } from 'vitest'
import { bee1 } from '../content/passages/bee-1'
import { afterBattle, afterFloor, afterTower, collectWords, emptyProfile, markSeen, starsOf } from './profile'
import type { FloorResult } from './run'
import { createBattle, reduce } from './state'

const result = (stars: number): FloorResult =>
  ({ passageId: 'bee-1', stars, checks: { sealed: true, allHits: stars > 1, healthy: stars > 2 }, turns: 4, retries: 0 })

describe('성장 기록', () => {
  it('층을 봉인하면 최고 별만 남고, 요괴 봉인 수와 되찾은 낱말이 쌓인다', () => {
    let p = afterFloor(emptyProfile(), result(2), 'dokkaebi', ['bee-w1'])
    p = afterFloor(p, result(1), 'dokkaebi', ['bee-w1'])
    expect(p.stars).toEqual({ 'bee-1': 2 })
    expect(p.sealed).toEqual({ dokkaebi: 2 })
    expect(p.words).toEqual({ 'bee-w1': { wrote: false } })
    expect(starsOf(afterFloor(p, result(3), 'dokkaebi', []), ['bee-1', 'bee-2'])).toBe(3)
  })
  it('뜻 쓰기를 통과한 낱말에만 도장이 찍힌다 (뜻 고르기·실패는 아님)', () => {
    const s = createBattle({ passage: bee1, deck: ['h01', 'h02', 'h03'], wordUses: { h01: 2, h02: 2, h03: 2 }, seed: 1, playerHp: 30, playerMaxHp: 30 })
    let p = collectWords(emptyProfile(), ['h01', 'h02', 'h03'])
    p = afterBattle(p, reduce(s, { type: 'resolveWordCard', wordId: 'h01', pass: true, answer: '' }))
    p = afterBattle(p, reduce(s, { type: 'resolveWordCard', wordId: 'h02', pass: false, answer: '' }))
    p = afterBattle(p, reduce(s, { type: 'resolveWordPick', wordId: 'h03', choice: 0 }))
    expect(p.words).toEqual({ h01: { wrote: true }, h02: { wrote: false }, h03: { wrote: false } })
  })
  it('이미 모은 낱말의 도장은 지워지지 않는다', () => {
    const p = collectWords({ ...emptyProfile(), words: { h01: { wrote: true } } }, ['h01', 'h02'])
    expect(p.words).toEqual({ h01: { wrote: true }, h02: { wrote: false } })
  })
  it('왕명 인장과 본 안내는 한 번만 기록', () => {
    const p = afterTower(afterTower(emptyProfile(), 'bee'), 'bee')
    expect(p.seals).toEqual(['bee'])
    expect(markSeen(markSeen(p, 'coach'), 'coach').seen).toEqual(['coach'])
  })
})
