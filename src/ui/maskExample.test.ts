import { describe, expect, it } from 'vitest'
import { pack56 } from '../content/words/pack-5-6'
import { maskExample } from './maskExample'

describe('예문 가리기', () => {
  it('그대로 있는 낱말', () => {
    expect(maskExample('모둠 친구들의 협력으로 작품을 완성했다.', '협력')).toBe('모둠 친구들의 ○○○으로 작품을 완성했다.')
  })
  it('활용형', () => {
    expect(maskExample('삼촌은 발이 넓어서 어디를 가도', '발이 넓다')).toBe('삼촌은 ○○○어서 어디를 가도')
    expect(maskExample('소리가 나서 간이 콩알만 해졌다.', '간이 콩알만 해지다')).toBe('소리가 나서 ○○○졌다.')
  })
  it('팩의 예문은 전부 낱말이 가려진다', () => {
    for (const w of pack56) {
      if (w.example) expect(maskExample(w.example, w.word), w.word).toContain('○○○')
    }
  })
})
