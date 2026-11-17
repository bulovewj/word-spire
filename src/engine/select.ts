// 전투 상태에서 읽어 내는 값들. 순수 함수, 상태를 바꾸지 않는다
import { BALANCE } from './balance'
import type { GameState } from './state'

/** 안개(잠긴 낱말)가 남아 있으면 보호막 */
export function hasShield(s: GameState): boolean {
  return s.fogCleared.length < s.passage.lockedWords.length
}

/** 이 낱말을 지금 방어·붙이기에 쓸 수 있나 (내 묶음에 있고 횟수가 남음) */
export function canUseWord(s: GameState, wordId: string): boolean {
  return s.deck.includes(wordId) && (s.wordUses[wordId] ?? 0) > 0
}

/** 낱말 횟수를 1 깎은 새 표 */
export function spendWord(s: GameState, wordId: string): Record<string, number> {
  return { ...s.wordUses, [wordId]: (s.wordUses[wordId] ?? 0) - 1 }
}

/** 소문이 봉인되지 않았으면 적 공격에 더할 값 */
export function rumorAttackBonus(s: GameState): number {
  return s.rumor === 'active' || s.rumor === 'spread' ? BALANCE.rumorAttackBonus : 0
}

/** 적의 다음 공격 (확신 벌·헛소문 포함, 다시 도전해 지친 만큼 약해짐. 적어도 1) */
export function nextEnemyAttack(s: GameState): number {
  const p = s.passage.enemy.pattern
  return Math.max(1, (p[s.enemy.patternIndex % p.length] ?? 0) + s.enemy.attackBonus + rumorAttackBonus(s) - s.enemy.ease)
}

/** 내 체력바에 미리 보여 줄 받을 피해 (방어·돌문진을 뺀 값) */
export function incomingDamage(s: GameState): number {
  return Math.max(0, nextEnemyAttack(s) - s.player.block - s.guard)
}

/** 요약 봉인 카드가 손패에 있나 */
export function summaryOpen(s: GameState): boolean {
  return s.textCards.some((c) => c.kind === 'summary')
}

/** 요약을 여러 번 실패해 요약 틀(도움)을 보여 줄 때인가 */
export function summaryHelpOn(s: GameState): boolean {
  return s.tally.summaryFails >= BALANCE.summaryHelpAfter
}
