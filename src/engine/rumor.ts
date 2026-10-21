// 헛소문 반박 (기획안 6-2 · 작업지시서 F11, 2026-10-21 시험: 3층부터). reduce가 부른다.
// 한 번만 낸다. 근거 O + 반박 글 통과 = 정타(소문 봉인) / 근거만 O = 약타 / 근거 X = 실패. 정타가 아니면 소문이 퍼진 채 층 끝까지 적 공격 +2
import { BALANCE } from './balance'
import { openWhenQuestionsExhausted, unlockSummaryIfLow } from './battle'
import { evidenceOk, type Grade } from './judge'
import type { GameState } from './state'

export type RumorState = 'none' | 'active' | 'refuted' | 'spread'

/** 소문이 봉인되지 않았으면 적 공격에 더할 값 */
export function rumorAttackBonus(s: GameState): number {
  return s.rumor === 'active' || s.rumor === 'spread' ? BALANCE.rumorAttackBonus : 0
}

export function rumorDamage(grade: Grade, shield: boolean): number {
  if (grade === 'miss') return 0
  let dmg: number = BALANCE.rumorDamage
  if (grade === 'weak') dmg = Math.floor(dmg / 2)
  if (shield) dmg = Math.max(0, dmg - BALANCE.fogShield)
  return dmg
}

/** pass = 반박 글 채점 결과(화면에서 채점해 넘긴다) */
export function resolveRumor(s: GameState, evidence: number[], pass: boolean): GameState {
  const card = s.textCards.find((c) => c.kind === 'rumor')
  const r = s.passage.rumor
  if (!card || !r || card.lockedThisTurn || s.think < BALANCE.rumorCost) return s
  const grade: Grade = !evidenceOk(r.evidence, evidence) ? 'miss' : pass ? 'hit' : 'weak'
  const damage = rumorDamage(grade, s.fogCleared.length < s.passage.lockedWords.length)
  const next: GameState = {
    ...s,
    think: s.think - BALANCE.rumorCost,
    enemy: { ...s.enemy, hp: Math.max(1, s.enemy.hp - damage) },
    textCards: s.textCards.filter((c) => c !== card),
    rumor: grade === 'hit' ? 'refuted' : 'spread',
    events: [{ kind: 'rumor', grade, damage }],
  }
  return openWhenQuestionsExhausted(unlockSummaryIfLow(next))
}
