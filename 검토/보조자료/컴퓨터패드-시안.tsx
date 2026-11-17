import { useReducer, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { passages, starterDeck } from '../../src/content'
import { BALANCE } from '../../src/engine/balance'
import { createBattle, reduce } from '../../src/engine/state'
import BattleScreen from '../../src/ui/screens/BattleScreen'
import '../../src/styles/tokens.css'
import './컴퓨터패드-배치.css'

function Floor({ floor, onNext, onRestart }: { floor: number; onNext: () => void; onRestart: () => void }) {
  const passage = passages[floor - 1] ?? passages[0]!
  const fresh = () => createBattle({ passage, deck: starterDeck,
    wordUses: Object.fromEntries(starterDeck.map(id => [id, BALANCE.wordUsesPerTower])),
    seed: 621, playerHp: BALANCE.playerMaxHp, playerMaxHp: BALANCE.playerMaxHp })
  const [state, dispatch] = useReducer(reduce, undefined, fresh)
  return <>
    <header className="preview-game-head">
      <a href="00-최종검토.html" className="preview-logo">낱말탑<span>왕명과 닫힌 궁</span></a>
      <div className="preview-floor"><span>꿀벌 탑</span><strong>{floor}층 · {passage.enemy.name}</strong></div>
      <ol className="preview-progress" aria-label={`탑 진행 ${floor}층 / 3층`}>
        {[1, 2, 3].map(n => <li key={n} className={n === floor ? 'current' : ''} aria-current={n === floor ? 'step' : undefined}>{n}<span>층</span></li>)}
      </ol>
    </header>
    <BattleScreen state={state} dispatch={dispatch} lastFloor={floor === 3} onWon={onNext}
      onRetry={onRestart} />
  </>
}

function Preview() {
  const [floor, setFloor] = useState(1)
  const [revision, setRevision] = useState(0)
  const [width, setWidth] = useState('auto')
  const restart = (next: number) => { setFloor(next); setRevision(n => n + 1) }
  return <>
    <div className="preview-toolbar">
      <div><span className="preview-proposal">미정 제안</span><strong>컴퓨터 · 패드 전투 배치</strong></div>
      <div className="preview-sizes" role="group" aria-label="미리보기 폭">
        {[['auto', '전체 너비'], ['1024px', '패드 가로'], ['820px', '패드 세로']].map(([value, label]) =>
          <button key={value} type="button" aria-pressed={width === value} onClick={() => setWidth(value!)}>{label}</button>)}
      </div>
    </div>
    <div className="preview-shell" style={{ maxWidth: width === 'auto' ? 1560 : width }}>
      <main className="preview-game"><Floor key={`${floor}-${revision}`} floor={floor} onNext={() => restart(floor === 3 ? 1 : floor + 1)} onRestart={() => restart(floor)} /></main>
    </div>
    <footer className="preview-footer">
      <div><strong>직접 눌러 보는 레이아웃 시안</strong><p>카드를 골라 답과 근거를 선택해 봐. 본문은 18px, 인물은 현재 게임 원화를 유지했어.</p>
        <p>게임 연결 전 제안이야. 이 검토본은 저장하지 않고, 낱말·요약은 간이 채점으로 움직여.</p></div>
      <div className="preview-tests" role="group" aria-label="검토할 층">
        {[1, 2, 3].map(n => <button key={n} type="button" aria-pressed={floor === n} onClick={() => restart(n)}>{n}층 보기</button>)}
        <button type="button" onClick={() => restart(floor)}>처음 상태로</button>
      </div>
    </footer>
  </>
}

createRoot(document.getElementById('root')!).render(<Preview />)
