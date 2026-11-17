// 낱말 방어 (기획안 6-0·6-2 · 작업지시서 F4 + docs/개편-기록.md). reduce가 부른다
// 내 낱말 묶음에서 골라 뜻을 맞히면 방어. 두 방식: 뜻 고르기(가볍게) / 뜻 쓰기(든든하게). 맞히든 틀리든 횟수 1 깎임
import { BALANCE } from './balance'
import { hasBoon } from './boons'
import { shuffle } from './rng'
import { canUseWord, spendWord } from './select'
import type { GameState, WordMode } from './state'

/** 통과했을 때 얻는 방어 (청심 매듭이 있으면 +) */
export function wordBlock(s: GameState, mode: WordMode): number {
  const base = mode === 'write' ? BALANCE.wordBlockWrite : BALANCE.wordBlockPick
  return base + (hasBoon(s.boons, 'knot') ? BALANCE.boon.knotBlock : 0)
}

function resolveWord(s: GameState, wordId: string, pass: boolean, mode: WordMode): GameState {
  if (!canUseWord(s, wordId) || s.think < BALANCE.wordCardCost) return s
  const block = pass ? wordBlock(s, mode) : 0
  return {
    ...s,
    think: s.think - BALANCE.wordCardCost,
    player: { ...s.player, block: s.player.block + block },
    wordUses: spendWord(s, wordId),
    events: [{ kind: 'word', wordId, pass, block, mode }],
  }
}

/** 뜻 쓰기: 채점은 화면(의미 채점기)이 하고 통과 여부만 받는다 */
export function resolveWordWrite(s: GameState, wordId: string, pass: boolean): GameState {
  return resolveWord(s, wordId, pass, 'write')
}

/** 뜻 고르기: 보기는 [바른 뜻, ...틀린 뜻] 순서의 index로 받는다. 0번이 바른 뜻 */
export function resolveWordPick(s: GameState, wordId: string, choice: number): GameState {
  return resolveWord(s, wordId, choice === 0, 'pick')
}

/**
 * 뜻 고르기 보기의 화면 순서 (값 = [바른 뜻, ...틀린 뜻]의 index).
 * 상태를 바꾸지 않고, 같은 상태·같은 낱말·같은 남은 횟수면 늘 같은 순서다
 */
export function wordPickOrder(s: GameState, wordId: string, optionCount: number): number[] {
  let h = (s.rng ^ Math.imul((s.wordUses[wordId] ?? 0) + 1, 0x9e3779b1)) >>> 0
  for (let i = 0; i < wordId.length; i++) h = Math.imul(h ^ wordId.charCodeAt(i), 0x01000193) >>> 0
  return shuffle(Array.from({ length: optionCount }, (_, i) => i), h)[0]
}
