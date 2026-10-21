// 스탯 (기획안 8장 · 작업지시서 F8). 기록을 영역별로 모은다. 결과 코드·교사 화면도 이 모양을 쓴다.
import { BALANCE } from './balance'
import type { Area, JudgeRecord } from './records'

export const AREAS: Area[] = ['word', 'literal', 'connect', 'author', 'summary']
/** 약점을 고르는 영역. literal은 뺀다(F8) */
export const WEAK_AREAS: Area[] = ['word', 'connect', 'author', 'summary']

export interface Tally { correct: number; total: number }
export interface AreaStat extends Tally { helped: number }   // helped = 도움받아 해결한 수

export interface Stats {
  areas: Record<Area, AreaStat>
  sure: Tally                // 확실로 낸 질문 (첫 시도, 도움 없이)
  unsure: Tally
}

const tally = (): AreaStat => ({ correct: 0, total: 0, helped: 0 })

export function computeStats(log: JudgeRecord[]): Stats {
  const s: Stats = {
    areas: { word: tally(), literal: tally(), connect: tally(), author: tally(), summary: tally() },
    sure: { correct: 0, total: 0 },
    unsure: { correct: 0, total: 0 },
  }
  for (const r of log) {
    const a = s.areas[r.area]
    if (r.firstTry && !r.helped) {
      a.total++
      if (r.correct) a.correct++
      if (r.confidence) {
        const t = s[r.confidence]
        t.total++
        if (r.correct) t.correct++
      }
    } else if (r.correct) {
      a.helped++
    }
  }
  return s
}

export function rate(t: Tally): number | null {
  return t.total === 0 ? null : t.correct / t.total
}

/** 판단력 = 확실 정답률 − 애매 정답률. 둘 다 표본이 모자라면 null */
export function judgement(s: Stats): number | null {
  const min = BALANCE.statsMinSamples
  if (s.sure.total < min || s.unsure.total < min) return null
  return (s.sure.correct / s.sure.total) - (s.unsure.correct / s.unsure.total)
}

/** 표본이 충분한 영역이 둘 이상일 때, 정답률이 가장 낮은 영역 */
export function weakest(s: Stats): Area | null {
  const ready = WEAK_AREAS.filter((a) => s.areas[a].total >= BALANCE.statsMinSamples)
  if (ready.length < 2) return null
  let low: Area | null = null
  let lowRate = Infinity
  for (const a of ready) {
    const r = s.areas[a].correct / s.areas[a].total
    if (r < lowRate) { low = a; lowRate = r }
  }
  return low
}
