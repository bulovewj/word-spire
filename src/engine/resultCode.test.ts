import { describe, expect, it } from 'vitest'
import { decodeResult, encodeResult } from './resultCode'
import type { Stats } from './stats'

const stats: Stats = {
  areas: {
    word: { correct: 7, total: 10, helped: 2 },
    literal: { correct: 3, total: 3, helped: 0 },
    connect: { correct: 2, total: 5, helped: 1 },
    author: { correct: 4, total: 6, helped: 0 },
    summary: { correct: 1, total: 3, helped: 0 },
  },
  sure: { correct: 6, total: 8 },
  unsure: { correct: 2, total: 6 },
}

describe('결과 코드', () => {
  it('만들고 읽으면 같은 이름·집계', async () => {
    const code = await encodeResult({ name: ' 김하늘 ', stats })
    expect(code).toMatch(/^NT1-[A-Za-z0-9_-]+$/)
    expect(await decodeResult(code)).toEqual({ name: '김하늘', stats })
  })
  it('깨진 코드는 null', async () => {
    const code = await encodeResult({ name: '김하늘', stats })
    expect(await decodeResult('')).toBeNull()
    expect(await decodeResult('아무 글')).toBeNull()
    expect(await decodeResult(code.slice(0, -6))).toBeNull()
    expect(await decodeResult('NT1-!!!')).toBeNull()
  })
  it('모양이 맞지 않는 내용(정답 수 > 문항 수)도 null', async () => {
    const bad = { ...stats, sure: { correct: 9, total: 8 } }
    expect(await decodeResult(await encodeResult({ name: 'a', stats: bad }))).toBeNull()
  })
})
