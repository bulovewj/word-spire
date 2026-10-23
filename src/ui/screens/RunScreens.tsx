import { findWord } from '../../content'
import type { Tower } from '../../content/types'
import type { RunState } from '../../engine/run'
import './screens.css'

// 탑 흐름의 전투 밖 화면들 (작업지시서 F7, 4장 화면 목록)

export function IntroScreen({ tower, onNext }: { tower: Tower; onNext: () => void }) {
  return (
    <section className="screen">
      <h2>{tower.title} 탑</h2>
      {tower.intro.map((line) => <p key={line} className="story">{line}</p>)}
      <button type="button" className="primary" autoFocus onClick={onNext}>1층으로</button>
    </section>
  )
}

function WordList({ ids }: { ids: string[] }) {
  if (ids.length === 0) return <p>새로 얻은 낱말 카드는 없어. (안개를 걷으면 얻을 수 있어)</p>
  return (
    <ul className="word-list">
      {ids.map((id) => {
        const w = findWord(id)
        return <li key={id}><strong>{w?.word ?? id}</strong> — {w?.meaning}</li>
      })}
    </ul>
  )
}

export function RewardScreen({ run, onNext }: { run: RunState; onNext: () => void }) {
  return (
    <section className="screen">
      <h2>{run.floor - 1}층 봉인 완료!</h2>
      <h3>얻은 낱말 카드</h3>
      <WordList ids={run.reward?.words ?? []} />
      <p>체력 +{run.reward?.healed ?? 0} → {run.hp} / {run.maxHp}</p>
      <p className="muted">내 낱말 카드 {run.deck.length}장</p>
      <button type="button" className="primary" autoFocus onClick={onNext}>{run.floor}층으로</button>
    </section>
  )
}

export function CompleteScreen({ run, tower, newWords, onHome }: { run: RunState; tower: Tower; newWords: string[]; onHome: () => void }) {
  return (
    <section className="screen">
      <h2>{tower.title} 탑 완료!</h2>
      {tower.outro.map((line) => <p key={line} className="story">{line}</p>)}
      <h3>이번 탑에서 모은 낱말</h3>
      <WordList ids={newWords} />
      <p>남은 체력 {run.hp} / {run.maxHp}</p>
      <button type="button" className="primary" autoFocus onClick={onHome}>처음으로</button>
    </section>
  )
}
