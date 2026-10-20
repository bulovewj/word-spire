// 안개 걷기와 단서 보기 (기획안 6-1·6-2·6-3 · 작업지시서 F2, F3). reduce가 부른다.
import { BALANCE } from './balance'
import { nextRandom } from './rng'
import type { GameState } from './state'

/** 안개 걷기: 잠긴 낱말의 단서 문장을 골랐는지. 성공하면 보호막이 걷히고 낱말 카드를 예약, 실패하면 이번 턴 잠김 */
export function resolveFog(s: GameState, wordIndex: number, sentence: number): GameState {
  const card = s.textCards.find((c) => c.kind === 'fog' && c.refId === String(wordIndex))
  const lw = s.passage.lockedWords[wordIndex]
  if (!card || !lw || card.lockedThisTurn || s.think < BALANCE.fogCost) return s
  const think = s.think - BALANCE.fogCost
  const pass = lw.clues.includes(sentence)
  const events: GameState['events'] = [{ kind: 'fog', pass, wordId: lw.card.id }]
  if (pass) {
    return {
      ...s, think, events,
      fogCleared: [...s.fogCleared, wordIndex],
      reservedWords: [...s.reservedWords, lw.card.id],
      textCards: s.textCards.filter((c) => c !== card),
    }
  }
  return { ...s, think, events, textCards: s.textCards.map((c) => (c === card ? { ...c, lockedThisTurn: true } : c)) }
}

/**
 * 단서 보기: 지금 고르는 질문의 틀린 보기 하나를 지운다. 질문당 1번, 생각력 1
 * (애매로 틀린 뒤 한 번은 공짜). 질문을 낼 생각력이 남아 있어야 쓸 수 있다.
 */
export function useHint(s: GameState, questionId: string): GameState {
  const q = s.passage.questions.find((x) => x.id === questionId)
  const card = s.textCards.find((c) => c.kind === 'question' && c.refId === questionId)
  if (!q || !card || card.lockedThisTurn || s.hints[q.id] !== undefined) return s
  const cost = hintCost(s)
  if (s.think < cost + BALANCE.questionCost[q.type]) return s
  const wrong = q.options.map((_, i) => i).filter((i) => i !== q.answer)
  const [r, rng] = nextRandom(s.rng)
  const dimmed = wrong[Math.floor(r * wrong.length)] ?? 0
  return {
    ...s, rng,
    think: s.think - cost,
    freeHint: cost === 0 ? false : s.freeHint,
    hints: { ...s.hints, [q.id]: dimmed },
    events: [{ kind: 'hint', questionId: q.id, free: cost === 0 }],
  }
}

export function hintCost(s: GameState): number {
  return s.freeHint ? 0 : BALANCE.hintCost
}
