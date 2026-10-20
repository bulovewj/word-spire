import type { Passage, Tower, WordEntry } from './types'
import { pack56, STARTER_DECK_56 } from './words/pack-5-6'
import { bee1 } from './passages/bee-1'
import { bee2 } from './passages/bee-2'
import { bee3 } from './passages/bee-3'
import { beeTower } from './towers/bee'
import { validateContent } from './validate'

export const wordPacks: Record<string, WordEntry[]> = { 'words/pack-5-6': pack56 }
export const passages: Passage[] = [bee1, bee2, bee3]
export const starterDeck: string[] = STARTER_DECK_56
export const towers: Tower[] = [beeTower]

/** 앱 시작 전에 부른다. 문제가 있으면 목록을 돌려준다. */
export function checkContent(): string[] {
  return validateContent(wordPacks, passages, towers)
}

const allWords = new Map<string, WordEntry>(
  [...Object.values(wordPacks).flat(), ...passages.flatMap((p) => p.lockedWords.map((lw) => lw.card))].map((w) => [w.id, w]),
)

export function findWord(id: string): WordEntry | undefined {
  return allWords.get(id)
}

/** 이 탑에서 나올 수 있는 낱말 전부: 기본 팩 + 이 탑 글들의 안개 낱말 */
export function towerWords(towerId: string): WordEntry[] {
  const tower = passages.filter((p) => p.towerId === towerId).flatMap((p) => p.lockedWords.map((lw) => lw.card))
  return [...Object.values(wordPacks).flat(), ...tower]
}

/** 낱말 뜻 채점의 비교 대상: towerWords에서 자기 자신 제외 (기획안 7장) */
export function compareWords(wordId: string, towerId: string): WordEntry[] {
  return towerWords(towerId).filter((w) => w.id !== wordId)
}
