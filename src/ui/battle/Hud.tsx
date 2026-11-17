import type { BoonId } from '../../engine/boons'
import { BOON_INFO } from '../boonInfo'
import GradingBadge from '../components/GradingBadge'
import { Icon } from '../components/Sprite'
import './hud.css'

interface Props {
  tower: string
  floor: number
  floors: number
  boons: BoonId[]
  sound: boolean
  onSound: () => void
  onHelp: () => void
  onExit: () => void
}

/** 전투 화면 맨 위 줄: 나가기 · 어느 탑 몇 층 · 가진 보물 · 채점 배지 · 도움말 · 소리 */
export default function Hud({ tower, floor, floors, boons, sound, onSound, onHelp, onExit }: Props) {
  return (
    <header className="hud">
      <button type="button" className="hud-btn" onClick={onExit} title="진행은 저장돼. 이어하기로 돌아올 수 있어">나가기</button>
      <div className="hud-where">
        <strong>{tower} 탑</strong>
        <ol className="hud-floors" aria-label={`${floors}층 중 ${floor}층`}>
          {Array.from({ length: floors }, (_, i) => (
            <li key={i} className={i + 1 < floor ? 'is-done' : i + 1 === floor ? 'is-now' : ''}>{i + 1}</li>
          ))}
        </ol>
      </div>
      {boons.length > 0 && (
        <ul className="hud-boons" aria-label="가진 보물">
          {boons.map((id) => (
            <li key={id} title={`${BOON_INFO[id].name}: ${BOON_INFO[id].desc}`}>
              <Icon name={BOON_INFO[id].icon} /><span>{BOON_INFO[id].name}</span>
            </li>
          ))}
        </ul>
      )}
      <span className="hud-gap" />
      <GradingBadge compact />
      <button type="button" className="hud-btn" onClick={onHelp}>도움말</button>
      <button type="button" className="hud-btn" aria-pressed={sound} onClick={onSound}>소리 {sound ? '켬' : '끔'}</button>
    </header>
  )
}
