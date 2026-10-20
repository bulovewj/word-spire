import type { Passage, WordEntry } from './types'
import { pack56, STARTER_DECK_56 } from './words/pack-5-6'
import { bee1 } from './passages/bee-1'
import { validateContent } from './validate'

export const wordPacks: Record<string, WordEntry[]> = { 'words/pack-5-6': pack56 }
export const passages: Passage[] = [bee1]
export const starterDeck: string[] = STARTER_DECK_56

/** 앱 시작 전에 부른다. 문제가 있으면 목록을 돌려준다. */
export function checkContent(): string[] {
  return validateContent(wordPacks, passages)
}

const allWords = new Map<string, WordEntry>(
  [...Object.values(wordPacks).flat(), ...passages.flatMap((p) => p.lockedWords.map((lw) => lw.card))].map((w) => [w.id, w]),
)

export function findWord(id: string): WordEntry | undefined {
  return allWords.get(id)
}
