import type { Passage, Tower, WordEntry } from './types'
import { pack56, STARTER_DECK_56 } from './words/pack-5-6'
import { bee1 } from './passages/bee-1'
import { bee2 } from './passages/bee-2'
import { bee3 } from './passages/bee-3'
import { hangul1 } from './passages/hangul-1'
import { hangul2 } from './passages/hangul-2'
import { hangul3 } from './passages/hangul-3'
import { beeTower } from './towers/bee'
import { hangulTower } from './towers/hangul'
import { validateContent } from './validate'

export const wordPacks: Record<string, WordEntry[]> = { 'words/pack-5-6': pack56 }
export const passages: Passage[] = [bee1, bee2, bee3, hangul1, hangul2, hangul3]
export const starterDeck: string[] = STARTER_DECK_56
export const towers: Tower[] = [beeTower, hangulTower]

/** 층 보상의 '새 낱말'로 나올 수 있는 낱말 (기본 낱말 팩 전체) */
export const rewardWordPool: string[] = pack56.map((w) => w.id)

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

/** 게임에 나오는 모든 낱말: 기본 팩 + 모든 탑의 안개 낱말 (부적첩 순서) */
export function allWordEntries(): WordEntry[] {
  return [...allWords.values()]
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

/** 탑의 글을 층 순서대로 */
export function towerFloors(towerId: string): Passage[] {
  return passages.filter((p) => p.towerId === towerId).sort((a, b) => a.floor - b.floor)
}

export function findTower(id: string): Tower | undefined {
  return towers.find((t) => t.id === id)
}

/** 이 탑을 시작할 때의 낱말 묶음 */
export function starterFor(towerId: string): string[] {
  return findTower(towerId)?.starter ?? starterDeck
}

export function findPassage(id: string): Passage | undefined {
  return passages.find((p) => p.id === id)
}
