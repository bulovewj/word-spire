import { useEmbedderStatus } from '../useEmbedderStatus'
import './GradingBadge.css'

/** 화면 위 채점 배지: 의미 채점 준비 n% / 간이 채점 / 의미 채점 */
export default function GradingBadge() {
  const s = useEmbedderStatus()
  const text =
    s.state === 'ready' ? '의미 채점'
      : s.state === 'failed' ? '간이 채점'
        : `의미 채점 준비 ${s.progress}% · 지금은 간이 채점`
  return (
    <span className={`badge badge-${s.state}`} role="status" aria-live="polite">
      {text}
    </span>
  )
}
