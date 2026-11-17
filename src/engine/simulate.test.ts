// 균형 시뮬레이션 (작업지시서 6장 완성 기준 + docs/개편-기록.md 4장). 난수는 시드 난수만.
// 탑마다 같은 기준을 본다: 새 탑을 넣으면 이 테스트가 숫자를 대신 확인해 준다
import { describe, expect, it } from 'vitest'
import { rewardWordPool, starterFor, towerFloors, towers } from '../content'
import { newRun, reduceRun, runStars, type RunContext } from './run'
import { AVERAGE, PERFECT, RANDOM, STRUGGLING, playBattle, playTower, student, type Skill } from './simPolicies'

const N = 200

interface Tally { done: number; floor1Wins: number; retries: number; stars: number; maxTurns: number }

function play(towerId: string, skill: Skill, maxRetries: number): Tally {
  const ctx: RunContext = { floors: towerFloors(towerId), wordPool: rewardWordPool }
  const t: Tally = { done: 0, floor1Wins: 0, retries: 0, stars: 0, maxTurns: 0 }
  for (let i = 0; i < N; i++) {
    const r = playTower(newRun(towerId, starterFor(towerId), 500 + i), student(skill), ctx, 9000 + i * 13, maxRetries, i % 3)
    if (r.lostAt === null) t.done++
    if (r.lostAt !== 1) t.floor1Wins++
    t.retries += r.retries
    t.stars += runStars(r.run)
    t.maxTurns = Math.max(t.maxTurns, ...r.run.results.map((x) => x.turns))
  }
  return t
}

describe.each(towers.map((t) => [t.title, t.id] as const))('시뮬레이션: %s 탑', (_title, towerId) => {
  const floors = towerFloors(towerId)

  it('아무거나 누르면 1층에서 대개 지고(승률 20% 미만), 탑은 오르지 못한다', () => {
    const t = play(towerId, RANDOM, 0)
    expect(t.floor1Wins / N).toBeLessThan(0.2)
    expect(t.done / N).toBeLessThan(0.02)
  })

  it('다 맞히고 낱말로 방어하면 층마다 별 3개, 한 층은 5턴 안에 끝난다', () => {
    const t = play(towerId, PERFECT, 0)
    expect(t.done).toBe(N)
    expect(t.stars).toBe(N * floors.length * 3)
    expect(t.maxTurns).toBeLessThanOrEqual(5)
  })

  it('다 맞혀도 방어하지 않거나 질문을 건너뛰면 별을 다 받지 못한다', () => {
    expect(play(towerId, { ...PERFECT, defend: 'none' }, 0).stars).toBeLessThan(N * floors.length * 3)
    expect(play(towerId, { ...PERFECT, thorough: false }, 0).stars).toBeLessThan(N * floors.length * 3)
  })

  it('보통 학생은 넷 중 셋 넘게 한 번에 오르고, 다시 하기를 쓰면 거의 다 오른다', () => {
    expect(play(towerId, AVERAGE, 0).done / N).toBeGreaterThan(0.75)
    const again = play(towerId, AVERAGE, 3)
    expect(again.done / N).toBeGreaterThan(0.97)
    expect(again.retries / N).toBeLessThan(1)
  })

  it('서툰 학생도 다시 하기(요괴가 지침)로 끝까지 오른다', () => {
    const t = play(towerId, STRUGGLING, 3)
    expect(t.done / N).toBeGreaterThan(0.9)
    expect(t.retries / N).toBeLessThan(3)
  })

  it('요약 없이는 어떤 층도 깰 수 없다', () => {
    const ctx: RunContext = { floors, wordPool: rewardWordPool }
    const noSummary = student(PERFECT)
    for (const p of floors) {
      const r = reduceRun({ ...newRun(towerId, starterFor(towerId), 9), floor: p.floor }, { type: 'startFloor' }, ctx)
      const end = playBattle(r.battle!, (s, rand) => noSummary(s, rand).filter((a) => a.type !== 'resolveSummary'), 9)
      expect(end.outcome, p.id).not.toBe('won')
    }
  })
})
