import { useLayoutEffect, useState, type CSSProperties } from 'react'
import { Icon } from '../components/Sprite'
import './coach.css'

/** 길잡이 한 장: target은 화면에서 비출 곳(data-coach 이름) */
export interface CoachStep { target: string; title: string; text: string }

/** 처음 층에 들어섰을 때: 글부터 읽기 */
export const READ_TIPS: CoachStep[] = [
  { target: 'book', title: '요괴가 가린 글이야', text: '이 글을 읽고 답해야 요괴를 물리칠 수 있어. 먼저 천천히 읽어 봐. 전투 중에도 언제든 다시 읽을 수 있어.' },
]

/** 전투를 시작할 때: 화면 보는 법 네 가지 */
export const PLAY_TIPS: CoachStep[] = [
  { target: 'stage', title: '요괴의 다음 공격을 봐', text: '요괴 이름 옆 숫자가 다음 공격이야. 턴을 끝내면 그만큼 공격해 와. 내 체력바의 줄무늬가 깎일 만큼이야.' },
  { target: 'desk', title: '카드를 내서 싸워', text: '질문 카드는 공격, 낱말 방어는 막기, 안개 걷기는 요괴의 보호막 깨기야. 카드 왼쪽 위 마패 수만큼 생각력이 들어.' },
  { target: 'desk', title: '질문은 답 → 근거 → 확신', text: '답을 고르고, 그 근거가 되는 문장을 글에서 찾아. 근거까지 맞으면 정타! 답만 맞으면 약타야.' },
  { target: 'end', title: '생각력을 다 쓰면 턴 끝내기', text: '한 턴에 생각력은 3. 요괴가 약해지면 ‘요약 봉인’ 카드가 나타나. 글을 한 문장으로 요약하면 봉인 성공!' },
]

const CARD_W = 340
const GAP = 12

/** 비출 곳 아래(자리가 없으면 위, 그래도 없으면 화면 가운데)에 길잡이 글을 둔다 */
function cardStyle(rect: DOMRect | null): CSSProperties {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const width = Math.min(CARD_W, vw - 16)
  if (!rect) return { width, left: (vw - width) / 2, top: vh / 2 - 90 }
  const left = Math.max(8, Math.min(vw - width - 8, rect.left + rect.width / 2 - width / 2))
  if (vh - rect.bottom >= 210) return { width, left, top: rect.bottom + GAP }
  if (rect.top >= 210) return { width, left, bottom: vh - rect.top + GAP }
  return { width, left, top: Math.max(8, Math.min(vh - 220, rect.top + rect.height / 2 - 90)) }
}

interface Props { steps: CoachStep[]; onDone: () => void }

/** 길잡이 마패: 화면의 한 곳을 비추고 한 가지씩 알려 준다. 언제든 그만 볼 수 있다 */
export default function Coach({ steps, onDone }: Props) {
  const [at, setAt] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const step = steps[at]
  const target = step?.target

  useLayoutEffect(() => {
    if (!target) return
    const measure = () => setRect(document.querySelector(`[data-coach="${target}"]`)?.getBoundingClientRect() ?? null)
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [target, at])

  if (!step) return null
  const last = at >= steps.length - 1
  return (
    <div className="coach" role="dialog" aria-modal="true" aria-label="길잡이">
      {rect && <div className="coach-spot" style={{ left: rect.left - 4, top: rect.top - 4, width: rect.width + 8, height: rect.height + 8 }} />}
      <div className="coach-card" style={cardStyle(rect)}>
        <span className="coach-who"><Icon name="think" scale={2} />길잡이 마패{steps.length > 1 && ` · ${at + 1} / ${steps.length}`}</span>
        <strong className="coach-title">{step.title}</strong>
        <p>{step.text}</p>
        <div className="coach-actions">
          {!last && <button type="button" className="btn btn-quiet" onClick={onDone}>그만 보기</button>}
          <button type="button" className="btn btn-gold" autoFocus onClick={() => (last ? onDone() : setAt(at + 1))}>{last ? '알겠어!' : '다음'}</button>
        </div>
      </div>
    </div>
  )
}
