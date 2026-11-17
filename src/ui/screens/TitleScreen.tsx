import { STORY } from '../../content/story'
import GradingBadge from '../components/GradingBadge'
import Stars from '../components/Stars'
import gourd from '../sprites/gourd.png'
import poster from '../media/title-korean-v1.png'
import { useTitleMotion } from './useTitleMotion'
import './title.css'

const idleVideo = Object.values(import.meta.glob<string>('../media/title-idle-korean-v1.mp4', {
  eager: true, query: '?url', import: 'default',
}))[0]

interface TitleProps {
  saved: { tower: string; floor: number } | null   // 오르던 탑
  stars: number               // 지금까지 모은 별
  seals: number               // 받은 왕명 인장
  sound: boolean
  onSound: () => void
  onContinue: () => void
  onAdventure: () => void     // 탑 고르기 (처음이면 이야기부터)
  onBook: () => void
  onStats: () => void
  onTeacher: () => void
}

export default function TitleScreen({ saved, stars, seals, sound, onSound, onContinue, onAdventure, onBook, onStats, onTeacher }: TitleProps) {
  const motion = useTitleMotion(Boolean(idleVideo))

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
        <span className="title-world">{STORY.world}</span>
        <GradingBadge />
      </header>

      <div className="title-layout">
        <div className="title-paper">
          <div className="title-heading">
            <span className="title-kicker">닫힌궁의 문이 열렸어</span>
            <h1 id="title-name">낱말탑</h1>
            <p>글을 읽고, 근거를 찾아<br />요괴를 호리병에 봉인하자.</p>
          </div>

          <nav className="title-menu" aria-label="모험 시작">
            {saved && (
              <button type="button" className="title-button title-primary title-continue" onClick={onContinue}>
                <img className="title-gourd" src={gourd} alt="" />
                <span><strong>이어하기</strong><small>{saved.tower} 탑 · {saved.floor}층</small></span>
                <span className="title-arrow" aria-hidden="true">→</span>
              </button>
            )}
            <button type="button" className={`title-button title-tower${saved ? '' : ' title-primary'}`} onClick={onAdventure}>
              {!saved && <img className="title-gourd" src={gourd} alt="" />}
              <span><strong>{saved ? '탑 고르기' : '모험 시작'}</strong>{!saved && <small>탑을 골라 오르자 · 한 층 5~10분</small>}</span>
              <span className="title-arrow" aria-hidden="true">→</span>
            </button>
            <div className="title-secondary">
              <button type="button" className="title-button" onClick={onBook}>부적첩</button>
              <button type="button" className="title-button" onClick={onStats}>내 기록</button>
            </div>
          </nav>

          <p className="title-footnote">
            {stars > 0 ? <><Stars count={1} max={1} /> 별 {stars}개{seals > 0 ? ` · 왕명 인장 ${seals}개` : ''}</> : '읽고 이해하는 힘으로 여는 모험'}
            <button type="button" className="title-teacher" onClick={onTeacher}>선생님</button>
          </p>
        </div>
      </div>

      <footer className="title-footer">
        <span>천천히 읽어도 괜찮아.</span>
        <span className="title-toggles">
          <button type="button" className="title-motion" aria-pressed={sound} onClick={onSound}>소리 {sound ? '켬' : '끔'}</button>
          <button type="button" className="title-motion" aria-pressed={motion.active}
            disabled={motion.reduced || motion.failed} onClick={motion.toggle}
            title={motion.reduced ? '기기의 움직임 줄이기 설정을 따르고 있어' : undefined}>
            <span aria-hidden="true">{motion.active ? 'Ⅱ' : '▷'}</span>
            {motion.reduced ? '움직임 줄이기 · 정지 화면' : motion.failed ? '정지 화면' : motion.active ? '움직임 끄기' : '움직임 켜기'}
          </button>
        </span>
      </footer>
    </section>
  )
}
