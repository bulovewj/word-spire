// 요약 봉인 (기획안 6-2 · 작업지시서 F5). reduce가 부른다
// 통과하면 적을 봉인하고 이긴다. 실패하면 카드가 이번 턴 동안 잠기고, 실패 횟수를 센다(요약 틀 도움·별 판정)
import { BALANCE } from './balance'
import type { BattleEvent, GameState } from './state'

/** pass = 요약 글 채점 결과(화면에서 채점해 넘긴다) */
export function resolveSummary(s: GameState, pass: boolean): GameState {
  const card = s.textCards.find((c) => c.kind === 'summary')
  if (!card || card.lockedThisTurn || s.think < BALANCE.summaryCost) return s
  const think = s.think - BALANCE.summaryCost
  const events: BattleEvent[] = [{ kind: 'summary', pass }]
  if (pass) {
    return { ...s, think, enemy: { ...s.enemy, hp: 0 }, textCards: s.textCards.filter((c) => c !== card), outcome: 'won', events }
  }
  return {
    ...s, think, events,
    tally: { ...s.tally, summaryFails: s.tally.summaryFails + 1 },
    textCards: s.textCards.map((c) => (c === card ? { ...c, lockedThisTurn: true } : c)),
  }
}
