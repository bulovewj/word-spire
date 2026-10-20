// 전투 상태와 reduce (기획안 6장 · 작업지시서 F2-1, F4, F6). 안개·단서는 support.ts
import type { Passage } from '../content/types'
import { BALANCE } from './balance'
import { discardHand, enemyAttack, nextEnemyAttack, openWhenQuestionsExhausted, startTurn, unlockSummaryIfLow } from './battle'
import { judgeQuestion, type Confidence, type Grade } from './judge'
import { shuffle } from './rng'
import { resolveFog, useHint } from './support'

export const STATE_VERSION = 5

export interface WordCardInstance { uid: string; wordId: string }

export interface TextCard {
  kind: 'question' | 'fog' | 'summary'
  refId: string               // question id / lockedWords index / passage id
  lockedThisTurn: boolean
  retry: boolean              // "다시 보기"로 돌아온 질문
}

export type BattleEvent =
  | { kind: 'question'; questionId: string; grade: Grade; damage: number; enemyAttackBonus: number }
  | { kind: 'word'; wordId: string; pass: boolean; block: number }
  | { kind: 'enemy'; attack: number; damage: number }
  | { kind: 'summaryUnlocked' }
  | { kind: 'summary'; pass: boolean }
  | { kind: 'retry'; questionIds: string[] }
  | { kind: 'fog'; pass: boolean; wordId: string }
  | { kind: 'hint'; questionId: string; free: boolean }

export interface GameState {
  version: number
  rng: number
  passage: Passage
  turn: number
  think: number
  player: { hp: number; maxHp: number; block: number }
  enemy: { hp: number; maxHp: number; patternIndex: number; attackBonus: number }
  fogCleared: number[]                      // 안개를 걷은 lockedWords index
  reservedWords: string[]                   // 안개를 걷어 이 층 보상으로 받을 낱말 id (M8에서 덱에)
  hints: Record<string, number>             // 질문별 단서 보기로 지운 보기 index (= 도움받음)
  optionOrder: Record<string, number[]>     // 질문별 보기 표시 순서
  textCards: TextCard[]
  hand: WordCardInstance[]
  drawPile: WordCardInstance[]
  discardPile: WordCardInstance[]
  lastGrades: Record<string, Grade>         // 질문별 마지막 판정 (다시 보기용)
  freeHint: boolean
  nextUid: number
  outcome: 'playing' | 'won' | 'lost'
  events: BattleEvent[]                     // 방금 action에서 일어난 일 (화면 연출용)
}

export type Action =
  | { type: 'resolveQuestion'; questionId: string; option: number; evidence: number[]; confidence: Confidence; attachedWordUid?: string }
  | { type: 'useHint'; questionId: string }
  | { type: 'resolveFog'; wordIndex: number; sentence: number }
  | { type: 'resolveWordCard'; uid: string; pass: boolean; answer: string }
  | { type: 'resolveSummary'; pass: boolean; answer: string }
  | { type: 'endTurn' }

export interface BattleSetup { passage: Passage; deck: string[]; seed: number; playerHp: number; playerMaxHp: number }

export function createBattle({ passage, deck, seed, playerHp, playerMaxHp }: BattleSetup): GameState {
  let rng = seed >>> 0
  const optionOrder: Record<string, number[]> = {}
  for (const q of passage.questions) {
    const [order, next] = shuffle(q.options.map((_, i) => i), rng)
    optionOrder[q.id] = order
    rng = next
  }
  const cards = deck.map((wordId, i) => ({ uid: `w${i}`, wordId }))
  const [drawPile, next] = shuffle(cards, rng)
  const state: GameState = {
    version: STATE_VERSION, rng: next, passage, turn: 0, think: 0,
    player: { hp: playerHp, maxHp: playerMaxHp, block: 0 },
    enemy: { hp: passage.enemy.maxHp, maxHp: passage.enemy.maxHp, patternIndex: 0, attackBonus: 0 },
    fogCleared: [], reservedWords: [], hints: {}, optionOrder,
    textCards: [
      ...passage.questions.map((q) => ({ kind: 'question' as const, refId: q.id, lockedThisTurn: false, retry: false })),
      ...passage.lockedWords.map((_, i) => ({ kind: 'fog' as const, refId: String(i), lockedThisTurn: false, retry: false })),
    ],
    hand: [], drawPile, discardPile: [], lastGrades: {}, freeHint: false,
    nextUid: cards.length, outcome: 'playing', events: [],
  }
  return startTurn(state)
}

