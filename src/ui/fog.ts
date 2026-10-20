import type { GameState } from '../engine/state'

export const FOG = '▒▒'

/** 안개가 남은 낱말을 글에서 가린다. 본문뿐 아니라 질문·보기·카드 문구에도 쓴다 */
export function maskFog(text: string, words: string[]): string {
  return words.reduce((t, w) => (w ? t.split(w).join(FOG) : t), text)
}

/** 아직 걷히지 않은 잠긴 낱말들 */
export function activeFogWords(s: GameState): string[] {
  return s.passage.lockedWords.filter((_, i) => !s.fogCleared.includes(i)).map((lw) => lw.word)
}
