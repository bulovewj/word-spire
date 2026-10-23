import type { Tower } from '../../content/types'
import type { RunState } from '../../engine/run'
import GradingBadge from '../components/GradingBadge'
import gourd from '../sprites/gourd.png'
import poster from '../media/title-korean-v1.png'
import { useTitleMotion } from './useTitleMotion'
import './title.css'

const idleVideo = Object.values(import.meta.glob<string>('../media/title-idle-korean-v1.mp4', {
  eager: true, query: '?url', import: 'default',
}))[0]

interface TitleProps {
  towers: Tower[]
  saved: RunState | null
  onContinue: () => void
  onStart: (towerId: string) => void
  onStats: () => void
  onTeacher: () => void
}

export default function TitleScreen({ towers, saved, onContinue, onStart, onStats, onTeacher }: TitleProps) {
  const motion = useTitleMotion(Boolean(idleVideo))
  const savedTower = saved && (towers.find((t) => t.id === saved.towerId)?.title ?? saved.towerId)

  return (
    <section className={`title-screen${saved ? ' title-has-save' : ''}`} aria-labelledby="title-name">
      <div className="title-art" aria-hidden="true">
        <img className="title-art-image" src={poster} alt="" fetchPriority="high" />
        {motion.active && (
          <video className="title-art-image" ref={motion.videoRef} src={idleVideo} poster={poster}
            autoPlay muted loop playsInline preload="none" onError={motion.onError} tabIndex={-1} />
        )}
      </div>

      <header className="title-topbar">
        <span className="title-world">왕명과 닫힌궁</span>
        <GradingBadge />
      </header>

      <div className="title-layout">
        <div className="title-paper">
          <div className="title-heading">
            <span className="title-kicker">닫힌궁의 문이 열렸어</span>
            <h1 id="title-name">낱말탑</h1>
            <p>글을 읽고, 근거를 찾아<br />헛소문을 부적에 묶어 봐.</p>
          </div>

          <nav className="title-menu" aria-label="모험 시작">
            <h2>탑을 골라 오르자</h2>
            {saved && (
              <button type="button" className="title-button title-primary title-continue" onClick={onContinue}>
                <span>이어하기</span>
                <small>{savedTower} 탑 · {saved.floor}층</small>
                <span className="title-arrow" aria-hidden="true">→</span>
              </button>
            )}
            <ul className="title-towers">
              {towers.map((tower) => (
                <li key={tower.id}>
                  <button type="button" className={`title-button title-tower${saved ? '' : ' title-primary'}`}
                    onClick={() => onStart(tower.id)}>
                    <img className="title-gourd" src={gourd} alt="" />
                    <span><strong>{tower.title} 탑</strong><small>3층 · 한 층 5~10분</small></span>
                    <span className="title-arrow" aria-hidden="true">→</span>
                  </button>
                </li>
              ))}
            </ul>
            {saved && <p className="title-save-warning">새로 시작하면 진행 중인 탑은 지워져.</p>}
            <div className="title-secondary">
              <button type="button" className="title-button" onClick={onStats}>내 기록</button>
              <button type="button" className="title-button" onClick={onTeacher}>선생님</button>
            </div>
          </nav>

          <p className="title-footnote">읽고 이해하는 힘으로 여는 모험</p>
        </div>
      </div>

      <footer className="title-footer">
        <span>천천히 읽어도 괜찮아.</span>
        <button type="button" className="title-motion" aria-pressed={motion.active}
          disabled={motion.reduced || motion.failed} onClick={motion.toggle}
          title={motion.reduced ? '기기의 움직임 줄이기 설정을 따르고 있어' : undefined}>
          <span aria-hidden="true">{motion.active ? 'Ⅱ' : '▷'}</span>
          {motion.reduced ? '움직임 줄이기 · 정지 화면' : motion.failed ? '정지 화면' : motion.active ? '움직임 끄기' : '움직임 켜기'}
        </button>
      </footer>
    </section>
  )
}
