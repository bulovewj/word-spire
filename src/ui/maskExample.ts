import { findStem } from '../content/wordStem'

const MASK = '○○○'

/** 예문에서 낱말 자리를 가린다(활용형 포함) */
export function maskExample(example: string, word: string): string {
  const stem = findStem(example, word)
  return stem ? example.split(stem).join(MASK) : example
}
