import { describe, expect, it } from 'vitest'
import { BALANCE } from './balance'
import { BOON_IDS, makeOffers } from './boons'

describe('층 보상 고르기', () => {
  const pool = ['a', 'b', 'c']

  it('아직 없는 보물 2개 + 내 묶음에 없는 낱말 1장', () => {
    const [offers] = makeOffers(['knot'], ['a'], pool, 7)
    expect(offers).toHaveLength(BALANCE.rewardBoons + 1)
    const boons = offers.filter((o) => o.kind === 'boon').map((o) => o.id)
    expect(boons).not.toContain('knot')
    expect(new Set(boons).size).toBe(BALANCE.rewardBoons)
    const word = offers.find((o) => o.kind === 'word')
    expect(['b', 'c']).toContain(word?.id)
  })
  it('같은 시드면 같은 보상, 다음 시드를 돌려준다', () => {
    const a = makeOffers([], [], pool, 11)
    expect(makeOffers([], [], pool, 11)).toEqual(a)
    expect(a[1]).not.toBe(11)
  })
  it('남은 낱말이 없으면 보물만, 보물을 다 가졌으면 낱말만', () => {
    expect(makeOffers([], pool, pool, 3)[0].every((o) => o.kind === 'boon')).toBe(true)
    expect(makeOffers([...BOON_IDS], [], pool, 3)[0]).toEqual([expect.objectContaining({ kind: 'word' })])
  })
})
