// 낱말 뜻 채점 (작업지시서 2-1, 2-3). 유사도 계산은 밖에서 주입한다 → 테스트는 가짜 값으로.
import type { WordEntry } from '../content/types'
import { charSimilarity, normalizeText } from './cosine'
import { POLICY } from './policy'

export type GradeMode = 'semantic' | 'simple' | 'precheck'

export interface WordGrade {
  pass: boolean
  own: number
  other: number
  reject: number
  reason: string
  mode: GradeMode
}

/** 답 하나와 기준 문장들의 유사도 목록 */
export type SimilarityFn = (answer: string, refs: string[]) => Promise<number[]>

export const REASON = {
  giveUp: '짐작이라도 써 봐!',
  tooShort: '조금 더 길게',
  copied: '뜻을 풀어서 써 봐!',
  opposite: '반대 뜻에 가까워!',
  confused: '다른 낱말이랑 헷갈렸나 봐.',
  off: '뜻이 조금 달라.',
  pass: '',
} as const

/** 1단계 사전 검사. 걸리면 이유, 아니면 null */
export function precheck(answer: string, word: string): string | null {
  const trimmed = answer.trim()
  if (POLICY.giveUpPrefixes.some((p) => trimmed.startsWith(p))) return REASON.giveUp
  const a = normalizeText(trimmed)
  if (a.length < POLICY.minAnswerLength) return REASON.tooShort
  const w = normalizeText(word)
  if (a.includes(w) && a.length - w.length <= POLICY.copyExtraChars) return REASON.copied
  return null
}

/** 2~5단계 판정 순서 */
export function decideWord(s: { own: number; other: number; reject: number }): { pass: boolean; reason: string } {
  if (s.reject >= s.own) return { pass: false, reason: REASON.opposite }
  if (s.own - s.other < POLICY.wordOtherMargin) return { pass: false, reason: REASON.confused }
  if (s.own < POLICY.wordOwnMin) return { pass: false, reason: REASON.off }
  return { pass: true, reason: REASON.pass }
}

const ownRefs = (w: WordEntry) => [w.meaning, ...w.accepts]
const maxOf = (xs: number[]) => (xs.length === 0 ? 0 : Math.max(...xs))

/** 의미 채점. others = 비교 대상 낱말(자기 자신 제외) */
export async function gradeWord(answer: string, entry: WordEntry, others: WordEntry[], sim: SimilarityFn): Promise<WordGrade> {
  const pre = precheck(answer, entry.word)
  if (pre) return { pass: false, own: 0, other: 0, reject: 0, reason: pre, mode: 'precheck' }

  const groups = [ownRefs(entry), entry.rejects, ...others.map(ownRefs)]
  const scores = await sim(answer, groups.flat())
  let at = 0
  const best = groups.map((g) => { const m = maxOf(scores.slice(at, at + g.length)); at += g.length; return m })
  const [own = 0, reject = 0, ...rest] = best
  const other = maxOf(rest)
  return { ...decideWord({ own, other, reject }), own, other, reject, mode: 'semantic' }
}

/** 간이 채점: 모델이 없을 때 */
export function gradeWordSimple(answer: string, entry: WordEntry): WordGrade {
  const pre = precheck(answer, entry.word)
  if (pre) return { pass: false, own: 0, other: 0, reject: 0, reason: pre, mode: 'precheck' }
  const own = maxOf(ownRefs(entry).map((r) => charSimilarity(answer, r)))
  const reject = maxOf(entry.rejects.map((r) => charSimilarity(answer, r)))
  const base = { own, other: 0, reject, mode: 'simple' as const }
  if (reject >= own) return { ...base, pass: false, reason: REASON.opposite }
  if (own < POLICY.simpleWordMin) return { ...base, pass: false, reason: REASON.off }
  return { ...base, pass: true, reason: REASON.pass }
}

/** 뜻 가까움 미터 0~1 */
export function meterValue(g: WordGrade): number {
  const [lo, hi] = g.mode === 'simple' ? POLICY.meterSimple : POLICY.meterSemantic
  return Math.max(0, Math.min(1, (g.own - lo) / (hi - lo)))
}
