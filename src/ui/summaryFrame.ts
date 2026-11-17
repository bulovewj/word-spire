import type { SummarySpec } from '../content/types'

const BLANK = '○○'

/**
 * 요약 틀: 모범 요약 첫 문장에서 핵심 개념 낱말 자리를 비운 것.
 * 요약을 여러 번 실패한 학생에게만 보여 준다(도움받아 해결로 기록). 개념 묶음마다 처음 찾은 낱말 하나만 비운다
 */
export function summaryFrame(spec: SummarySpec): string {
  let frame = spec.models[0] ?? ''
  for (const group of spec.concepts) {
    const found = group.find((w) => frame.includes(w))
    if (found) frame = frame.split(found).join(BLANK)
  }
  return frame
}
