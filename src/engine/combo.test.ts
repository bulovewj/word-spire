import { describe, expect, it } from 'vitest'
import { bee1 } from '../content/passages/bee-1'
import { STARTER_DECK_56 } from '../content/words/pack-5-6'
import type { Passage, Question } from '../content/types'
import { BALANCE } from './balance'
import type { BoonId } from './boons'
import { createBattle, incomingDamage, reduce, type Action, type GameState } from './state'

const setup = (passage: Passage = bee1, deck: string[] = STARTER_DECK_56) =>
  createBattle({ passage, deck, wordUses: Object.fromEntries(deck.map((id) => [id, 2])), seed: 42, playerHp: 40, playerMaxHp: 40 })

const q = (id: string) => bee1.questions.find((x) => x.id === id) as Question
type QAction = Extract<Action, { type: 'resolveQuestion' }>
/** 정답 근거 한 벌: 첫 필수 묶음 + 관련 문장으로 count개 채우기 */
const goodEvidence = (id: string) => {
  const ev = q(id).evidence
  const picked = [...(ev.required[0] ?? [])]
  for (const i of [...ev.required.flat(), ...(ev.allowed ?? [])]) if (picked.length < ev.count && !picked.includes(i)) picked.push(i)
  return picked
}
const right = (id: string, confidence: 'sure' | 'unsure' = 'sure'): QAction =>
  ({ type: 'resolveQuestion', questionId: id, option: q(id).answer, evidence: goodEvidence(id), confidence })
const wrong = (id: string, confidence: 'sure' | 'unsure' = 'sure'): QAction =>
  ({ type: 'resolveQuestion', questionId: id, option: (q(id).answer + 1) % 4, evidence: [0], confidence })
const run = (s: GameState, ...actions: Action[]) => actions.reduce(reduce, s)
const end: Action = { type: 'endTurn' }

describe('연속 정타', () => {
  it('정타마다 +1씩 쌓이고 다음 정타 피해에 그만큼 더한다. 틀리면 끊긴다', () => {
    const s = run(setup(), right('q1', 'unsure'), right('q2', 'unsure'))
    expect(s.combo).toBe(2)
    expect(s.enemy.hp).toBe(40 - (6 - 2) - (10 + 1 - 2))
    expect(s.events[0]).toMatchObject({ kind: 'question', combo: 2, comboBonus: 1 })
    const broken = run(setup(), right('q1', 'unsure'), wrong('q2', 'unsure'))
    expect(broken.combo).toBe(0)
    expect(broken.events[0]).toMatchObject({ combo: 0, comboBonus: 0 })
  })
  it('세 번째 연속 정타에서 번뜩임: 생각력 +1', () => {
    const s = run({ ...setup(), combo: 2 }, right('q1', 'unsure'))
    expect(s).toMatchObject({ combo: 3, think: 3 })   // 3 - 1(질문) + 1(번뜩임)
    expect(s.events).toContainEqual({ kind: 'spark', think: 1 })
  })
  it('보너스는 상한(+4)까지만', () => {
    const s = run({ ...setup(), combo: 9 }, right('q1', 'unsure'))
    expect(s.enemy.hp).toBe(40 - (6 + BALANCE.comboDamageMax - 2))
  })
  it('별 판정용 집계: 질문 정타·그 밖, 요약 실패', () => {
    const s = run(setup(), right('q1'), wrong('q2', 'unsure'), end, wrong('q3', 'unsure'), end, { type: 'resolveSummary', pass: false, answer: '' })
    expect(s.tally).toEqual({ hits: 1, misses: 2, summaryFails: 1 })
  })
})

describe('보물 효과', () => {
  const withBoons = (...boons: BoonId[]) =>
    createBattle({ passage: bee1, deck: STARTER_DECK_56, wordUses: { h01: 2 }, seed: 42, playerHp: 40, playerMaxHp: 40, boons })

  it('청심 매듭: 낱말 방어 +2', () => {
    const s = run(withBoons('knot'), { type: 'resolveWordPick', wordId: 'h01', choice: 0 })
    expect(s.player.block).toBe(BALANCE.wordBlockPick + BALANCE.boon.knotBlock)
  })
  it('돌문진: 이 층 첫 공격만 4 덜 받는다 (예고에도 반영)', () => {
    const s = withBoons('stone')
    expect(incomingDamage(s)).toBe(6 - BALANCE.boon.stoneGuard)
    const t2 = run(s, end)
    expect(t2.player.hp).toBe(40 - 2)
    expect(incomingDamage(t2)).toBe(8)
  })
  it('밝은 등불: 층마다 단서 보기 한 번 공짜', () => {
    const s = run(withBoons('lamp'), { type: 'useHint', questionId: 'q1' })
    expect(s).toMatchObject({ think: 3, freeHint: false })
  })
  it('굳센 붓: 정타 피해 +2 (약타에는 없음)', () => {
    expect(run(withBoons('brush'), right('q1', 'unsure')).enemy.hp).toBe(40 - (6 + BALANCE.boon.brushDamage - 2))
    const weak: Action = { type: 'resolveQuestion', questionId: 'q1', option: q('q1').answer, evidence: [0], confidence: 'unsure' }
    expect(run(withBoons('brush'), weak).enemy.hp).toBe(40 - (3 - 2))
  })
})
