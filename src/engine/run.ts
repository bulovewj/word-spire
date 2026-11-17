// 탑 한 번 오르기 (기획안 6-5 · 작업지시서 F7 + docs/개편-기록.md). 층 전투(GameState)를 감싸는 순수 상태.
import type { Passage } from '../content/types'
import { BALANCE } from './balance'
import { makeOffers, type BoonId, type RewardOffer } from './boons'
import { nextRandom } from './rng'
import { starChecks, starCount, type StarCheck } from './stars'
import { createBattle, reduce, type Action, type GameState } from './state'

export const RUN_VERSION = 4

export type RunPhase = 'intro' | 'battle' | 'reward' | 'complete'

/** 봉인한 층 하나의 결과 */
export interface FloorResult { passageId: string; stars: number; checks: StarCheck; turns: number; retries: number }

/** 층을 봉인하고 받는 것 */
export interface Reward {
  words: string[]                       // 안개를 걷어 되찾은 낱말
  result: FloorResult
  offers: RewardOffer[]                 // 하나만 고르는 보물·새 낱말 (마지막 층은 없음)
  picked: number | null                 // 고른 offers index
}

interface FloorStart { deck: string[]; wordUses: Record<string, number>; combo: number }

export interface RunState {
  version: number
  id: number                            // 이 진행의 이름표 (판정 기록 묶음용)
  towerId: string
  floor: number                         // 지금 층 (1부터)
  phase: RunPhase
  hp: number                            // 마지막 전투를 마친 체력 (층을 봉인하면 다음 층은 가득 찬 채로 시작)
  maxHp: number
  deck: string[]                        // 내가 아는 낱말 id (층 보상으로 늘어남)
  wordUses: Record<string, number>      // 낱말별 이 탑에 남은 사용 횟수 (새 탑이면 다시 가득)
  floorStart: FloorStart                // 패배하면 이 상태로 그 층 다시
  battle: GameState | null
  reward: Reward | null                 // 방금 받은 층 보상
  seed: number                          // 다음 전투·보상의 시드를 만드는 난수 상태
  combo: number                         // 연속 정타 (층을 넘어 이어짐)
  boons: BoonId[]                       // 이 탑에서 고른 보물
  results: FloorResult[]                // 봉인한 층들의 결과 (층 순서)
  retries: number                       // 지금 층을 다시 한 횟수
}

export type RunAction =
  | { type: 'startFloor' }              // 소개·보상 화면에서 다음 전투로 (보상 고르기가 있으면 고른 뒤에만)
  | { type: 'battle'; action: Action }
  | { type: 'finishFloor' }             // 이긴 전투를 마치고 보상(또는 탑 완료)으로
  | { type: 'chooseReward'; index: number }
  | { type: 'retryFloor' }              // 진 층을 층 시작 상태로 다시

/** floors: 이 탑의 글을 층 순서대로 · wordPool: 보상으로 나올 수 있는 낱말 id (기본 낱말 팩) */
export interface RunContext { floors: Passage[]; wordPool: string[] }

const fullUses = (ids: string[]) => Object.fromEntries(ids.map((id) => [id, BALANCE.wordUsesPerTower]))

export function newRun(towerId: string, deck: string[], seed: number): RunState {
  const hp = BALANCE.playerMaxHp
  const wordUses = fullUses(deck)
  return {
    version: RUN_VERSION, id: seed >>> 0, towerId, floor: 1, phase: 'intro', hp, maxHp: hp, deck: [...deck], wordUses,
    floorStart: { deck: [...deck], wordUses, combo: 0 }, battle: null, reward: null, seed: seed >>> 0,
    combo: 0, boons: [], results: [], retries: 0,
  }
}

/** 층 전투를 연다. 체력은 늘 가득, 다시 도전(retries)한 만큼 요괴가 지쳐 있다 */
function battleFor(r: RunState, passage: Passage, start: FloorStart, retries: number): RunState {
  const [, seed] = nextRandom(r.seed)
  const battle = createBattle({
    passage, deck: start.deck, wordUses: start.wordUses, seed, playerHp: r.maxHp, playerMaxHp: r.maxHp, combo: start.combo, boons: r.boons,
    ease: Math.min(BALANCE.retryEaseMax, retries * BALANCE.retryEase),
  })
  return { ...r, seed, retries, hp: r.maxHp, phase: 'battle', battle, reward: null, floorStart: { ...start, deck: [...start.deck] } }
}

function finishFloor(r: RunState, b: GameState, ctx: RunContext): RunState {
  const checks = starChecks(b)
  const result: FloorResult = { passageId: b.passage.id, stars: starCount(checks), checks, turns: b.turn, retries: r.retries }
  const words = b.reservedWords.filter((id) => !r.deck.includes(id))
  const deck = [...r.deck, ...words]
  const wordUses = { ...b.wordUses, ...fullUses(words) }   // 새로 얻은 낱말은 횟수가 가득
  const base = { ...r, deck, wordUses, battle: null, hp: b.player.hp, combo: b.combo, results: [...r.results, result], retries: 0 }
  if (r.floor >= ctx.floors.length) return { ...base, phase: 'complete', reward: { words, result, offers: [], picked: null } }
  const [offers, seed] = makeOffers(r.boons, deck, ctx.wordPool, r.seed)
  return { ...base, phase: 'reward', floor: r.floor + 1, seed, reward: { words, result, offers, picked: null } }
}

function chooseReward(r: RunState, index: number): RunState {
  const rw = r.reward
  const offer = rw?.offers[index]
  if (r.phase !== 'reward' || !rw || !offer || rw.picked !== null) return r
  const reward = { ...rw, picked: index }
  if (offer.kind === 'word') {
    return { ...r, reward, deck: [...r.deck, offer.id], wordUses: { ...r.wordUses, ...fullUses([offer.id]) } }
  }
  const maxHp = r.maxHp + (offer.id === 'gourd' ? BALANCE.boon.gourdMaxHp : 0)   // 약수 호리병
  return { ...r, reward, maxHp, boons: [...r.boons, offer.id] }
}

export function reduceRun(r: RunState, a: RunAction, ctx: RunContext): RunState {
  switch (a.type) {
    case 'startFloor': {
      const passage = ctx.floors[r.floor - 1]
      if ((r.phase !== 'intro' && r.phase !== 'reward') || !passage) return r
      if (r.reward && r.reward.offers.length > 0 && r.reward.picked === null) return r   // 보상을 먼저 고른다
      return battleFor(r, passage, { deck: r.deck, wordUses: r.wordUses, combo: r.combo }, 0)
    }
    case 'battle': {
      if (r.phase !== 'battle' || !r.battle) return r
      const battle = reduce(r.battle, a.action)
      return battle === r.battle ? r : { ...r, battle }
    }
    case 'finishFloor':
      return r.phase === 'battle' && r.battle?.outcome === 'won' ? finishFloor(r, r.battle, ctx) : r
    case 'chooseReward':
      return chooseReward(r, a.index)
    case 'retryFloor': {
      const passage = ctx.floors[r.floor - 1]
      if (r.phase !== 'battle' || r.battle?.outcome !== 'lost' || !passage) return r
      return battleFor(r, passage, r.floorStart, r.retries + 1)
    }
  }
}

/** 판정 기록의 첫 시도를 가르는 묶음. 같은 층을 다시 해도 같은 묶음이다 */
export function recordScope(r: RunState): string {
  return `${r.id}:${r.towerId}:${r.floor}`
}

/** 이 진행에서 지금까지 모은 별 */
export function runStars(r: RunState): number {
  return r.results.reduce((n, x) => n + x.stars, 0)
}
