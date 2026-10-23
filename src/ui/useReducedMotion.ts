import { useEffect, useState } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

/** 기기의 "움직임 줄이기" 설정. 바뀌면 바로 따른다 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => window.matchMedia(QUERY).matches)
  useEffect(() => {
    const q = window.matchMedia(QUERY)
    const update = () => setReduced(q.matches)
    q.addEventListener('change', update)
    return () => q.removeEventListener('change', update)
  }, [])
  return reduced
}
