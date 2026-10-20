// 시드 난수 (mulberry32). 상태는 숫자 하나라 GameState에 그대로 저장한다.

/** [0, 1) 값과 다음 시드를 돌려준다 */
export function nextRandom(seed: number): [number, number] {
  const next = (seed + 0x6d2b79f5) >>> 0
  let t = next
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, next]
}

/** Fisher–Yates. 원본은 건드리지 않는다 */
export function shuffle<T>(items: readonly T[], seed: number): [T[], number] {
  const out = [...items]
  let s = seed
  for (let i = out.length - 1; i > 0; i--) {
    const [r, ns] = nextRandom(s)
    s = ns
    const j = Math.floor(r * (i + 1))
    const a = out[i] as T
    out[i] = out[j] as T
    out[j] = a
  }
  return [out, s]
}
