// 층 별 평가 (docs/개편-기록.md 2장). 이긴 전투에서 별 1~3개
// ★ 봉인 성공 · ★ 질문을 모두 정타로(헛소문 반박은 빼고 센다) · ★ 체력을 절반 이상 남김
import { BALANCE } from './balance'
import type { GameState } from './state'

export interface StarCheck {
  sealed: boolean            // 요약으로 봉인했다
  allHits: boolean           // 이 글의 질문 카드를 모두 정타로 냈다 (건너뛴 질문이 있으면 아님)
  healthy: boolean           // 체력을 절반 이상 남겼다
}

export function starChecks(s: GameState): StarCheck {
  return {
    sealed: s.outcome === 'won',
    allHits: s.tally.hits >= s.passage.questions.length,
    healthy: s.player.hp >= Math.ceil(s.player.maxHp * BALANCE.starHpRatio),
  }
}

/** 봉인하지 못했으면 0 */
export function starCount(c: StarCheck): number {
  if (!c.sealed) return 0
  return 1 + (c.allHits ? 1 : 0) + (c.healthy ? 1 : 0)
}
