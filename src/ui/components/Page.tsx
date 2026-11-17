import type { ReactNode } from 'react'
import './Page.css'

interface Props {
  title: string
  kicker?: string             // 제목 위 작은 글 (어디에 와 있는지)
  onBack?: () => void
  backLabel?: string
  aside?: ReactNode           // 제목 줄 오른쪽 (별 수, 배지 등)
  wide?: boolean
  children: ReactNode
}

/** 전투 밖 화면의 틀: 단청 띠 · 뒤로 · 제목 · 내용 */
export default function Page({ title, kicker, onBack, backLabel = '뒤로', aside, wide = false, children }: Props) {
  return (
    <div className="page">
      <header className="page-bar">
        {onBack && <button type="button" className="btn btn-quiet page-back" onClick={onBack}>{backLabel}</button>}
        <div className="page-heading">
          {kicker && <span className="page-kicker">{kicker}</span>}
          <h1>{title}</h1>
        </div>
        {aside && <div className="page-aside">{aside}</div>}
      </header>
      <main className={`page-main${wide ? ' is-wide' : ''}`}>{children}</main>
    </div>
  )
}
