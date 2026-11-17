import { Icon } from './Sprite'
import './Stars.css'

interface Props {
  count: number             // 얻은 별
  max?: number
  scale?: number            // 아이콘 정수 배율
  pop?: boolean             // 하나씩 튀어나오는 연출
}

/** 별 줄. 얻은 별은 금빛, 못 얻은 별은 흐리게 */
export default function Stars({ count, max = 3, scale = 2, pop = false }: Props) {
  return (
    <span className={`stars${pop ? ' is-pop' : ''}`} role="img" aria-label={`별 ${max}개 중 ${count}개`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={`star${i < count ? ' is-on' : ''}`} style={{ animationDelay: `${300 + i * 260}ms` }}>
          <Icon name="hit" scale={scale} />
        </span>
      ))}
    </span>
  )
}
