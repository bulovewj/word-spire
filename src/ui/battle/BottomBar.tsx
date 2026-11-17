import { Icon } from '../components/Sprite'
import './bar.css'

interface Props {
  think: number
  maxThink: number
  turn: number
  attack: number              // 요괴의 다음 공격
  shield: number              // 방어 + 돌문진: 이번 공격에서 막는 양
  incoming: number            // 그래서 실제로 받을 피해
  nudge: boolean              // 더 낼 카드가 없다: 턴 끝내기를 반짝여 알린다
  onEnd: () => void
}

/** 화면 아래 막대: 생각력, 턴을 끝내면 벌어질 일, 턴 끝내기 */
export default function BottomBar({ think, maxThink, turn, attack, shield, incoming, nudge, onEnd }: Props) {
  const gems = Math.max(think, maxThink)
  return (
    <footer className="bar">
      <div className="think" aria-label={`생각력 ${think}`}>
        {Array.from({ length: gems }, (_, i) => (
          <span key={i} className={`gem${i < think ? ' is-on' : ''}${i >= maxThink ? ' is-bonus' : ''}`}><Icon name="think" scale={2} /></span>
        ))}
        <span className="think-text">생각력 {think}</span>
      </div>
      <p className="forecast" data-coach="forecast">
        <span className="forecast-turn">{turn}턴</span>
        <span className="forecast-long">턴을 끝내면 요괴가 <strong>{attack}</strong> 공격{shield > 0 && <> · 방어 {shield}</>} → </span>
        <strong className={incoming > 0 ? 'is-hurt' : 'is-safe'}>{incoming > 0 ? `${incoming} 받아` : '다 막아!'}</strong>
      </p>
      <button type="button" className={`btn btn-ink end-turn${nudge ? ' is-nudge' : ''}`} data-coach="end" onClick={onEnd}>턴 끝내기</button>
    </footer>
  )
}
