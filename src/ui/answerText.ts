import type { Evidence } from '../content/types'

const no = (ids: number[]) => ids.map((i) => i + 1).sort((a, b) => a - b).join('·') + '번'

/** 정답 근거를 화면 문장 번호(1부터)로. 예: "2번 + 1·3번 중 1개", "4번 또는 7번" */
export function evidenceText(ev: Evidence): string {
  const must = ev.required.map(no).join(' 또는 ')
  const shortest = Math.min(...ev.required.map((s) => s.length))
  const extra = ev.count - shortest
  if (extra <= 0) return must
  const pool = [...new Set([...ev.required.flat(), ...(ev.allowed ?? [])])]
  return `${ev.required.length > 1 ? `(${must})` : must} + ${no(pool)} 중 ${extra}개 더`
}
