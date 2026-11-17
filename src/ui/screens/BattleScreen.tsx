import { useEffect, useState } from 'react'
import { BALANCE } from '../../engine/balance'
import { incomingDamage, nextEnemyAttack, type Action, type GameState } from '../../engine/state'
import ActivePanel from '../battle/ActivePanel'
import BottomBar from '../battle/BottomBar'
import Coach, { PLAY_TIPS, READ_TIPS } from '../battle/Coach'
import Hand from '../battle/Hand'
import { buildHandCards, type PanelTarget } from '../battle/handCards'
import Hud from '../battle/Hud'
import { LostPanel, WonPanel } from '../battle/Outcome'
import type { Step } from '../battle/QuestionSteps'
import { ReadGate, RevealPanel } from '../battle/SmallPanels'
import Stage from '../battle/Stage'
import { useBattleFx } from '../battle/useBattleFx'
import PassagePanel, { type AnswerMarks } from '../components/PassagePanel'
import { eventText } from '../eventText'
import { activeFogWords } from '../fog'
import { play, soundFor } from '../sfx'
import { usePoses } from '../usePoses'
import '../battle/shell.css'

interface Props {
  state: GameState
  tower: string
  floor: number
  floors: number
  retries: number
  sound: boolean
  onSound: () => void
  coach: boolean              // 처음 하는 전투: 길잡이를 띄운다
  onCoachDone: () => void
  dispatch: (a: Action) => void
  onWon: () => void           // 이긴 전투를 마치고 보상으로
  onRetry: () => void         // 진 층을 다시
  onExit: () => void          // 나가기 (진행은 저장돼 있다)
}

