import { useEffect, useRef, useState } from 'react'

const motionQuery = '(prefers-reduced-motion: reduce)'

/** 움직임 줄이기면 영상 자체를 올리지 않는다. 탭을 떠나면 재생을 멈춘다. */
export function useTitleMotion(available: boolean) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [reduced, setReduced] = useState(() => window.matchMedia(motionQuery).matches)
  const [enabled, setEnabled] = useState(true)
  const [failed, setFailed] = useState(false)
  const active = available && !reduced && enabled && !failed

  useEffect(() => {
    const query = window.matchMedia(motionQuery)
    const update = () => setReduced(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !active) return
    const sync = () => {
      if (document.hidden) video.pause()
      else void video.play().catch(() => setEnabled(false))
    }
    sync()
    document.addEventListener('visibilitychange', sync)
    return () => document.removeEventListener('visibilitychange', sync)
  }, [active])

  return {
    videoRef, reduced, failed: failed || !available, active,
    toggle: () => setEnabled((value) => !value),
    onError: () => setFailed(true),
  }
}
