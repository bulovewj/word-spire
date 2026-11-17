// 전투 상태와 reduce (기획안 6장 · 작업지시서 F2-1, F4, F6 + docs/개편-기록.md)
// 규칙마다 파일이 따로 있다: question(질문) · defend(낱말 방어) · support(안개·단서) · rumor(헛소문) · seal(요약 봉인) · battle(턴)
import type { Passage } from '../content/types'
import { BALANCE } from './balance'
import { enemyAttack, startTurn } from './battle'
import { hasBoon, type BoonId } from './boons'
import { resolveWordPick, resolveWordWrite } from './defend'
import type { Confidence, Grade } from './judge'
import { resolveQuestion } from './question'
import { shuffle } from './rng'
import { resolveRumor, type RumorState } from './rumor'
import { resolveSummary } from './seal'
import { resolveFog, useHint } from './support'

export const STATE_VERSION = 8

export interface TextCard {
  kind: 'question' | 'fog' | 'summary' | 'rumor'
  refId: string               // question id / lockedWords index / passage id
  lockedThisTurn: boolean
}

/** 낱말 방어 방식: 뜻 쓰기 / 뜻 고르기 */
export type WordMode = 'write' | 'pick'

export type BattleEvent =
  | { kind: 'question'; questionId: string; grade: Grade; damage: number; enemyAttackBonus: number; combo: number; comboBonus: number }
  | { kind: 'spark'; think: number }                      // 연속 정타 번뜩임: 생각력 +
  | { kind: 'word'; wordId: string; pass: boolean; block: number; mode: WordMode }
  | { kind: 'enemy'; attack: number; damage: number }
  | { kind: 'summaryUnlocked' }
  | { kind: 'summary'; pass: boolean }
  | { kind: 'fog'; pass: boolean; wordId: string }
  | { kind: 'hint'; questionId: string; free: boolean }
  | { kind: 'rumor'; grade: Grade; damage: number }

export interface GameState {
  version: number
  rng: number
  passage: Passage
  turn: number
  think: number
  player: { hp: number; maxHp: number; block: number }
  enemy: { hp: number; maxHp: number; patternIndex: number; attackBonus: number; ease: number }   // ease: 다시 도전해 약해진 공격
  fogCleared: number[]                      // 안개를 걷은 lockedWords index
  reservedWords: string[]                   // 안개를 걷어 이 층 보상으로 받을 낱말 id
  hints: Record<string, number>             // 질문별 단서 보기로 지운 보기 index (= 도움받음)
  optionOrder: Record<string, number[]>     // 질문별 보기 표시 순서
  textCards: TextCard[]
  deck: string[]                            // 내 낱말 묶음 (낱말 id)
  wordUses: Record<string, number>          // 낱말별 이번 탑에 남은 사용 횟수
  freeHint: boolean
  rumor: RumorState                         // 헛소문: 없음 / 살아 있음 / 봉인 / 퍼짐
  combo: number                             // 연속 정타 (탑 안에서 층을 넘어 이어짐)
  boons: BoonId[]                           // 이 탑에서 고른 보물
  guard: number                             // 돌문진: 이 층 첫 공격에서 덜 받을 피해 (한 번 쓰면 0)
  tally: { hits: number; misses: number; summaryFails: number }   // 질문 정타·그 밖, 요약 실패 수 (별·도움 판정)
  outcome: 'playing' | 'won' | 'lost'
  events: BattleEvent[]                     // 방금 action에서 일어난 일 (화면 연출용)
}

export type Action =
  | { type: 'resolveQuestion'; questionId: string; option: number; evidence: number[]; confidence: Confidence; attachedWordId?: string }
  | { type: 'useHint'; questionId: string }
  | { type: 'resolveFog'; wordIndex: number; sentence: number }
  | { type: 'resolveWordCard'; wordId: string; pass: boolean; answer: string }   // 뜻 쓰기 (채점은 화면에서)
  | { type: 'resolveWordPick'; wordId: string; choice: number }                  // 뜻 고르기 (0 = 바른 뜻)
  | { type: 'resolveSummary'; pass: boolean; answer: string }
  | { type: 'resolveRumor'; evidence: number[]; pass: boolean; answer: string }
  | { type: 'endTurn' }

export interface BattleSetup {
  passage: Passage; deck: string[]; wordUses: Record<string, number>; seed: number; playerHp: number; playerMaxHp: number
  combo?: number; boons?: BoonId[]; ease?: number
}

export function createBattle({ passage, deck, wordUses, seed, playerHp, playerMaxHp, combo = 0, boons = [], ease = 0 }: BattleSetup): GameState {
  let rng = seed >>> 0
  const optionOrder: Record<string, number[]> = {}
  for (const q of passage.questions) {
    const [order, next] = shuffle(q.options.map((_, i) => i), rng)
    optionOrder[q.id] = order
    rng = next
  }
  const state: GameState = {
    version: STATE_VERSION, rng, passage, turn: 0, think: 0,
    player: { hp: playerHp, maxHp: playerMaxHp, block: 0 },
    enemy: { hp: passage.enemy.maxHp, maxHp: passage.enemy.maxHp, patternIndex: 0, attackBonus: 0, ease },
    fogCleared: [], reservedWords: [], hints: {}, optionOrder,
    textCards: [
      ...passage.questions.map((q) => ({ kind: 'question' as const, refId: q.id, lockedThisTurn: false })),
      ...passage.lockedWords.map((_, i) => ({ kind: 'fog' as const, refId: String(i), lockedThisTurn: false })),
      ...(passage.rumor ? [{ kind: 'rumor' as const, refId: passage.id, lockedThisTurn: false }] : []),
    ],
    deck: [...deck], wordUses: { ...wordUses },
    freeHint: hasBoon(boons, 'lamp'),                       // 밝은 등불: 층마다 단서 한 번 공짜
    rumor: passage.rumor ? 'active' : 'none',
    combo, boons: [...boons],
    guard: hasBoon(boons, 'stone') ? BALANCE.boon.stoneGuard : 0,
    tally: { hits: 0, misses: 0, summaryFails: 0 },
    outcome: 'playing', events: [],
  }
  return startTurn(state)
}

export function reduce(s: GameState, a: Action): GameState {
  if (s.outcome !== 'playing') return s
  switch (a.type) {
    case 'resolveQuestion': return resolveQuestion(s, a)
    case 'useHint': return useHint(s, a.questionId)
    case 'resolveFog': return resolveFog(s, a.wordIndex, a.sentence)
    case 'resolveRumor': return resolveRumor(s, a.evidence, a.pass)
    case 'resolveWordCard': return resolveWordWrite(s, a.wordId, a.pass)
    case 'resolveWordPick': return resolveWordPick(s, a.wordId, a.choice)
    case 'resolveSummary': return resolveSummary(s, a.pass)
    case 'endTurn': {
      const attacked = enemyAttack({ ...s, events: [] })
      return attacked.outcome === 'lost' ? attacked : startTurn(attacked)
    }
  }
}

export { canUseWord, hasShield, incomingDamage, nextEnemyAttack } from './select'
