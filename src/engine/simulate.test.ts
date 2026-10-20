// 균형 시뮬레이션 (작업지시서 6장 완성 기준). 난수는 시드 난수만.
import { describe, expect, it } from 'vitest'
import { starterDeck, towerFloors } from '../content'
import { BALANCE } from './balance'
import { nextRandom } from './rng'
import { newRun, reduceRun, type RunState } from './run'
import { reduce, type Action, type GameState } from './state'

type Policy = (s: GameState, rand: () => number) => Action[]

/** 다 맞히는 학생: 안개부터 걷고, 요약이 열리면 봉인, 질문은 확실로, 낱말 카드는 통과 */
const perfect: Policy = (s) => {
  const acts: Action[] = []
  if (s.textCards.some((c) => c.kind === 'summary')) return [{ type: 'resolveSummary', pass: true, answer: '' }]
  s.textCards.filter((c) => c.kind === 'fog').forEach((c) => {
    const lw = s.passage.lockedWords[Number(c.refId)]
    if (lw) acts.push({ type: 'resolveFog', wordIndex: Number(c.refId), sentence: lw.clues[0] ?? 0 })
  })
  for (const c of s.textCards.filter((x) => x.kind === 'question')) {
    const q = s.passage.questions.find((x) => x.id === c.refId)
    if (!q) continue
    const ev = q.evidence
    const pick = [...(ev.required[0] ?? [])]
    for (const i of [...ev.required.flat(), ...(ev.allowed ?? [])]) if (pick.length < ev.count && !pick.includes(i)) pick.push(i)
    acts.push({ type: 'resolveQuestion', questionId: q.id, option: q.answer, evidence: pick, confidence: 'sure' })
  }
  s.hand.forEach((w) => acts.push({ type: 'resolveWordCard', uid: w.uid, pass: true, answer: '' }))
  return acts
}

/** 아무거나 누르는 학생: 보기·근거·확신도 무작위, 낱말 뜻 20%·요약 10%만 우연히 통과 */
const random: Policy = (s, rand) => {
  const n = s.passage.sentences.length
  const acts: Action[] = []
  for (const c of s.textCards) {
    if (c.kind === 'summary') acts.push({ type: 'resolveSummary', pass: rand() < 0.1, answer: '' })
    if (c.kind === 'fog') acts.push({ type: 'resolveFog', wordIndex: Number(c.refId), sentence: Math.floor(rand() * n) })
    if (c.kind === 'question') {
      const q = s.passage.questions.find((x) => x.id === c.refId)
      if (!q) continue
      const ev = new Set<number>()
      while (ev.size < q.evidence.count) ev.add(Math.floor(rand() * n))
      acts.push({ type: 'resolveQuestion', questionId: q.id, option: Math.floor(rand() * 4), evidence: [...ev], confidence: rand() < 0.5 ? 'sure' : 'unsure' })
    }
  }
  s.hand.forEach((w) => acts.push({ type: 'resolveWordCard', uid: w.uid, pass: rand() < 0.2, answer: '' }))
  return acts.sort(() => rand() - 0.5)
}

/** 한 층 전투를 끝까지. 정책이 낸 action 중 생각력이 되는 것만 적용된다 */
function playBattle(start: GameState, policy: Policy, seed: number): GameState {
  let r = seed
  const rand = () => { const [v, next] = nextRandom(r); r = next; return v }
  let s = start
  for (let turn = 0; turn < 40 && s.outcome === 'playing'; turn++) {
    for (let round = 0; round < 6 && s.outcome === 'playing'; round++) {
      for (const a of policy(s, rand)) s = reduce(s, a)
    }
    if (s.outcome === 'playing') s = reduce(s, { type: 'endTurn' })
  }
  return s
}

function playFloor1(policy: Policy, seed: number): GameState {
  const floors = towerFloors('bee')
  const r = reduceRun(newRun('bee', starterDeck, seed), { type: 'startFloor' }, floors)
  return playBattle(r.battle!, policy, seed)
}

describe('시뮬레이션 (완성 기준)', () => {
  it('무작위로 고르면 1층에서 진다: 100판 승률 10% 미만', () => {
    let wins = 0
    for (let i = 0; i < 100; i++) if (playFloor1(random, 1000 + i).outcome === 'won') wins++
    expect(wins).toBeLessThan(10)
  })

  it('다 맞히면 층마다 이기고, 탑을 체력 절반 이상 남기고 오른다', () => {
    const floors = towerFloors('bee')
    let r: RunState = reduceRun(newRun('bee', starterDeck, 42), { type: 'startFloor' }, floors)
    for (let f = 1; f <= floors.length; f++) {
      const battle = playBattle(r.battle!, perfect, 42 + f)
      expect(battle.outcome, `${f}층`).toBe('won')
      expect(battle.turn, `${f}층 턴 수`).toBeLessThanOrEqual(5)   // 한 층 4턴 안팎
      r = reduceRun({ ...r, battle }, { type: 'finishFloor' }, floors)
      if (f < floors.length) r = reduceRun(r, { type: 'startFloor' }, floors)
    }
    expect(r.phase).toBe('complete')
    expect(r.hp).toBeGreaterThanOrEqual(BALANCE.playerMaxHp / 2)
  })

  it('요약 없이는 어떤 층도 깰 수 없다', () => {
    const noSummary: Policy = (s, rand) => perfect(s, rand).filter((a) => a.type !== 'resolveSummary')
    for (const p of towerFloors('bee')) {
      const r = reduceRun({ ...newRun('bee', starterDeck, 9), floor: p.floor }, { type: 'startFloor' }, towerFloors('bee'))
      expect(playBattle(r.battle!, noSummary, 9).outcome, p.id).not.toBe('won')
    }
  })
})
