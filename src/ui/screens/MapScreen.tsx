import { towerFloors } from '../../content'
import type { Tower } from '../../content/types'
import { starsOf, type Profile } from '../../engine/profile'
import type { RunState } from '../../engine/run'
import Page from '../components/Page'
import Sprite from '../components/Sprite'
import Stars from '../components/Stars'
import { isSheetName } from '../sprites/sprites'
import './complete.css'   // 왕명 인장 모양
import './map.css'

interface Props {
  towers: Tower[]
  profile: Profile
  run: RunState | null        // 오르던 탑 (다 오른 진행은 null로 준다)
  onContinue: () => void
  onStart: (towerId: string) => void
  onBook: () => void
  onBack: () => void
}

/** 닫힌궁: 탑을 고른다. 탑마다 모은 별과 왕명 인장을 보여 준다 */
export default function MapScreen({ towers, profile, run, onContinue, onStart, onBook, onBack }: Props) {
  const all = towers.flatMap((t) => towerFloors(t.id).map((p) => p.id))
  return (
    <Page title="닫힌궁" kicker="어느 탑의 글을 되찾을까?" onBack={onBack} backLabel="처음으로" wide
      aside={<><span className="map-total"><Stars count={1} max={1} /> {starsOf(profile, all)} / {all.length * 3}</span>
        <button type="button" className="btn" onClick={onBook}>부적첩</button></>}>
      <ul className="map-towers">
        {towers.map((t) => {
          const floors = towerFloors(t.id)
          const ids = floors.map((p) => p.id)
          const mine = run?.towerId === t.id ? run : null
          const sealed = profile.seals.includes(t.id)
          return (
            <li key={t.id} className={`map-tower${sealed ? ' is-sealed' : ''}`}>
              <div className="map-roof" aria-hidden="true" />
              <div className="map-body">
                <div className="map-head">
                  <h2>{t.title} 탑</h2>
                  {sealed && <span className="royal-seal is-small" role="img" aria-label="왕명 인장을 받은 탑"><span>{t.title}</span></span>}
                </div>
                <p className="map-blurb">{t.blurb}</p>
                <div className="map-yokai" aria-hidden="true">
                  {floors.map((p) => (
                    <span key={p.id} className={(profile.sealed[p.enemy.sprite] ?? 0) > 0 || p.floor === 1 ? '' : 'is-unknown'}>
                      {isSheetName(p.enemy.sprite) && <Sprite name={p.enemy.sprite} scale={0.5} />}
                    </span>
                  ))}
                </div>
                <p className="map-stars"><Stars count={Math.min(3, Math.floor(starsOf(profile, ids) / floors.length))} /> 별 {starsOf(profile, ids)} / {ids.length * 3}</p>
                <div className="map-actions">
                  {mine ? (
                    <>
                      <button type="button" className="btn btn-gold" onClick={onContinue}>이어하기 · {mine.floor}층</button>
                      <button type="button" className="btn btn-quiet" onClick={() => onStart(t.id)}>처음부터</button>
                    </>
                  ) : (
                    <button type="button" className="btn btn-gold" onClick={() => onStart(t.id)}>{sealed ? '다시 오르기' : '오르기'}</button>
                  )}
                </div>
                {run && !mine && <p className="muted">이 탑을 시작하면 오르던 탑의 진행은 지워져.</p>}
              </div>
            </li>
          )
        })}
      </ul>
    </Page>
  )
}
