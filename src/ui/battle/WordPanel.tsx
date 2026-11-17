import { useState } from 'react'
import type { WordEntry } from '../../content/types'
import { gradeWordAuto } from '../../grading/auto'
import { meterValue, type WordGrade } from '../../grading/word'
import { OPTION_MARKS } from '../areaLabels'
import { maskExample } from '../maskExample'
import PanelFrame from './PanelFrame'

interface Props {
  entry: WordEntry
  towerId: string
  block: { pick: number; write: number }   // 통과하면 얻는 방어
  pickOrder: number[]                       // 뜻 고르기 보기 순서 ([바른 뜻, ...틀린 뜻]의 index)
  think: number
  onPick: (choice: number) => void          // 뜻 고르기 결과를 엔진에 (0 = 바른 뜻)
  onWrite: (pass: boolean, answer: string) => void   // 뜻 쓰기는 여기서 채점하고 결과만 엔진에
  onBack: () => void                        // 다른 낱말 고르기
}

type Mode = 'choose' | 'pick' | 'write'

/** 낱말 방어 (작업지시서 F4 + 개편): 뜻 고르기(가볍게) 또는 뜻 쓰기(든든하게) */
export default function WordPanel({ entry, towerId, block, pickOrder, think, onPick, onWrite, onBack }: Props) {
  const [mode, setMode] = useState<Mode>('choose')
  const [answer, setAnswer] = useState('')
  const [showExample, setShowExample] = useState(false)
  const [grading, setGrading] = useState(false)
  const [written, setWritten] = useState<WordGrade | null>(null)
  const [choice, setChoice] = useState<number | null>(null)
  const options = [entry.meaning, ...entry.rejects]
  const frame = { kind: 'word' as const, title: `낱말 방어 · ${entry.word}`, label: '낱말 방어', think }

  const submit = async () => {
    if (grading || written || answer.trim() === '') return
    setGrading(true)
    setWritten(await gradeWordAuto(answer, entry, towerId))
    setGrading(false)
  }

  if (written || choice !== null) {
    const pass = written ? written.pass : choice === 0
    return (
      <PanelFrame {...frame} tone={pass ? 'pass' : 'fail'}>
        <p className="result-head" role="status">
          {pass ? `막았어! 방어 +${written ? block.write : block.pick}` : `방어 실패${written ? ` — ${written.reason}` : ' — 뜻이 달라.'}`}
        </p>
        <p className="reveal-line"><span className="q-recap-label">내 답</span>{written ? answer : options[choice ?? 0]}</p>
        {!pass && <p className="reveal-line"><span className="q-recap-label">뜻</span><strong>{entry.meaning}</strong></p>}
        {written && written.mode !== 'precheck' && (
          <div className="meter" aria-label="뜻 가까움">
            <span className="muted">뜻 가까움{written.mode === 'simple' ? ' (간이 채점)' : ''}</span>
            <span className="meter-bar"><span style={{ width: `${Math.round(meterValue(written) * 100)}%` }} /></span>
          </div>
        )}
        <button type="button" className="btn btn-ink" autoFocus onClick={() => (written ? onWrite(written.pass, answer) : onPick(choice ?? 0))}>계속</button>
      </PanelFrame>
    )
  }

  const example = entry.example && (showExample
    ? <p className="word-example">예문: {maskExample(entry.example, entry.word)}</p>
    : <button type="button" className="link" onClick={() => setShowExample(true)}>예문 보기</button>)

  if (mode === 'choose') {
    return (
      <PanelFrame {...frame} onCancel={onBack}>
        <p className="word-big">{entry.word}</p>
        <p className="q-guide">이 말의 뜻으로 요괴의 공격을 막자. 어떻게 할래?</p>
        <div className="q-bets">
          <button type="button" className="bet bet-unsure" onClick={() => setMode('pick')}>
            <span className="bet-title">뜻 고르기</span><span className="bet-line">보기 {options.length}개 중에 골라</span><span className="bet-line">방어 +{block.pick}</span>
          </button>
          <button type="button" className="bet bet-sure" onClick={() => setMode('write')}>
            <span className="bet-title">뜻 쓰기</span><span className="bet-line">내 말로 풀어 써</span><span className="bet-line">방어 +{block.write}</span>
          </button>
        </div>
      </PanelFrame>
    )
  }

  if (mode === 'pick') {
    return (
      <PanelFrame {...frame}>
        <p className="q-prompt">‘{entry.word}’의 뜻은?</p>
        <div className="q-options is-single" role="radiogroup" aria-label="뜻 보기">
          {pickOrder.map((idx, pos) => (
            <button key={idx} type="button" role="radio" aria-checked={false} className="q-opt" onClick={() => setChoice(idx)}>
              <span className="q-mark">{OPTION_MARKS[pos]}</span><span>{options[idx]}</span>
            </button>
          ))}
        </div>
        {example}
      </PanelFrame>
    )
  }

  return (
    <PanelFrame {...frame} onCancel={grading ? undefined : () => setMode('choose')}>
      <label className="q-prompt" htmlFor="word-answer">‘{entry.word}’의 뜻을 내 말로 써 봐.</label>
      <input id="word-answer" className="write-input" value={answer} autoFocus autoComplete="off" disabled={grading}
        onChange={(e) => setAnswer(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) void submit() }} />
      {example}
      <button type="button" className="btn btn-ink" onClick={() => void submit()} disabled={grading || answer.trim() === ''}>
        {grading ? '채점 중…' : '이 뜻으로 막기'}
      </button>
    </PanelFrame>
  )
}
