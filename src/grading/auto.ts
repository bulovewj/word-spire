// 모델이 준비됐으면 의미 채점, 아니면(로딩 중·실패) 간이 채점 (작업지시서 2-3)
import { compareWords, passages, towerWords } from '../content'
import type { SummarySpec, WordEntry } from '../content/types'
import { embedder } from './embedder'
import { gradeSummary, gradeSummarySimple, type SummaryGrade } from './summary'
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

export async function gradeSummaryAuto(answer: string, spec: SummarySpec): Promise<SummaryGrade> {
  if (embedder.getStatus().state === 'ready') {
    try {
      return await gradeSummary(answer, spec, (a, refs) => embedder.similarities(a, refs))
    } catch {
      // 워커 오류 → 아래 간이 채점
    }
  }
  return gradeSummarySimple(answer, spec)
}

/** 전투 시작·모델 준비 때 이 탑의 뜻·요약 기준 문장 벡터를 미리 계산해 둔다 */
export function prewarmTower(towerId: string): void {
  const words = towerWords(towerId).flatMap((w) => [w.meaning, ...w.accepts, ...w.rejects])
  const summaries = passages.filter((p) => p.towerId === towerId).flatMap((p) => [...p.summary.models, ...p.summary.rejects])
  embedder.prewarm([...words, ...summaries])
}
