import type { ReactNode } from 'react'
import { Icon } from '../components/Sprite'
import Stamp, { type CardKind } from '../components/Stamp'
import './panel.css'

interface Props {
  kind: CardKind
  title: string
  label: string               // 읽어 주는 이름
  think?: number              // 남은 생각력 (패널이 열리면 아래 막대가 가려지므로 여기서 보여 준다)
  tone?: 'pass' | 'fail'
  onCancel?: () => void       // 없으면 닫기 단추가 없다 (결과 화면처럼 되돌릴 수 없을 때)
  children: ReactNode
}

/** 카드를 내면 열리는 패널의 틀: 도장·이름·남은 생각력·닫기 */
export default function PanelFrame({ kind, title, label, think, tone, onCancel, children }: Props) {
  return (
    <section className={`panel panel-${kind}${tone ? ` is-${tone}` : ''}`} aria-label={label}>
      <header className="panel-head">
        <Stamp kind={kind} size="sm" />
        <h3 className="panel-title">{title}</h3>
        {think !== undefined && <span className="panel-think" aria-label={`남은 생각력 ${think}`}><Icon name="think" />{think}</span>}
        {onCancel && <button type="button" className="panel-close" onClick={onCancel}>닫기</button>}
      </header>
      <div className="panel-body">{children}</div>
    </section>
  )
}
