// 기기에 남는 성장 기록 (docs/개편-기록.md 3장): 층별 최고 별, 왕명 인장, 모은 낱말, 요괴 봉인 수.
// 진행 저장(RunState)과 따로 두어 탑을 새로 시작해도 남는다. 전부 순수 함수.
import type { FloorResult } from './run'
import type { GameState } from './state'

export const PROFILE_VERSION = 1

export interface WordMark {
  wrote: boolean             // 뜻 쓰기를 통과한 적이 있다 (부적첩의 '뜻 쓰기' 도장)
}

export interface Profile {
  version: number
  stars: Record<string, number>       // 글 id → 가장 잘한 별 (1~3)
  seals: string[]                     // 다 오른 탑 id (왕명 인장)
  words: Record<string, WordMark>     // 모은 낱말
  sealed: Record<string, number>      // 요괴(sprite id)별 봉인 횟수
  seen: string[]                      // 한 번 본 안내 (프롤로그·길잡이)
}

export const emptyProfile = (): Profile => ({ version: PROFILE_VERSION, stars: {}, seals: [], words: {}, sealed: {}, seen: [] })

/** 낱말을 모은 것으로 표시 (이미 있으면 그대로) */
export function collectWords(p: Profile, ids: readonly string[]): Profile {
  const fresh = ids.filter((id) => !p.words[id])
  if (fresh.length === 0) return p
  return { ...p, words: { ...p.words, ...Object.fromEntries(fresh.map((id) => [id, { wrote: false }])) } }
}

/** 방금 전투 action의 결과를 반영: 뜻 쓰기를 통과한 낱말에 도장 */
export function afterBattle(p: Profile, next: GameState): Profile {
  let out = p
  for (const e of next.events) {
    if (e.kind === 'word' && e.pass && e.mode === 'write' && !out.words[e.wordId]?.wrote) {
      out = { ...out, words: { ...out.words, [e.wordId]: { wrote: true } } }
    }
  }
  return out
}

/** 층을 봉인했을 때: 최고 별, 요괴 봉인 수, 되찾은 낱말 */
export function afterFloor(p: Profile, result: FloorResult, sprite: string, words: readonly string[]): Profile {
  const best = Math.max(p.stars[result.passageId] ?? 0, result.stars)
  return collectWords({
    ...p,
    stars: { ...p.stars, [result.passageId]: best },
    sealed: { ...p.sealed, [sprite]: (p.sealed[sprite] ?? 0) + 1 },
  }, words)
}

/** 탑을 다 올랐을 때: 왕명 인장 */
export function afterTower(p: Profile, towerId: string): Profile {
  return p.seals.includes(towerId) ? p : { ...p, seals: [...p.seals, towerId] }
}

export function markSeen(p: Profile, key: string): Profile {
  return p.seen.includes(key) ? p : { ...p, seen: [...p.seen, key] }
}

/** 이 글들에서 모은 별의 합 */
export function starsOf(p: Profile, passageIds: readonly string[]): number {
  return passageIds.reduce((n, id) => n + (p.stars[id] ?? 0), 0)
}