/** 전투 화면. 상태는 그리기만 하고 바꾸는 건 action으로만 */
export default function BattleScreen({ state, tower, floor, floors, retries, sound, onSound, coach, onCoachDone, dispatch, onWon, onRetry, onExit }: Props) {
  const [target, setTarget] = useState<PanelTarget | null>(null)
  const [evidence, setEvidence] = useState<number[]>([])
  const [step, setStep] = useState<Step>('answer')
  const [locked, setLocked] = useState(false)
  // 막 들어온 층이면 먼저 글을 읽는다. 이어하기로 전투 도중에 들어왔으면 건너뛴다
  const [started, setStarted] = useState(() => state.turn > 1 || state.think < BALANCE.thinkPerTurn || state.events.length > 0)
  const [seen, setSeen] = useState<GameState | null>(null)   // 정답 되짚기를 확인한 상태
  const [tips, setTips] = useState<'read' | 'play' | null>(coach ? (started ? 'play' : 'read') : null)
  const p = state.passage
  const poses = usePoses(state)
  const fx = useBattleFx(state)
  useEffect(() => { const s = soundFor(state.events, state.outcome); if (s) play(s) }, [state])

  const close = () => { setTarget(null); setEvidence([]); setStep('answer'); setLocked(false) }
  const send = (a: Action) => { dispatch(a); close() }
  const open = (t: PanelTarget) => { play('open'); setEvidence([]); setStep('answer'); setLocked(false); setTarget(t) }
  const begin = () => { play('tap'); setStarted(true); if (coach) setTips('play') }

  const question = target?.kind === 'question' ? p.questions.find((q) => q.id === target.id) : undefined
  const cap = question ? question.evidence.count : target?.kind === 'fog' ? 1 : target?.kind === 'rumor' ? p.rumor?.evidence.count ?? 0 : 0
  const picking = !locked && ((question !== undefined && step === 'evidence') || target?.kind === 'fog' || target?.kind === 'rumor')
  // 근거는 정해진 개수까지만 고를 수 있다(1개면 다른 문장을 누르면 바뀜). 바꾸려면 고른 문장을 다시 눌러 뺀다
  const toggle = (i: number) => setEvidence((s) =>
    s.includes(i) ? s.filter((x) => x !== i) : s.length < cap ? [...s, i] : cap === 1 ? [i] : s)
  const guide = target?.kind === 'fog' ? '단서 문장 1개를 눌러 봐'
    : `${target?.kind === 'rumor' ? '반박 근거' : '근거 문장'} ${cap}개를 눌러 봐 (${evidence.length}/${cap})`

  const playing = state.outcome === 'playing'
  const missed = state.events.find((e) => e.kind === 'question' && e.grade !== 'hit')
  const missedQ = missed?.kind === 'question' ? p.questions.find((q) => q.id === missed.questionId) : undefined
  const reveal = playing && !target && seen !== state && missed?.kind === 'question' && missedQ ? { e: missed, q: missedQ } : null
  const marks: AnswerMarks | undefined = reveal
    ? { must: [...new Set(reveal.q.evidence.required.flat())], also: reveal.q.evidence.allowed ?? [] } : undefined
  const fog = p.lockedWords.filter((_, i) => !state.fogCleared.includes(i))
  const cards = buildHandCards(state)
  const mode = !started ? 'read' : !playing ? 'end' : target || reveal ? 'panel' : 'idle'

  return (
    <div className="battle" data-mode={mode} data-boss={p.rumor ? '' : undefined}>
      <Hud tower={tower} floor={floor} floors={floors} boons={state.boons} sound={sound} onSound={onSound}
        onHelp={() => setTips(started ? 'play' : 'read')} onExit={onExit} />
      <div className="battle-book" data-coach="book">
        <PassagePanel title={p.title} sentences={p.sentences} fog={fog} selected={evidence}
          onToggle={picking ? toggle : undefined} guide={guide} answer={marks} />
      </div>
      <div className="battle-stage" data-coach="stage">
        <Stage state={state} poses={poses} fx={fx} floor={floor} boss={Boolean(p.rumor)} />
      </div>
      {/* 손패와 막대는 늘 자리를 지킨다(무대 높이가 바뀌지 않게). 패널이 열리면 그 위를 덮는다 */}
      <div className="battle-desk" data-coach="desk"><Hand cards={cards} onPick={(c) => open(c.target)} /></div>
      <BottomBar think={state.think} maxThink={BALANCE.thinkPerTurn} turn={state.turn} attack={nextEnemyAttack(state)}
        shield={state.player.block + state.guard} incoming={incomingDamage(state)}
        nudge={cards.every((c) => c.disabled)} onEnd={() => send({ type: 'endTurn' })} />
      {mode !== 'idle' && (
        <div className="battle-panel">
          {!started ? (
            <ReadGate title={p.title} sentences={p.sentences.length} enemy={p.enemy.name} onStart={begin} />
          ) : state.outcome === 'won' ? (
            <WonPanel state={state} lastFloor={floor >= floors} onNext={() => { close(); onWon() }} />
          ) : state.outcome === 'lost' ? (
            <LostPanel state={state} retries={retries} onRetry={() => { close(); onRetry() }} onExit={onExit} />
          ) : reveal ? (
            <RevealPanel question={reveal.q} grade={reveal.e.grade} fogWords={activeFogWords(state)} penalty={reveal.e.enemyAttackBonus}
              order={state.optionOrder[reveal.q.id] ?? reveal.q.options.map((_, i) => i)} onOk={() => setSeen(state)} />
          ) : target ? (
            <ActivePanel state={state} target={target} evidence={evidence} step={step} onStep={setStep} onTarget={open}
              onLock={() => setLocked(true)} dispatch={send} act={dispatch} onClose={close} />
          ) : null}
        </div>
      )}
      <ul className="sr-only" role="status">{state.events.map((e, i) => <li key={i}>{eventText(e)}</li>)}</ul>
      {tips && (
        <Coach key={tips} steps={tips === 'read' ? READ_TIPS : PLAY_TIPS}
          onDone={() => { if (tips === 'play' && coach) onCoachDone(); setTips(null) }} />
      )}
    </div>
  )
}
