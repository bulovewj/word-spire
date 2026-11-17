import { findWord } from '../../content'
import type { Passage } from '../../content/types'
import { BALANCE } from '../../engine/balance'
import type { RewardOffer } from '../../engine/boons'
import type { RunState } from '../../engine/run'
import { BOON_INFO } from '../boonInfo'
import Page from '../components/Page'
import Sprite, { Icon } from '../components/Sprite'
import Stamp from '../components/Stamp'
import Stars from '../components/Stars'
import { isSheetName } from '../sprites/sprites'
import './reward.css'

interface Props {
  run: RunState               // phase === 'reward'
  tower: string
  next?: Passage              // 다음 층의 글 (요괴 예고)
  onPick: (index: number) => void
  onNext: () => void
}

/** 되찾은 낱말 카드: 낱말과 뜻 */
export function WordCard({ id }: { id: string }) {
  const w = findWord(id)
  return (
    <div className="word-card">
      <span className="word-card-kind">{w?.kind ?? '낱말'}</span>
      <strong className="word-card-word">{w?.word ?? id}</strong>
      <span className="word-card-meaning">{w?.meaning}</span>
    </div>
  )
}

function Offer({ offer, picked, dimmed, onPick }: { offer: RewardOffer; picked: boolean; dimmed: boolean; onPick: () => void }) {
  const word = offer.kind === 'word' ? findWord(offer.id) : undefined
  const boon = offer.kind === 'boon' ? BOON_INFO[offer.id] : undefined
  return (
    <button type="button" className={`offer offer-${offer.kind}${picked ? ' is-picked' : ''}`} disabled={dimmed} aria-pressed={picked} onClick={onPick}>
      <span className="offer-art">{boon ? <Icon name={boon.icon} scale={3} /> : <Stamp kind="word" size="lg" />}</span>
      <span className="offer-kind">{boon ? '보물' : `새 낱말 · ${word?.kind ?? ''}`}</span>
      <strong className="offer-name">{boon ? boon.name : word?.word}</strong>
      <span className="offer-desc">{boon ? boon.desc : `낱말 묶음에 넣기 (방어 ${BALANCE.wordUsesPerTower}번)`}</span>
      {picked && <span className="offer-picked">골랐어!</span>}
    </button>
  )
}

/** 층을 봉인한 뒤: 별, 되찾은 낱말, 보물 하나 고르기, 다음 층 예고 */
export default function RewardScreen({ run, tower, next, onPick, onNext }: Props) {
  const reward = run.reward
  if (!reward) return null
  const sealedFloor = run.floor - 1
  const chosen = reward.picked !== null
  return (
    <Page title={`${sealedFloor}층 봉인!`} kicker={`${tower} 탑`}
      aside={<Stars count={reward.result.stars} scale={2} />}>
      {reward.words.length > 0 && (
        <section className="sheet">
          <h2>되찾은 낱말</h2>
          <p className="muted">안개를 걷어 낸 낱말이 내 낱말 묶음에 들어왔어.</p>
          <div className="word-cards">{reward.words.map((id) => <WordCard key={id} id={id} />)}</div>
        </section>
      )}
      {reward.offers.length > 0 && (
        <section className="sheet">
          <h2>{chosen ? '보물을 챙겼어' : '보물을 하나 골라'}</h2>
          <div className="offers">
            {reward.offers.map((o, i) => (
              <Offer key={`${o.kind}-${o.id}`} offer={o} picked={reward.picked === i} dimmed={chosen && reward.picked !== i} onPick={() => onPick(i)} />
            ))}
          </div>
        </section>
      )}
      <section className="sheet reward-next">
        {next && isSheetName(next.enemy.sprite) && <Sprite name={next.enemy.sprite} scale={0.5} />}
        <div>
          <h3>다음은 {run.floor}층{next ? ` · ${next.enemy.name}` : ''}</h3>
          <p className="muted">체력은 다시 가득 차. ({run.maxHp} / {run.maxHp})</p>
        </div>
        <button type="button" className="btn btn-gold" disabled={reward.offers.length > 0 && !chosen} onClick={onNext}>
          {reward.offers.length > 0 && !chosen ? '보물을 먼저 골라' : `${run.floor}층으로!`}
        </button>
      </section>
    </Page>
  )
}
