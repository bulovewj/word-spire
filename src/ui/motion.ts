// 캐릭터 대기 움직임 (요청6 B4 · frames.json의 idle·accentSchedule·accents).
// 규칙 층 = 숨쉬기 들썩임(CSS), 불규칙 층 = 3~7초 무작위 간격의 짧은 몸 동작(여기서 고르고 훅이 재생).
import frameData from './sprites/frames.json'

export interface Breath { amplitude: number; periodMs: number; phase: number }
export interface Accent { name: string; frames: string[]; ms: number; weight: number }
export interface AccentSchedule { minMs: number; maxMs: number; jitter: number; noRepeat: boolean }
export interface Motion { idleFrame: string; breath?: Breath; schedule?: AccentSchedule; accents: Accent[]; eventPriorityMs: number }

interface Raw {
  idle?: { frame?: string; breath?: Breath }
  accentSchedule?: AccentSchedule
  accents?: Accent[]
  eventPriorityMs?: number
}

const cache = new Map<string, Motion | null>()

/** 같은 캐릭터면 늘 같은 객체 (화면이 다시 그려져도 움직임 일정이 처음부터 다시 시작되지 않게) */
export function motionOf(name: string): Motion | null {
  if (cache.has(name)) return cache.get(name) ?? null
  const raw = (frameData as Record<string, Raw>)[name]
  const m: Motion | null = !raw?.idle ? null : {
    idleFrame: raw.idle.frame ?? 'idle',
    breath: raw.idle.breath,
    schedule: raw.accentSchedule,
    accents: raw.accents ?? [],
    eventPriorityMs: raw.eventPriorityMs ?? 700,
  }
  cache.set(name, m)
  return m
}

/** 다음 몸 동작까지 기다릴 시간: [min, max] 균등 + ±jitter 흔들림, 범위 밖으로는 안 나감 */
export function nextDelay(s: AccentSchedule, r1: number, r2: number): number {
  const base = s.minMs + (s.maxMs - s.minMs) * r1
  const wobble = 1 + (r2 * 2 - 1) * s.jitter
  return Math.round(Math.min(s.maxMs, Math.max(s.minMs, base * wobble)))
}

/** 무게에 따라 하나 고른다. noRepeat면 바로 앞 동작은 빼고 고른다(하나뿐이면 그대로) */
export function pickAccent(accents: Accent[], prev: string | null, noRepeat: boolean, r: number): Accent | null {
  const pool = noRepeat && accents.length > 1 ? accents.filter((a) => a.name !== prev) : accents
  const total = pool.reduce((s, a) => s + a.weight, 0)
  let x = r * total
  for (const a of pool) {
    x -= a.weight
    if (x < 0) return a
  }
  return pool[pool.length - 1] ?? null
}
