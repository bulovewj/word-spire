import { describe, expect, it } from 'vitest'
import { compareWords, passages } from '../content'
import { pack56 } from '../content/words/pack-5-6'
import type { WordEntry } from '../content/types'
import { charSimilarity, cosine } from './cosine'
import { REASON, decideWord, gradeWord, gradeWordSimple, precheck, type SimilarityFn } from './word'

const balNeolda = pack56.find((w) => w.id === 'g01') as WordEntry   // 발이 넓다

describe('사전 검사', () => {
  it('모르겠다류는 짐작이라도', () => {
    expect(precheck('모르겠어요', '발이 넓다')).toBe(REASON.giveUp)
    expect(precheck('  잘 모르겠다', '발이 넓다')).toBe(REASON.giveUp)
    expect(precheck('???', '발이 넓다')).toBe(REASON.giveUp)
  })
  it('2글자 미만은 더 길게', () => {
    expect(precheck('음', '협력')).toBe(REASON.tooShort)
    expect(precheck(' . ', '협력')).toBe(REASON.tooShort)
  })
  it('낱말을 베끼면(띄어쓰기·문장부호 무시, 2글자 이내 추가) 풀어서', () => {
    expect(precheck('발이넓다.', '발이 넓다')).toBe(REASON.copied)
    expect(precheck('발이 넓다는 것', '발이 넓다')).toBe(REASON.copied)
    expect(precheck('발이 넓다는 뜻이다', '발이 넓다')).toBeNull()
    expect(precheck('친구가 많다', '발이 넓다')).toBeNull()
  })
})

describe('판정 순서 (가짜 유사도)', () => {
  it('반대 뜻이 같거나 더 가까우면 실패가 먼저', () => {
    expect(decideWord({ own: 0.9, other: 0.95, reject: 0.9 }).reason).toBe(REASON.opposite)
  })
  it('다른 낱말이 더 가까우면 헷갈림', () => {
    expect(decideWord({ own: 0.9, other: 0.91, reject: 0.8 }).reason).toBe(REASON.confused)
  })
  it('기준 0.88 미만이면 뜻이 조금 다름', () => {
    expect(decideWord({ own: 0.87, other: 0.8, reject: 0.8 }).reason).toBe(REASON.off)
  })
  it('다 넘으면 통과', () => {
    expect(decideWord({ own: 0.9, other: 0.85, reject: 0.8 })).toEqual({ pass: true, reason: '' })
  })
})

describe('gradeWord', () => {
  const fakeSim = (table: Record<string, number>): SimilarityFn => async (_a, refs) => refs.map((r) => table[r] ?? 0.5)

  it('기준 문장을 무리별 최고값으로 묶는다', async () => {
    const others = [pack56[1]!]   // 손이 크다
    const sim = fakeSim({ '친구나 아는 사람이 많다': 0.93, '아는 사람이 거의 없다': 0.86, '무엇이든 많이 준다': 0.89 })
    const g = await gradeWord('친구가 많다', balNeolda, others, sim)
    expect(g).toMatchObject({ pass: true, own: 0.93, reject: 0.86, other: 0.89, mode: 'semantic' })
  })
  it('사전 검사에 걸리면 유사도를 계산하지 않는다', async () => {
    let called = false
    const sim: SimilarityFn = async (_a, refs) => { called = true; return refs.map(() => 1) }
    const g = await gradeWord('모르겠어요', balNeolda, [], sim)
    expect(g).toMatchObject({ pass: false, reason: REASON.giveUp, mode: 'precheck' })
    expect(called).toBe(false)
  })
})

describe('간이 채점', () => {
  it('뜻을 그대로 쓰면 통과', () => {
    expect(gradeWordSimple('아는 사람이 많다', balNeolda).pass).toBe(true)
  })
  it('반대 뜻을 쓰면 반대 뜻 이유', () => {
    expect(gradeWordSimple('아는 사람이 거의 없다', balNeolda).reason).toBe(REASON.opposite)
  })
  it('엉뚱한 말이면 실패', () => {
    expect(gradeWordSimple('하늘이 파랗다', balNeolda).pass).toBe(false)
  })
})

describe('유사도 도구', () => {
  it('코사인', () => {
    expect(cosine([1, 0], [1, 0])).toBe(1)
    expect(cosine([1, 0], [0, 1])).toBe(0)
    expect(cosine([0, 0], [1, 0])).toBe(0)
  })
  it('글자 유사도는 같은 문장 1, 띄어쓰기 무시', () => {
    expect(charSimilarity('아는 사람', '아는사람')).toBeCloseTo(1)
  })
})

describe('비교 대상 낱말', () => {
  it('기본 팩 + 이 탑 안개 낱말, 자기 자신 제외', () => {
    const ids = compareWords('h01', 'bee').map((w) => w.id)
    const expected = [...pack56.map((w) => w.id), ...passages.filter((p) => p.towerId === 'bee')
      .flatMap((p) => p.lockedWords.map((lw) => lw.card.id))].filter((id) => id !== 'h01')
    expect(ids).not.toContain('h01')
    expect(ids).toContain('bee-w1')
    expect([...ids].sort()).toEqual(expected.sort())
  })
})
