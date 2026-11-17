import { useEmbedderStatus } from '../useEmbedderStatus'
import './GradingBadge.css'

/** 화면 위 채점 배지: 의미 채점 준비 n% / 간이 채점 / 의미 채점. compact는 좁은 줄(전투 화면)용 짧은 글 */
export default function GradingBadge({ compact = false }: { compact?: boolean }) {
  const s = useEmbedderStatus()
  const loading = compact ? `채점 준비 ${s.progress}%` : `의미 채점 준비 ${s.progress}% · 지금은 간이 채점`
  const text = s.state === 'ready' ? '의미 채점' : s.state === 'failed' ? '간이 채점' : loading
  const title = s.state === 'ready' ? '쓴 글의 뜻을 살펴 채점해'
    : s.state === 'failed' ? '뜻 채점 도구를 불러오지 못해, 글자를 견주는 간이 채점을 써'
      : '뜻 채점 도구를 불러오는 중이야. 그동안은 글자를 견주는 간이 채점을 써'
  return (
    <span className={`badge badge-${s.state}`} role="status" aria-live="polite" title={title}>
      {text}
    </span>
  )
}