/** 내 체력바에 미리 보여 줄 받을 피해 */
export function incomingDamage(s: GameState): number {
  return Math.max(0, nextEnemyAttack(s) - s.player.block)
}

export function hasShield(s: GameState): boolean {
  return s.fogCleared.length < s.passage.lockedWords.length
}

export function reduce(s: GameState, a: Action): GameState {
  if (s.outcome !== 'playing') return s
  switch (a.type) {
    case 'resolveQuestion': {
      const card = s.textCards.find((c) => c.kind === 'question' && c.refId === a.questionId)
      const q = s.passage.questions.find((x) => x.id === a.questionId)
      if (!card || !q || card.lockedThisTurn) return s
      const cost = BALANCE.questionCost[q.type]
      if (s.think < cost) return s
      // 붙이기는 author 질문의 관련 낱말 카드만. 아니면 무시하고 카드는 손패에 남긴다
      const attached = q.type === 'author'
        ? s.hand.find((w) => w.uid === a.attachedWordUid && q.bonusWords?.includes(w.wordId))
        : undefined
      const r = judgeQuestion(q, { option: a.option, evidence: a.evidence, confidence: a.confidence, attachedWordId: attached?.wordId },
        { shield: hasShield(s), retry: card.retry })
      let next: GameState = {
        ...s,
        think: s.think - cost,
        enemy: { ...s.enemy, hp: Math.max(1, s.enemy.hp - r.damage), attackBonus: s.enemy.attackBonus + r.enemyAttackBonus },
        textCards: s.textCards.filter((c) => c !== card),
        hand: attached ? s.hand.filter((w) => w !== attached) : s.hand,
        discardPile: attached ? [...s.discardPile, attached] : s.discardPile,
        lastGrades: { ...s.lastGrades, [q.id]: r.grade },
        freeHint: r.freeHint || s.freeHint,
        events: [{ kind: 'question', questionId: q.id, grade: r.grade, damage: r.damage, enemyAttackBonus: r.enemyAttackBonus }],
      }
      next = unlockSummaryIfLow(next)
      return openWhenQuestionsExhausted(next)
    }
    case 'useHint':
      return useHint(s, a.questionId)
    case 'resolveFog':
      return resolveFog(s, a.wordIndex, a.sentence)
    case 'resolveWordCard': {
      const card = s.hand.find((w) => w.uid === a.uid)
      if (!card || s.think < BALANCE.wordCardCost) return s
      const block = a.pass ? BALANCE.wordCardBlock : 0
      return {
        ...s,
        think: s.think - BALANCE.wordCardCost,
        player: { ...s.player, block: s.player.block + block },
        hand: s.hand.filter((w) => w !== card),
        discardPile: [...s.discardPile, card],
        events: [{ kind: 'word', wordId: card.wordId, pass: a.pass, block }],
      }
    }
    case 'resolveSummary': {
      // 요약 봉인 (기획안 6-2, F5): 통과하면 적을 봉인, 실패하면 이번 턴 동안 잠김
      const card = s.textCards.find((c) => c.kind === 'summary')
      if (!card || card.lockedThisTurn || s.think < BALANCE.summaryCost) return s
      const think = s.think - BALANCE.summaryCost
      const events: BattleEvent[] = [{ kind: 'summary', pass: a.pass }]
      if (a.pass) {
        return { ...s, think, enemy: { ...s.enemy, hp: 0 }, textCards: s.textCards.filter((c) => c !== card), outcome: 'won', events }
      }
      return { ...s, think, textCards: s.textCards.map((c) => (c === card ? { ...c, lockedThisTurn: true } : c)), events }
    }
    case 'endTurn': {
      const attacked = enemyAttack(discardHand({ ...s, events: [] }))
      if (attacked.outcome === 'lost') return attacked
      return startTurn(attacked)
    }
  }
}

export { nextEnemyAttack }
