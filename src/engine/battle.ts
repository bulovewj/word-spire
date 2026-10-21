// reduce가 쓰는 턴 단계들. 전부 순수 함수.
import { BALANCE } from './balance'
import { rumorAttackBonus } from './rumor'
import type { GameState, TextCard } from './state'

/** 적의 다음 공격 (확신 벌·헛소문 포함) */
export function nextEnemyAttack(s: GameState): number {
  const p = s.passage.enemy.pattern
  return (p[s.enemy.patternIndex % p.length] ?? 0) + s.enemy.attackBonus + rumorAttackBonus(s)
}

export function startTurn(s: GameState): GameState {
  return {
    ...s,
    turn: s.turn + 1,
    think: BALANCE.thinkPerTurn,
    player: { ...s.player, block: 0 },
    textCards: s.textCards.map((c) => (c.lockedThisTurn ? { ...c, lockedThisTurn: false } : c)),
  }
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
