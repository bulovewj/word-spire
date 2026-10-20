import { POLICY } from './policy'

export function cosine(a: ArrayLike<number>, b: ArrayLike<number>): number {
  let dot = 0
  let na = 0
  let nb = 0
  const n = Math.min(a.length, b.length)
  for (let i = 0; i < n; i++) {
    const x = a[i] ?? 0
    const y = b[i] ?? 0
    dot += x * y
    na += x * x
    nb += y * y
  }
  return na === 0 || nb === 0 ? 0 : dot / Math.sqrt(na * nb)
}

/** 비교용으로 공백·문장부호를 뺀다 */
export function normalizeText(s: string): string {
  return s.replace(/[\s.,!?·…~'"“”‘’()[\]{}:;-]/g, '')
}

function ngrams(s: string, n: number): Map<string, number> {
  const m = new Map<string, number>()
  for (let i = 0; i + n <= s.length; i++) {
    const g = s.slice(i, i + n)
    m.set(g, (m.get(g) ?? 0) + 1)
  }
  return m
}

function mapCosine(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0
  for (const [k, v] of a) dot += v * (b.get(k) ?? 0)
  const norm = (m: Map<string, number>) => Math.sqrt([...m.values()].reduce((s, v) => s + v * v, 0))
  const d = norm(a) * norm(b)
  return d === 0 ? 0 : dot / d
}

/** 간이 채점용: 글자 1-gram·2-gram 코사인의 가중 평균 */
export function charSimilarity(a: string, b: string): number {
  const x = normalizeText(a)
  const y = normalizeText(b)
  return POLICY.simpleUnigramWeight * mapCosine(ngrams(x, 1), ngrams(y, 1))
    + POLICY.simpleBigramWeight * mapCosine(ngrams(x, 2), ngrams(y, 2))
}
