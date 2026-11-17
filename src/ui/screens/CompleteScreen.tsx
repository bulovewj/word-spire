import { STORY } from '../../content/story'
import type { Passage, Tower } from '../../content/types'
import { runStars, type RunState } from '../../engine/run'
import Page from '../components/Page'
import Stars from '../components/Stars'
import { WordCard } from './RewardScreen'
import './complete.css'

interface Props {
  run: RunState               // phase === 'complete'
  tower: Tower
  floors: Passage[]
  starter: string[]           // 이 탑을 시작할 때의 낱말 묶음 (새로 모은 낱말을 가려내려고)
  allSealed: boolean          // 모든 탑에 인장을 찍었다
  onHome: () => void
}

/** 탑을 다 올랐을 때: 왕명 인장, 층별 별, 이번에 모은 낱말 */
export default function CompleteScreen({ run, tower, floors, starter, allSealed, onHome }: Props) {
  const newWords = run.deck.filter((id) => !starter.includes(id))
  const total = runStars(run)
  return (
    <Page title={`${tower.title} 탑을 다 올랐어!`} kicker="왕명 완수" aside={<strong className="complete-total">별 {total} / {floors.length * 3}</strong>}>
      <section className="sheet complete-hero">
        <div className="royal-seal" role="img" aria-label={`${tower.title} 탑 왕명 인장`}>
          <span>{tower.title}</span><small>왕명 인장</small>
        </div>
        <div className="complete-story">
          {tower.outro.map((line) => <p key={line} className="story-line">{line}</p>)}
        </div>
      </section>

      <section className="sheet">
        <h2>층마다 받은 별</h2>
        <ol className="complete-floors">
          {floors.map((p, i) => {
            const r = run.results[i]
            return (
              <li key={p.id}>
                <span className="complete-floor-no">{p.floor}층</span>
                <span className="complete-floor-name">{p.enemy.name} · 「{p.title}」</span>
                <Stars count={r?.stars ?? 0} pop />
              </li>
            )
          })}
        </ol>
        {total < floors.length * 3 && <p className="muted">별 3개: 질문을 모두 정타로 내고, 체력을 절반 이상 남기고 봉인하기. 다시 오르면 더 모을 수 있어.</p>}
      </section>

      {newWords.length > 0 && (
        <section className="sheet">
          <h2>이번 탑에서 모은 낱말</h2>
          <div className="word-cards">{newWords.map((id) => <WordCard key={id} id={id} />)}</div>
          <p className="muted">모은 낱말은 부적첩에서 다시 볼 수 있어.</p>
        </section>
      )}

      {allSealed && (
        <section className="sheet complete-epilogue">
          <h2>닫힌궁의 글을 모두 되찾았어</h2>
          {STORY.epilogue.map((line) => <p key={line} className="story-line">{line}</p>)}
        </section>
      )}

      <div className="page-actions">
        <button type="button" className="btn btn-gold" onClick={onHome}>닫힌궁으로</button>
      </div>
    </Page>
  )
}
