// reduce가 쓰는 턴 단계들. 전부 순수 함수.
import { BALANCE } from './balance'
import { shuffle } from './rng'
import type { GameState, TextCard } from './state'

/** 적의 다음 공격 (확신 벌 포함) */
export function nextEnemyAttack(s: GameState): number {
  const p = s.passage.enemy.pattern
  return (p[s.enemy.patternIndex % p.length] ?? 0) + s.enemy.attackBonus
}

/** 낱말 카드 n장 뽑기. 뽑을 더미가 비면 버린 더미를 섞는다. 둘 다 비면 그만 */
export function drawWords(s: GameState, n: number): GameState {
  let { drawPile, discardPile, hand, rng } = s
  for (let i = 0; i < n; i++) {
    if (drawPile.length === 0) {
      if (discardPile.length === 0) break
      ;[drawPile, rng] = shuffle(discardPile, rng)
      discardPile = []
    }
    const [top, ...rest] = drawPile
    if (!top) break
    hand = [...hand, top]
    drawPile = rest
  }
  return { ...s, drawPile, discardPile, hand, rng }
}

export function startTurn(s: GameState): GameState {
  const fresh: GameState = {
    ...s,
    turn: s.turn + 1,
    think: BALANCE.thinkPerTurn,
    player: { ...s.player, block: 0 },
    textCards: s.textCards.map((c) => (c.lockedThisTurn ? { ...c, lockedThisTurn: false } : c)),
  }
  return drawWords(fresh, BALANCE.wordDrawPerTurn)
}

export function discardHand(s: GameState): GameState {
  return { ...s, hand: [], discardPile: [...s.discardPile, ...s.hand] }
}

export function enemyAttack(s: GameState): GameState {
  const attack = nextEnemyAttack(s)
  const damage = Math.max(0, attack - s.player.block)
  const hp = s.player.hp - damage
  return {
    ...s,
    player: { ...s.player, hp: Math.max(0, hp) },
    enemy: { ...s.enemy, patternIndex: s.enemy.patternIndex + 1, attackBonus: 0 },
    outcome: hp <= 0 ? 'lost' : s.outcome,
    events: [...s.events, { kind: 'enemy', attack, damage }],
  }
}

function summaryOpen(s: GameState): boolean {
  return s.textCards.some((c) => c.kind === 'summary')
}

function withSummaryCard(s: GameState): GameState {
  const card: TextCard = { kind: 'summary', refId: s.passage.id, lockedThisTurn: false, retry: false }
  return { ...s, textCards: [...s.textCards, card], events: [...s.events, { kind: 'summaryUnlocked' }] }
}

/** 적 체력이 40% 이하가 되면 요약 봉인 카드를 손패에 */
export function unlockSummaryIfLow(s: GameState): GameState {
  if (summaryOpen(s) || s.enemy.hp > s.enemy.maxHp * BALANCE.summaryUnlockRatio) return s
  return withSummaryCard(s)
}

/** 질문을 다 썼는데 요약 봉인이 안 열렸으면: 요약 봉인을 열고 약타·실패 질문을 "다시 보기"로 돌려준다 */
export function openWhenQuestionsExhausted(s: GameState): GameState {
  if (summaryOpen(s) || s.textCards.some((c) => c.kind === 'question')) return s
  const opened = withSummaryCard(s)
  const ids = s.passage.questions.map((q) => q.id).filter((id) => s.lastGrades[id] !== 'hit')
  if (ids.length === 0) return opened
  const cards: TextCard[] = ids.map((id) => ({ kind: 'question', refId: id, lockedThisTurn: false, retry: true }))
  return { ...opened, textCards: [...opened.textCards, ...cards], events: [...opened.events, { kind: 'retry', questionIds: ids }] }
}
