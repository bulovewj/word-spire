const MASK = '○○○'

/**
 * 예문에서 낱말 자리를 가린다. 활용형("발이 넓다" → "발이 넓어서")도 잡으려고
 * 낱말 끝을 한 글자씩 줄여 가며 찾는다(최대 3글자, 최소 2글자 남김).
 */
export function maskExample(example: string, word: string): string {
  for (let cut = 0; cut <= 3; cut++) {
    const stem = word.slice(0, word.length - cut)
    if (stem.trim().length < 2) break
    if (example.includes(stem)) return example.split(stem).join(MASK)
  }
  return example
}
