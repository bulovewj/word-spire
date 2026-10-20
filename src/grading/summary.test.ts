import { describe, expect, it } from 'vitest'
import { bee1 } from '../content/passages/bee-1'
import { SUMMARY_REASON, decideSummary, gradeSummary, gradeSummarySimple, lengthOk, missingConcepts } from './summary'
import type { SimilarityFn } from './word'

const spec = bee1.summary
const GOOD = '꿀벌이 줄어들면 과일과 채소도 줄어서 밥상이 위험해진다'   // 기획안 5장 예시

describe('1단계 길이 (공백 제외 10~60자)', () => {
  it('너무 짧거나 길면 실패', () => {
    expect(lengthOk('꿀벌 줄어듦')).toBe(false)
    expect(lengthOk('가'.repeat(61))).toBe(false)
    expect(lengthOk(GOOD)).toBe(true)
  })
  it('공백은 세지 않는다', () => {
    expect(lengthOk('가 나 다 라 마 바 사 아 자')).toBe(false)   // 9자
  })
})

describe('2단계 핵심 개념', () => {
  it('기획안 예시는 세 개념이 다 있다', () => {
    expect(missingConcepts(GOOD, spec)).toEqual([])
  })
  it('빠진 개념의 이름을 알려 준다', () => {
    expect(missingConcepts('과일과 채소가 밥상에서 위험해진다', spec)).toEqual(['누가(꿀벌)', '꿀벌이 어떻게 되는지'])
  })
  it('띄어쓰기가 달라도 찾는다', () => {
    const s = { ...spec, concepts: [['살 곳']], conceptLabels: ['살 곳'], minConcepts: 1 }
    expect(missingConcepts('동물들이 살곳을 지켜야 한다', s)).toEqual([])
  })
})

describe('판정 순서 (가짜 유사도)', () => {
  it('오답 앵커가 같거나 더 가까우면 일부만 쓴 것', () => {
    expect(decideSummary({ own: 0.9, reject: 0.9 }).reason).toBe(SUMMARY_REASON.partial)
  })
  it('기준 미만이면 뜻이 잘 안 통함', () => {
    expect(decideSummary({ own: 0.85, reject: 0.8 }).reason).toBe(SUMMARY_REASON.unclear)
  })
  it('다 넘으면 통과', () => {
    expect(decideSummary({ own: 0.9, reject: 0.8 }).pass).toBe(true)
  })
})

describe('gradeSummary', () => {
  const sim = (own: number, reject: number): SimilarityFn => async (_a, refs) =>
    refs.map((r) => (spec.models.includes(r) ? own : reject))
  it('개념이 모자라면 유사도를 계산하지 않고 빠진 것을 알려 준다', async () => {
    let called = false
    const g = await gradeSummary('과일과 채소가 밥상에서 위험해진다', spec, async (_a, refs) => { called = true; return refs.map(() => 1) })
    expect(g).toMatchObject({ pass: false, reason: '빠진 것: 누가(꿀벌), 꿀벌이 어떻게 되는지', mode: 'precheck' })
    expect(called).toBe(false)
  })
  it('모범 요약과 오답 앵커를 나눠 최고값을 잰다', async () => {
    expect(await gradeSummary(GOOD, spec, sim(0.93, 0.88))).toMatchObject({ pass: true, own: 0.93, reject: 0.88, mode: 'semantic' })
    expect(await gradeSummary(GOOD, spec, sim(0.88, 0.9))).toMatchObject({ pass: false, reason: SUMMARY_REASON.partial })
  })
})

describe('간이 채점', () => {
  it('길이와 핵심 개념만 보면 통과', () => {
    expect(gradeSummarySimple(GOOD, spec)).toMatchObject({ pass: true, mode: 'simple' })
  })
  it('개념이 빠지면 실패', () => {
    expect(gradeSummarySimple('꿀벌은 꽃가루를 옮긴다는 내용이다', spec).pass).toBe(false)
  })
})
