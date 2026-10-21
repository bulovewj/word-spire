import { describe, expect, it } from 'vitest'
import { buildClassTable } from './classTable'
import { encodeResult } from './resultCode'
import type { Stats } from './stats'

const stats = (word: number, connect: number): Stats => ({
  areas: {
    word: { correct: word, total: 5, helped: 0 },
    literal: { correct: 2, total: 2, helped: 0 },
    connect: { correct: connect, total: 5, helped: 1 },
    author: { correct: 0, total: 0, helped: 0 },
    summary: { correct: 1, total: 2, helped: 0 },
  },
  sure: { correct: 4, total: 5 },
  unsure: { correct: 2, total: 5 },
})

describe('학급 표', () => {
  it('결과 코드 3개 → 3행, 빈 줄은 건너뛰고 깨진 줄은 줄 번호와 함께 따로', async () => {
    const a = await encodeResult({ name: '가온', stats: stats(4, 1) })
    const b = await encodeResult({ name: '나래', stats: stats(2, 5) })
    const c = await encodeResult({ name: '다솜', stats: stats(5, 5) })
    const t = await buildClassTable(`${a}\n\n${b}\n깨진코드\r\n${c}\n`)
    expect(t.rows.map((r) => [r.line, r.name])).toEqual([[1, '가온'], [3, '나래'], [5, '다솜']])
    expect(t.broken).toEqual([{ line: 4, code: '깨진코드' }])
    expect(t.rows.map((r) => r.weak)).toEqual(['connect', 'word', 'word'])
    expect(t.rows[0]?.judge).toBeCloseTo(0.4)
    expect(t.total.areas.word).toEqual({ correct: 11, total: 15, helped: 0 })
    expect(t.total.sure).toEqual({ correct: 12, total: 15 })
  })
  it('빈 입력이면 빈 표', async () => {
    expect(await buildClassTable('  \n')).toMatchObject({ rows: [], broken: [] })
  })
})
