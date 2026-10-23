import { describe, expect, it } from 'vitest'
import { motionOf, nextDelay, pickAccent, type Accent } from './motion'

const sched = { minMs: 3000, maxMs: 7000, jitter: 0.2, noRepeat: true }
const acc = (name: string, weight: number): Accent => ({ name, frames: [name + '1', 'idle'], ms: 200, weight })

describe('대기 움직임', () => {
  it('간격은 3~7초 안에서 흔들린다', () => {
    expect(nextDelay(sched, 0, 0.5)).toBe(3000)
    expect(nextDelay(sched, 1, 0.5)).toBe(7000)
    expect(nextDelay(sched, 0.5, 1)).toBe(6000)      // 5000 × 1.2
    expect(nextDelay(sched, 0.5, 0)).toBe(4000)      // 5000 × 0.8
    expect(nextDelay(sched, 1, 1)).toBe(7000)        // 넘치면 7초에서 자름
  })
  it('같은 동작을 연달아 고르지 않고, 무게대로 고른다', () => {
    const list = [acc('blink', 4), acc('tilt', 2), acc('settle', 1)]
    expect(pickAccent(list, null, true, 0)?.name).toBe('blink')
    expect(pickAccent(list, null, true, 0.99)?.name).toBe('settle')
    for (const r of [0, 0.3, 0.6, 0.99]) expect(pickAccent(list, 'blink', true, r)?.name).not.toBe('blink')
    expect(pickAccent([acc('blink', 1)], 'blink', true, 0.5)?.name).toBe('blink')
  })
  it('실제 frames.json: 네 캐릭터 모두 숨쉬기·몸 동작이 있고, 동작 프레임이 시트에 있다', async () => {
    const { default: data } = await import('./sprites/frames.json')
    for (const name of ['reader', 'dokkaebi', 'tiger', 'fox']) {
      const m = motionOf(name)!
      expect(m.breath?.periodMs, name).toBeGreaterThan(0)
      const labels = (data as Record<string, { labels: string[] }>)[name]!.labels
      for (const a of m.accents) for (const f of a.frames) expect(labels, `${name}.${a.name}`).toContain(f)
    }
    expect(motionOf('seal')).toBeNull()
  })
})
