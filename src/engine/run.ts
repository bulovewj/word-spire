// 탑 한 번 오르기 (기획안 6-5 · 작업지시서 F7). 층 전투(GameState)를 감싸는 순수 상태.
import type { Passage } from '../content/types'
import { BALANCE } from './balance'
import { nextRandom } from './rng'
import { createBattle, reduce, type Action, type GameState } from './state'

export const RUN_VERSION = 2

export type RunPhase = 'intro' | 'battle' | 'reward' | 'complete'

export interface RunState {
  version: number
  id: number                            // 이 진행의 이름표 (판정 기록 묶음용)
  towerId: string
  floor: number                         // 지금 층 (1부터)
  phase: RunPhase
  hp: number                            // 층 사이에 이어지는 내 체력
  maxHp: number
  deck: string[]                        // 내가 아는 낱말 id (층 보상으로 늘어남)
  floorStart: { hp: number; deck: string[] }   // 패배하면 이 상태로 그 층 다시
  battle: GameState | null
  reward: { words: string[]; healed: number } | null   // 방금 받은 층 보상
  seed: number                          // 다음 전투의 시드를 만드는 난수 상태
}

export type RunAction =
  | { type: 'startFloor' }              // 소개·보상 화면에서 다음 전투로
  | { type: 'battle'; action: Action }
  | { type: 'finishFloor' }             // 이긴 전투를 마치고 보상(또는 탑 완료)으로
  | { type: 'retryFloor' }              // 진 층을 층 시작 상태로 다시

export function newRun(towerId: string, deck: string[], seed: number): RunState {
  const hp = BALANCE.playerMaxHp
  return {
    version: RUN_VERSION, id: seed >>> 0, towerId, floor: 1, phase: 'intro', hp, maxHp: hp, deck: [...deck],
    floorStart: { hp, deck: [...deck] }, battle: null, reward: null, seed: seed >>> 0,
  }
}

function battleFor(r: RunState, passage: Passage, hp: number, deck: string[]): RunState {
  const [, seed] = nextRandom(r.seed)
  const battle = createBattle({ passage, deck, seed, playerHp: hp, playerMaxHp: r.maxHp })
  return { ...r, seed, phase: 'battle', battle, reward: null, floorStart: { hp, deck: [...deck] } }
}

/** floors: 이 탑의 글을 층 순서대로 (content/towerFloors) */
export function reduceRun(r: RunState, a: RunAction, floors: Passage[]): RunState {
  switch (a.type) {
    case 'startFloor': {
      const passage = floors[r.floor - 1]
      if ((r.phase !== 'intro' && r.phase !== 'reward') || !passage) return r
      return battleFor(r, passage, r.hp, r.deck)
    }
    case 'battle': {
      if (r.phase !== 'battle' || !r.battle) return r
      const battle = reduce(r.battle, a.action)
      return battle === r.battle ? r : { ...r, battle }
    }
    case 'finishFloor': {
      const b = r.battle
      if (r.phase !== 'battle' || !b || b.outcome !== 'won') return r
      const words = b.reservedWords.filter((id) => !r.deck.includes(id))
      const deck = [...r.deck, ...words]
      if (r.floor >= floors.length) {
        return { ...r, phase: 'complete', hp: b.player.hp, deck, battle: null, reward: { words, healed: 0 } }
      }
      const hp = Math.min(r.maxHp, b.player.hp + BALANCE.healBetweenFloors)
      return { ...r, phase: 'reward', floor: r.floor + 1, hp, deck, battle: null, reward: { words, healed: hp - b.player.hp } }
    }
    case 'retryFloor': {
      const passage = floors[r.floor - 1]
      if (r.phase !== 'battle' || r.battle?.outcome !== 'lost' || !passage) return r
      return battleFor(r, passage, r.floorStart.hp, r.floorStart.deck)
    }
  }
}

/** 판정 기록의 첫 시도를 가르는 묶음. 같은 층을 다시 해도 같은 묶음이다 */
export function recordScope(r: RunState): string {
  return `${r.id}:${r.towerId}:${r.floor}`
}
