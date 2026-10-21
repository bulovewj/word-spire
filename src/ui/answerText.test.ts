import { describe, expect, it } from 'vitest'
import { evidenceText } from './answerText'

describe('정답 근거 문구', () => {
  it('하나만 고르는 근거', () => {
    expect(evidenceText({ count: 1, required: [[3], [6]] })).toBe('4번 또는 7번')
  })
  it('필수 + 관련 문장 중 하나 더', () => {
    expect(evidenceText({ count: 2, required: [[1]], allowed: [0, 2] })).toBe('2번 + 1·2·3번 중 1개 더')
  })
  it('필수 묶음이 여럿이면 괄호로', () => {
    expect(evidenceText({ count: 2, required: [[2], [3]], allowed: [0, 1] })).toBe('(3번 또는 4번) + 1·2·3·4번 중 1개 더')
  })
})
