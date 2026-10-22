import type { CSSProperties } from 'react'
import { sheet, type IconName, type KindName, type SheetName } from '../sprites/sprites'
import './Sprite.css'

interface Props {
  name: SheetName
  frame?: string            // labels 이름 (없으면 첫 칸)
  scale?: number            // 정수 배율
  cycle?: { count: number; ms: number; once?: boolean }   // frame부터 count칸을 차례로 (움직임 줄이기면 멈춤)
  label?: string            // 있으면 그림 뜻을 읽어 줌, 없으면 장식
  className?: string
}

/** 시트의 한 칸을 정수 배율로. 움직임 줄이기에서는 once면 마지막 칸, 아니면 첫 칸에 멈춘다 */
export default function Sprite({ name, frame, scale = 1, cycle, label, className = '' }: Props) {
  const s = sheet(name)
  const start = Math.max(0, frame ? s.labels.indexOf(frame) : 0)
  const w = s.width * scale
  const style = {
    width: w, height: s.height * scale,
    backgroundImage: `url(${s.url})`,
    backgroundSize: `${s.width * s.count * scale}px ${s.height * scale}px`,
    backgroundPosition: `${-start * w}px 0`,
    '--from': `${-start * w}px`,
    '--to': cycle ? `${-(start + (cycle.once ? cycle.count - 1 : cycle.count)) * w}px` : undefined,
    '--steps': cycle ? (cycle.once ? cycle.count - 1 : cycle.count) : undefined,
    '--ms': cycle ? `${cycle.ms}ms` : undefined,
  } as CSSProperties
  const cls = `sprite${cycle ? (cycle.once ? ' sprite-once' : ' sprite-loop') : ''} ${className}`
  return label
    ? <span className={cls} style={style} role="img" aria-label={label} />
    : <span className={cls} style={style} aria-hidden="true" />
}

export function Icon({ name, scale = 1, label }: { name: IconName; scale?: number; label?: string }) {
  return <Sprite name="icons" frame={name} scale={scale} label={label} className="icon" />
}

export function KindIcon({ kind }: { kind: KindName }) {
  return <Sprite name="card-kinds" frame={kind} className="kind-icon" />
}
