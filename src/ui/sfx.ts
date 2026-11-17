// 효과음. 소리 파일 없이 WebAudio로 그 자리에서 만든다(8비트풍 삑삑 소리).
// 교실에서 쓰는 게임이라 처음엔 꺼져 있고, 학생이 켠다(설정은 기기에만 저장)
import type { BattleEvent } from '../engine/state'

export type Sfx = 'tap' | 'hit' | 'crit' | 'weak' | 'miss' | 'block' | 'hurt' | 'fog' | 'spark' | 'seal' | 'lose' | 'open'

/** 한 음: f 시작 높이(Hz) → to 끝 높이, at 시작 시각(초), dur 길이(초) */
interface Note { f: number; to?: number; at: number; dur: number; wave?: OscillatorType; vol?: number }

const SOUNDS: Record<Sfx, Note[]> = {
  tap: [{ f: 620, at: 0, dur: 0.04, vol: 0.5 }],
  open: [{ f: 440, to: 660, at: 0, dur: 0.07, wave: 'triangle' }],
  hit: [{ f: 440, to: 880, at: 0, dur: 0.08 }, { f: 660, at: 0.07, dur: 0.08 }],
  crit: [{ f: 523, at: 0, dur: 0.06 }, { f: 659, at: 0.06, dur: 0.06 }, { f: 784, at: 0.12, dur: 0.06 }, { f: 1047, at: 0.18, dur: 0.14 }],
  weak: [{ f: 330, to: 300, at: 0, dur: 0.12, wave: 'triangle' }],
  miss: [{ f: 220, to: 120, at: 0, dur: 0.2, wave: 'triangle' }],
  block: [{ f: 880, at: 0, dur: 0.03 }, { f: 1320, at: 0.04, dur: 0.08, wave: 'triangle' }],
  hurt: [{ f: 180, to: 70, at: 0, dur: 0.18, wave: 'sawtooth', vol: 0.8 }],
  fog: [{ f: 400, to: 950, at: 0, dur: 0.24, wave: 'triangle' }],
  spark: [{ f: 988, at: 0, dur: 0.05 }, { f: 1319, at: 0.05, dur: 0.1 }],
  seal: [{ f: 392, at: 0, dur: 0.09 }, { f: 523, at: 0.09, dur: 0.09 }, { f: 659, at: 0.18, dur: 0.09 }, { f: 784, at: 0.27, dur: 0.09 }, { f: 1047, at: 0.36, dur: 0.3 }],
  lose: [{ f: 392, at: 0, dur: 0.14, wave: 'triangle' }, { f: 330, at: 0.14, dur: 0.14, wave: 'triangle' }, { f: 262, at: 0.28, dur: 0.14, wave: 'triangle' }, { f: 196, at: 0.42, dur: 0.3, wave: 'triangle' }],
}

const MASTER = 0.1
let ctx: AudioContext | null = null
let enabled = false

function audio(): AudioContext | null {
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null   // 소리를 못 내는 기기: 조용히 넘어간다
  }
}

/** 소리 켜기·끄기. 켜는 순간(단추를 누른 때) 오디오를 깨운다 */
export function setSound(on: boolean): void {
  enabled = on
  if (on) audio()
}

export function play(name: Sfx): void {
  if (!enabled) return
  const c = audio()
  if (!c) return
  for (const n of SOUNDS[name]) {
    const osc = c.createOscillator()
    const gain = c.createGain()
    const t0 = c.currentTime + n.at
    osc.type = n.wave ?? 'square'
    osc.frequency.setValueAtTime(n.f, t0)
    if (n.to) osc.frequency.exponentialRampToValueAtTime(n.to, t0 + n.dur)
    gain.gain.setValueAtTime(MASTER * (n.vol ?? 1), t0)
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + n.dur)
    osc.connect(gain).connect(c.destination)
    osc.start(t0)
    osc.stop(t0 + n.dur + 0.02)
  }
}

const CRIT_DAMAGE = 12   // battleFx의 '강타' 기준과 같다 (연출만)

/** 방금 일어난 일에 맞는 소리 하나 (여러 일이면 가장 중요한 것) */
export function soundFor(events: BattleEvent[], outcome: 'playing' | 'won' | 'lost'): Sfx | null {
  if (outcome === 'won') return 'seal'
  if (outcome === 'lost') return 'lose'
  let out: Sfx | null = null
  for (const e of events) {
    if (e.kind === 'question' || e.kind === 'rumor') out = e.grade === 'miss' ? 'miss' : e.grade === 'weak' ? 'weak' : e.damage >= CRIT_DAMAGE ? 'crit' : 'hit'
    else if (e.kind === 'word') out = e.pass ? 'block' : 'miss'
    else if (e.kind === 'enemy') out = e.damage > 0 ? 'hurt' : 'block'
    else if (e.kind === 'fog') out = e.pass ? 'fog' : 'miss'
    else if (e.kind === 'summary' && !e.pass) out = 'miss'
    else if (e.kind === 'spark' && out === null) out = 'spark'
  }
  return out
}
