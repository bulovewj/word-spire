import { STORY } from '../../content/story'
import { BALANCE } from '../../engine/balance'
import { starChecks, starCount } from '../../engine/stars'
import type { GameState } from '../../engine/state'
import Stars from '../components/Stars'

interface WonProps { state: GameState; lastFloor: boolean; onNext: () => void }

/** 봉인 성공: 요괴의 마지막 한마디와 별. 별의 까닭 세 가지를 함께 보여 준다 */
export function WonPanel({ state, lastFloor, onNext }: WonProps) {
  const c = starChecks(state)
  const total = state.passage.questions.length
  const rows = [
    { ok: c.sealed, text: '요약으로 봉인' },
    { ok: c.allHits, text: `질문 ${total}개 모두 정타 (${Math.min(state.tally.hits, total)}/${total})` },
    { ok: c.healthy, text: `체력 절반 이상 남기기 (${state.player.hp}/${state.player.maxHp})` },
  ]
  return (
    <section className="panel panel-summary is-pass outcome" aria-label="봉인 성공">
      <div className="panel-body">
        <h3 className="outcome-title">{STORY.sealed}</h3>
        <p className="outcome-line">{state.passage.enemy.name}: “{state.passage.enemy.sealLine}”</p>
        <Stars count={starCount(c)} scale={3} pop />
        <ul className="outcome-checks">
          {rows.map((r) => <li key={r.text} className={r.ok ? 'is-ok' : ''}><span aria-hidden="true">{r.ok ? '✔' : '·'}</span> {r.text}</li>)}
        </ul>
        <button type="button" className="btn btn-gold" autoFocus onClick={onNext}>{lastFloor ? '탑을 다 올랐어!' : '보물 받으러 가기'}</button>
      </div>
    </section>
  )
}

/** 졌을 때 건네는 한마디: 이번 전투에서 아쉬웠던 것 하나 */
function tip(s: GameState): string {
  if (s.tally.summaryFails > 0) return '요약에는 글에서 가장 중요한 것만 담아 봐. 빠진 것을 알려 줬지?'
  if (s.tally.misses > s.tally.hits) return '답을 고르기 전에 본문에서 근거 문장을 먼저 찾아봐. 애매하면 ‘애매해’로!'
  return '요괴의 공격이 셀 때는 낱말 방어로 먼저 막아 봐.'
}

interface LostProps { state: GameState; retries: number; onRetry: () => void; onExit: () => void }

/** 쓰러졌을 때: 꾸짖지 않고, 다음에 해 볼 것 하나와 요괴가 지쳤다는 소식 */
export function LostPanel({ state, retries, onRetry, onExit }: LostProps) {
  const eased = Math.min(BALANCE.retryEaseMax, (retries + 1) * BALANCE.retryEase)
  return (
    <section className="panel is-fail outcome" aria-label="쓰러짐">
      <div className="panel-body">
        <h3 className="outcome-title">{STORY.defeatTitle}</h3>
        <p>{STORY.defeatLine}</p>
        <p className="outcome-tip">{tip(state)}</p>
        <p className="muted">{state.passage.enemy.name}도 지쳤어. 다시 하면 공격이 {eased} 약해져.</p>
        <div className="outcome-actions">
          <button type="button" className="btn btn-quiet" onClick={onExit}>나가기</button>
          <button type="button" className="btn btn-gold" autoFocus onClick={onRetry}>다시 도전!</button>
        </div>
      </div>
    </section>
  )
}
