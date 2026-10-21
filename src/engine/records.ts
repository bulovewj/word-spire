// 판정 기록 (작업지시서 F8). 전투 action 앞뒤 상태에서 뽑는다. GameState는 바꾸지 않는다.
import type { QuestionType } from '../content/types'
import type { Confidence } from './judge'
import type { Action, GameState } from './state'

export type Area = 'word' | QuestionType | 'summary'

/** 한 번의 판정. ref = 낱말 id / 질문 id / 글 id */
export interface Judgement {
  area: Area
  ref: string
  correct: boolean
  confidence?: Confidence
  helped: boolean            // 단서 보기를 거침
}

export interface JudgeRecord extends Judgement {
  firstTry: boolean          // 같은 전투(층 다시 하기 포함)에서 이 대상을 처음 풀었나
  scope: string              // 전투 묶음 id
  at: number
}

/** 방금 action으로 생긴 판정. 안개 걷기·단서 보기·턴 끝은 기록하지 않는다 */
export function judgementsFrom(prev: GameState, a: Action, next: GameState): Judgement[] {
  if (next === prev) return []
  const out: Judgement[] = []
  for (const e of next.events) {
    if (e.kind === 'question' && a.type === 'resolveQuestion') {
      const q = prev.passage.questions.find((x) => x.id === e.questionId)
      if (!q) continue
      out.push({ area: q.type, ref: q.id, correct: e.grade === 'hit', confidence: a.confidence, helped: prev.hints[q.id] !== undefined })
    } else if (e.kind === 'word') {
      out.push({ area: 'word', ref: e.wordId, correct: e.pass, helped: false })
    } else if (e.kind === 'summary') {
      out.push({ area: 'summary', ref: prev.passage.id, correct: e.pass, helped: false })
    }
  }
  return out
}

export const RECORD_LIMIT = 3000   // 기기 저장 용량을 넘지 않게 오래된 것부터 버림

export function addRecords(log: JudgeRecord[], items: Judgement[], scope: string, at: number): JudgeRecord[] {
  const added: JudgeRecord[] = []
  for (const j of items) {
    const seen = [...log, ...added].some((r) => r.scope === scope && r.area === j.area && r.ref === j.ref)
    added.push({ ...j, firstTry: !seen, scope, at })
  }
  return [...log, ...added].slice(-RECORD_LIMIT)
}
