// 요약 채점 (작업지시서 2-2, 2-3). 유사도는 밖에서 주입한다.
import type { SummarySpec } from '../content/types'
import { normalizeText } from './cosine'
import { POLICY } from './policy'
import type { GradeMode, SimilarityFn } from './word'

export interface SummaryGrade {
  pass: boolean
  missing: string[]        // 빠진 핵심 개념의 conceptLabels
  own: number              // 모범 요약과의 최고 유사도
  reject: number           // 오답 요약 앵커와의 최고 유사도
  reason: string
  mode: GradeMode
}

export const SUMMARY_REASON = {
  length: '한 문장으로, 너무 짧지도 길지도 않게!',
  partial: '글의 일부만 썼거나 내용이 달라.',
  unclear: '핵심은 있는데 뜻이 잘 안 통해.',
} as const

/** 1단계: 길이(공백 제외) */
export function lengthOk(answer: string): boolean {
  const n = answer.replace(/\s/g, '').length
  return n >= POLICY.summaryMinLength && n <= POLICY.summaryMaxLength
}

/** 2단계: 핵심 개념. 동의어 묶음 중 하나라도 들어 있으면 그 개념 있음(띄어쓰기 무시) */
export function missingConcepts(answer: string, spec: SummarySpec): string[] {
  const a = normalizeText(answer)
  return spec.concepts
    .map((group, i) => (group.some((w) => a.includes(normalizeText(w))) ? null : spec.conceptLabels[i] ?? ''))
    .filter((x): x is string => x !== null)
}

function base(answer: string, spec: SummarySpec): SummaryGrade | { missing: string[] } {
  if (!lengthOk(answer)) return { pass: false, missing: [], own: 0, reject: 0, reason: SUMMARY_REASON.length, mode: 'precheck' }
  const missing = missingConcepts(answer, spec)
  if (spec.concepts.length - missing.length < spec.minConcepts) {
    return { pass: false, missing, own: 0, reject: 0, reason: `빠진 것: ${missing.join(', ')}`, mode: 'precheck' }
  }
  return { missing }
}

const isGrade = (x: SummaryGrade | { missing: string[] }): x is SummaryGrade => 'pass' in x
const maxOf = (xs: number[]) => (xs.length === 0 ? 0 : Math.max(...xs))

/** 3~4단계 판정 순서 */
export function decideSummary(s: { own: number; reject: number }): { pass: boolean; reason: string } {
  if (s.reject >= s.own) return { pass: false, reason: SUMMARY_REASON.partial }
  if (s.own < POLICY.summaryOwnMin) return { pass: false, reason: SUMMARY_REASON.unclear }
  return { pass: true, reason: '' }
}

export async function gradeSummary(answer: string, spec: SummarySpec, sim: SimilarityFn): Promise<SummaryGrade> {
  const pre = base(answer, spec)
  if (isGrade(pre)) return pre
  const scores = await sim(answer, [...spec.models, ...spec.rejects])
  const own = maxOf(scores.slice(0, spec.models.length))
  const reject = maxOf(scores.slice(spec.models.length))
  return { ...decideSummary({ own, reject }), missing: pre.missing, own, reject, mode: 'semantic' }
}

/** 간이 채점: 길이와 핵심 개념만 */
export function gradeSummarySimple(answer: string, spec: SummarySpec): SummaryGrade {
  const pre = base(answer, spec)
  if (isGrade(pre)) return pre
  return { pass: true, missing: pre.missing, own: 0, reject: 0, reason: '', mode: 'simple' }
}
