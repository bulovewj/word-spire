// 교사 화면 학급 표 (기획안 9장 · 작업지시서 F9). 결과 코드 여러 줄 → 학생별 행
import { decodeResult } from './resultCode'
import { AREAS, judgement, weakest, type Stats } from './stats'
import type { Area } from './records'

export interface StudentRow { line: number; name: string; stats: Stats; judge: number | null; weak: Area | null }
export interface BrokenRow { line: number; code: string }

export interface ClassTable {
  rows: StudentRow[]
  broken: BrokenRow[]
  total: Stats              // 학급 전체 합계 (정답률 평균은 이걸로)
}

const emptyStats = (): Stats => ({
  areas: Object.fromEntries(AREAS.map((a) => [a, { correct: 0, total: 0, helped: 0 }])) as Stats['areas'],
  sure: { correct: 0, total: 0 },
  unsure: { correct: 0, total: 0 },
})

/** 빈 줄은 건너뛰고, 읽을 수 없는 줄은 broken에 줄 번호(1부터)와 함께 */
export async function buildClassTable(text: string): Promise<ClassTable> {
  const lines = text.split(/\r?\n/).map((s, i) => ({ code: s.trim(), line: i + 1 })).filter((l) => l.code !== '')
  const decoded = await Promise.all(lines.map((l) => decodeResult(l.code)))
  const rows: StudentRow[] = []
  const broken: BrokenRow[] = []
  const total = emptyStats()
  lines.forEach((l, i) => {
    const card = decoded[i]
    if (!card) { broken.push(l); return }
    rows.push({ line: l.line, name: card.name, stats: card.stats, judge: judgement(card.stats), weak: weakest(card.stats) })
    for (const a of AREAS) {
      const t = total.areas[a]
      const s = card.stats.areas[a]
      t.correct += s.correct; t.total += s.total; t.helped += s.helped
    }
    total.sure.correct += card.stats.sure.correct; total.sure.total += card.stats.sure.total
    total.unsure.correct += card.stats.unsure.correct; total.unsure.total += card.stats.unsure.total
  })
  return { rows, broken, total }
}
