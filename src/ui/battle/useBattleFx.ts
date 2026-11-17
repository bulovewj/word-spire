import { useEffect, useRef, useState } from 'react'
import type { GameState } from '../../engine/state'
import { battleFx, type BattleFx, type FloatText } from './battleFx'

const FLOAT_MS = 1400
const LINE_MS = 2800
const SHAKE_MS = 360

export interface KeyedFloat extends FloatText { id: number }

export interface LiveFx extends Omit<BattleFx, 'floats'> { floats: KeyedFloat[] }

const QUIET: LiveFx = { floats: [], shake: false }

/** 상태가 바뀔 때마다 연출을 새로 틀고, 시간이 지나면 스스로 거둔다 */
export function useBattleFx(state: GameState): LiveFx {
  const [fx, setFx] = useState<LiveFx>(QUIET)
  const serial = useRef(0)

  useEffect(() => {
    const next = battleFx(state)
    const floats = next.floats.map((f) => ({ ...f, id: ++serial.current }))
    setFx({ ...next, floats })
    if (floats.length === 0 && !next.line && !next.shake) return
    const timers = [
      window.setTimeout(() => setFx((f) => ({ ...f, shake: false, flash: undefined })), SHAKE_MS),
      window.setTimeout(() => setFx((f) => ({ ...f, floats: [] })), FLOAT_MS),
      window.setTimeout(() => setFx((f) => ({ ...f, line: undefined })), LINE_MS),
    ]
    return () => timers.forEach((t) => window.clearTimeout(t))
  }, [state])

  return fx
}
