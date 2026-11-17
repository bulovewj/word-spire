// reduce가 쓰는 턴 단계들. 전부 순수 함수.
import { BALANCE } from './balance'
import { nextEnemyAttack, summaryOpen } from './select'
import type { GameState, TextCard } from './state'

export function startTurn(s: GameState): GameState {
  return {
    ...s,
    turn: s.turn + 1,
    think: BALANCE.thinkPerTurn,
    player: { ...s.player, block: 0 },
    textCards: s.textCards.map((c) => (c.lockedThisTurn ? { ...c, lockedThisTurn: false } : c)),
  }
}

/** 턴 끝 적 공격. 방어와 돌문진(이 층 첫 공격만)이 먼저 막는다 */
export function enemyAttack(s: GameState): GameState {
  const attack = nextEnemyAttack(s)
  const damage = Math.max(0, attack - s.player.block - s.guard)
  const hp = s.player.hp - damage
  return {
    ...s,
    guard: 0,
    player: { ...s.player, hp: Math.max(0, hp) },
    enemy: { ...s.enemy, patternIndex: s.enemy.patternIndex + 1, attackBonus: 0 },
    outcome: hp <= 0 ? 'lost' : s.outcome,
    events: [...s.events, { kind: 'enemy', attack, damage }],
  }
}

/**
 * 연속 정타: 정타면 +1, 아니면 끊긴다. 배수(comboThinkEvery)에 닿을 때마다 번뜩임으로 생각력 +1.
 * 탑 안에서 층을 넘어 이어진다(run.ts)
 */
export function applyCombo(s: GameState, hit: boolean): GameState {
  if (!hit) return s.combo === 0 ? s : { ...s, combo: 0 }
  const combo = s.combo + 1
  if (combo % BALANCE.comboThinkEvery !== 0) return { ...s, combo }
  return { ...s, combo, think: s.think + 1, events: [...s.events, { kind: 'spark', think: 1 }] }
}

function withSummaryCard(s: GameState): GameState {
  const card: TextCard = { kind: 'summary', refId: s.passage.id, lockedThisTurn: false }
  return { ...s, textCards: [...s.textCards, card], events: [...s.events, { kind: 'summaryUnlocked' }] }
}

/** 적 체력이 40% 이하가 되면 요약 봉인 카드를 손패에 */
export function unlockSummaryIfLow(s: GameState): GameState {
  if (summaryOpen(s) || s.enemy.hp > s.enemy.maxHp * BALANCE.summaryUnlockRatio) return s
  return withSummaryCard(s)
}

/** 질문을 다 썼는데 요약 봉인이 안 열렸으면 연다 (틀린 질문은 그 자리에서 정답을 보여 주므로 다시 풀지 않는다) */
export function openWhenQuestionsExhausted(s: GameState): GameState {
  if (summaryOpen(s) || s.textCards.some((c) => c.kind === 'question')) return s
  return withSummaryCard(s)
}
