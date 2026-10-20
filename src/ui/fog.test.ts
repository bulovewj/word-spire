import { describe, expect, it } from 'vitest'
import { bee1 } from '../content/passages/bee-1'
import { maskFog } from './fog'

describe('안개 가리기', () => {
  it('질문 문구 속 가린 낱말도 가린다', () => {
    const q2 = bee1.questions[1]!
    expect(maskFog(q2.prompt, ['위협'])).toBe('꿀벌이 줄면 왜 사람의 밥상이 ▒▒받을까?')
  })
  it('안개가 없으면 그대로', () => {
    expect(maskFog('밥상이 위협받는다', [])).toBe('밥상이 위협받는다')
  })
})
