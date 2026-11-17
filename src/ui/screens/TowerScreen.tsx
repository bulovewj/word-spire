import { findWord } from '../../content'
import type { Passage, Tower } from '../../content/types'
import { starsOf, type Profile } from '../../engine/profile'
import Page from '../components/Page'
import Sprite from '../components/Sprite'
import Stars from '../components/Stars'
import { isSheetName } from '../sprites/sprites'
import './tower.css'

interface Props {
  tower: Tower
  floors: Passage[]           // 층 순서대로
  profile: Profile
  deck: string[]              // 이 탑을 시작하는 내 낱말 묶음
  onStart: () => void
  onBack: () => void
}

/** 탑의 층들: 맨 위가 우두머리. 아직 봉인해 본 적 없는 요괴는 그림자로만 보인다 */
export function Spire({ floors, profile, current }: { floors: Passage[]; profile: Profile; current: number }) {
  return (
    <ol className="spire" aria-label="탑의 층">
      {[...floors].reverse().map((p) => {
        const known = p.floor <= current || (profile.sealed[p.enemy.sprite] ?? 0) > 0
        const stars = profile.stars[p.id] ?? 0
        return (
          <li key={p.id} className={`spire-floor${p.floor === current ? ' is-now' : ''}${p.floor < current ? ' is-done' : ''}`}>
            <span className="spire-no">{p.floor}층</span>
            <span className={`spire-art${known ? '' : ' is-unknown'}`}>
              {isSheetName(p.enemy.sprite) && <Sprite name={p.enemy.sprite} scale={0.5} />}
            </span>
            <span className="spire-name">{known ? p.enemy.name : '???'}{p.rumor && <em> 우두머리</em>}</span>
            <Stars count={stars} />
          </li>
        )
      })}
    </ol>
  )
}

/** 탑에 들어설 때: 이야기 두 줄, 층마다 기다리는 요괴, 내 낱말 묶음 */
export default function TowerScreen({ tower, floors, profile, deck, onStart, onBack }: Props) {
  const ids = floors.map((p) => p.id)
  return (
    <Page title={`${tower.title} 탑`} kicker="닫힌궁" onBack={onBack} backLabel="닫힌궁으로" wide
      aside={<span className="tower-total"><Stars count={starsOf(profile, ids) > 0 ? 1 : 0} max={1} /> {starsOf(profile, ids)} / {ids.length * 3}</span>}>
      <div className="tower-layout">
        <section className="sheet tower-story">
          <p className="tower-blurb">{tower.blurb}</p>
          {tower.intro.map((line) => <p key={line} className="story-line">{line}</p>)}
          <div className="tower-deck">
            <h3>내 낱말 묶음</h3>
            <ul>{deck.map((id) => <li key={id}>{findWord(id)?.word ?? id}</li>)}</ul>
            <p className="muted">요괴가 공격할 때 이 낱말들의 뜻으로 막을 수 있어.</p>
          </div>
          <div className="page-actions">
            <button type="button" className="btn btn-gold" autoFocus onClick={onStart}>1층 도전!</button>
          </div>
        </section>
        <section className="tower-side" aria-label="이 탑의 요괴들">
          <Spire floors={floors} profile={profile} current={1} />
        </section>
      </div>
    </Page>
  )
}
