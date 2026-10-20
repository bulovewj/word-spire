// 모델이 준비됐으면 의미 채점, 아니면(로딩 중·실패) 간이 채점 (작업지시서 2-3)
import { compareWords, towerWords } from '../content'
import type { WordEntry } from '../content/types'
import { embedder } from './embedder'
import { gradeWord, gradeWordSimple, type WordGrade } from './word'

export async function gradeWordAuto(answer: string, entry: WordEntry, towerId: string): Promise<WordGrade> {
  if (embedder.getStatus().state === 'ready') {
    try {
      return await gradeWord(answer, entry, compareWords(entry.id, towerId), (a, refs) => embedder.similarities(a, refs))
    } catch {
      // 워커 오류 → 아래 간이 채점
    }
  }
  return gradeWordSimple(answer, entry)
}

/** 전투 시작·모델 준비 때 비교 대상 뜻 벡터를 미리 계산해 둔다 */
export function prewarmTower(towerId: string): void {
  embedder.prewarm(towerWords(towerId).flatMap((w) => [w.meaning, ...w.accepts, ...w.rejects]))
}
