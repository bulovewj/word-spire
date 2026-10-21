// 균형 시뮬레이션 (작업지시서 6장 완성 기준). 난수는 시드 난수만.
import { describe, expect, it } from 'vitest'
import { starterDeck, towerFloors } from '../content'
import { BALANCE } from './balance'
import { nextRandom } from './rng'
import { newRun, reduceRun, type RunState } from './run'
import { canUseWord, incomingDamage, reduce, type Action, type GameState } from './state'

type Policy = (s: GameState, rand: () => number) => Action[]

/** 다 맞히는 학생이 공격만: 안개부터 걷고, 요약이 열리면 봉인, 질문은 확실로 */
const attackOnly: Policy = (s) => {
  const acts: Action[] = []
  if (s.textCards.some((c) => c.kind === 'summary')) return [{ type: 'resolveSummary', pass: true, answer: '' }]
  const r = s.passage.rumor
  if (r && s.textCards.some((c) => c.kind === 'rumor')) acts.push({ type: 'resolveRumor', evidence: r.evidence.required[0] ?? [], pass: true, answer: '' })
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
  return acts
}

/** 횟수가 가장 많이 남은 낱말 (여러 낱말을 고루 쓰게) */
const freshestWord = (s: GameState) => s.deck.filter((id) => canUseWord(s, id))
  .sort((a, b) => (s.wordUses[b] ?? 0) - (s.wordUses[a] ?? 0))[0]

/** 다 맞히는 학생: 공격하고, 남은 생각력은 받을 피해가 있으면 낱말 방어에 */
const perfect: Policy = (s, rand) => {
  const acts = attackOnly(s, rand)
  const id = freshestWord(s)
  // 공격을 먼저 다 낸 뒤 생각력이 남으면 적용된다 (모자라면 reduce가 무시)
  if (id && incomingDamage(s) > 0) acts.push({ type: 'resolveWordCard', wordId: id, pass: true, answer: '' })
  return acts
}

/** 아무거나 누르는 학생: 보기·근거·확신도 무작위, 낱말 뜻 20%·요약 10%만 우연히 통과 */
const random: Policy = (s, rand) => {
  const n = s.passage.sentences.length
  const acts: Action[] = []
  for (const c of s.textCards) {
    if (c.kind === 'summary') acts.push({ type: 'resolveSummary', pass: rand() < 0.1, answer: '' })
    if (c.kind === 'rumor') acts.push({ type: 'resolveRumor', evidence: [Math.floor(rand() * n), Math.floor(rand() * n)], pass: rand() < 0.1, answer: '' })
    if (c.kind === 'fog') acts.push({ type: 'resolveFog', wordIndex: Number(c.refId), sentence: Math.floor(rand() * n) })
    if (c.kind === 'question') {
      const q = s.passage.questions.find((x) => x.id === c.refId)
      if (!q) continue
      const ev = new Set<number>()
      while (ev.size < q.evidence.count) ev.add(Math.floor(rand() * n))
      acts.push({ type: 'resolveQuestion', questionId: q.id, option: Math.floor(rand() * 4), evidence: [...ev], confidence: rand() < 0.5 ? 'sure' : 'unsure' })
    }
  }
  const id = freshestWord(s)
  if (id) acts.push({ type: 'resolveWordCard', wordId: id, pass: rand() < 0.2, answer: '' })
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

/** 탑 끝까지. 지면 그 자리에서 멈춘 진행을 돌려준다 */
function playTower(policy: Policy, seed: number): RunState {
  const floors = towerFloors('bee')
  let r: RunState = reduceRun(newRun('bee', starterDeck, seed), { type: 'startFloor' }, floors)
  for (let f = 1; f <= floors.length; f++) {
    const battle = playBattle(r.battle!, policy, seed + f)
    if (battle.outcome !== 'won') return { ...r, battle }
    expect(battle.turn, `${f}층 턴 수`).toBeLessThanOrEqual(5)   // 한 층 4턴 안팎
    r = reduceRun({ ...r, battle }, { type: 'finishFloor' }, floors)
    if (f < floors.length) r = reduceRun(r, { type: 'startFloor' }, floors)
  }
  return r
}

describe('시뮬레이션 (완성 기준)', () => {
  // 다시 보기를 없앤 뒤(2026-10-21) 질문을 다 쓰면 요약 봉인이 바로 열려 18%로 올랐다. 요약이 우연히 통과할 확률 10%는 넉넉한 가정
  it('무작위로 고르면 1층에서 대개 진다: 100판 승률 20% 미만', () => {
    let wins = 0
    for (let i = 0; i < 100; i++) if (playFloor1(random, 1000 + i).outcome === 'won') wins++
    expect(wins).toBeLessThan(20)
  })

  it('다 맞히고 남은 생각력으로 방어하면 층마다 이기고, 탑을 체력 1/4 이상 남기고 오른다', () => {
    const r = playTower(perfect, 42)
    expect(r.phase).toBe('complete')
    expect(r.hp).toBeGreaterThanOrEqual(BALANCE.playerMaxHp / 4)
  })

  it('다 맞혀도 공격만 하고 방어하지 않으면 탑을 다 오르지 못한다', () => {
    expect(playTower(attackOnly, 42).phase).not.toBe('complete')
  })

  it('요약 없이는 어떤 층도 깰 수 없다', () => {
    const noSummary: Policy = (s, rand) => perfect(s, rand).filter((a) => a.type !== 'resolveSummary')
    for (const p of towerFloors('bee')) {
      const r = reduceRun({ ...newRun('bee', starterDeck, 9), floor: p.floor }, { type: 'startFloor' }, towerFloors('bee'))
      expect(playBattle(r.battle!, noSummary, 9).outcome, p.id).not.toBe('won')
    }
  })
})
