/**
 * 글에서 낱말이 쓰인 꼴을 찾는다. 활용형("발이 넓다" → "발이 넓어서")도 잡으려고
 * 낱말 끝을 한 글자씩 줄여 가며 찾는다(최대 3글자, 최소 2글자 남김). 없으면 null.
 */
export function findStem(text: string, word: string): string | null {
  for (let cut = 0; cut <= 3; cut++) {
    const stem = word.slice(0, word.length - cut)
    if (stem.trim().length < 2) break
    if (text.includes(stem)) return stem
  }
  return null
}
