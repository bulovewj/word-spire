import { useEffect, useState, type CSSProperties } from 'react'
import { nextRandom } from '../../engine/rng'
import { motionOf, nextDelay, pickAccent } from '../motion'
import type { SheetName } from '../sprites/sprites'
import { useReducedMotion } from '../useReducedMotion'
import Sprite from './Sprite'

interface Props {
  name: SheetName
  pose: string        // 사건 포즈. 'idle'이면 대기 움직임
}

/**
 * 전투 캐릭터. 규칙 층(숨쉬기 들썩임, CSS)과 불규칙 층(몸 동작, 여기서 일정)을 겹친다.
 * 사건 포즈가 있으면 그것이 먼저이고 그동안 몸 동작은 쉰다. 움직임 줄이기·숨은 탭이면 멈춘다
 */
export default function Actor({ name, pose }: Props) {
  const motion = motionOf(name)
  const reduced = useReducedMotion()
  const [accentFrame, setAccentFrame] = useState<string | null>(null)
  const quiet = pose !== 'idle' || reduced || !motion?.schedule || motion.accents.length === 0

  useEffect(() => {
    if (quiet || !motion?.schedule) return
    const schedule = motion.schedule
    let seed = (Date.now() ^ name.length * 2654435761) >>> 0   // 캐릭터마다 다른 박자 (화면 장식용 난수, 게임 판정과 무관)
    const rand = () => { const [r, s] = nextRandom(seed); seed = s; return r }
    const timers: number[] = []
    let prev: string | null = null
    const later = (fn: () => void, ms: number) => { timers.push(window.setTimeout(fn, ms)) }
    const queue = () => later(play, nextDelay(schedule, rand(), rand()))
    function play() {
      if (document.hidden) { queue(); return }
      const a = pickAccent(motion!.accents, prev, schedule.noRepeat, rand())
      if (!a) return
      prev = a.name
      const step = a.ms / a.frames.length
      a.frames.forEach((f, i) => later(() => setAccentFrame(f === motion!.idleFrame ? null : f), step * i))
      later(() => { setAccentFrame(null); queue() }, a.ms)
    }
    queue()
    return () => { timers.forEach((t) => window.clearTimeout(t)); setAccentFrame(null) }
  }, [quiet, motion, name])   // motion은 캐릭터마다 고정 객체

  const frame = pose !== 'idle' ? pose : accentFrame ?? motion?.idleFrame ?? 'idle'
  const b = motion?.breath
  const style = b ? ({ '--amp': `${-b.amplitude}px`, '--period': `${b.periodMs}ms`, '--phase': `${-b.phase * b.periodMs}ms` } as CSSProperties) : undefined
  return (
    <span className={b ? 'breath' : undefined} style={style}>
      <Sprite name={name} frame={frame} />
    </span>
  )
}
