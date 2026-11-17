import { useState } from 'react'
import { BALANCE } from '../../engine/balance'
import { encodeResult } from '../../engine/resultCode'
import { AREAS, judgement, weakest, type Stats } from '../../engine/stats'
import { AREA_ROWS as ROWS, pct } from '../areaLabels'
import Page from '../components/Page'
import './records.css'

// 내 기록 (기획안 8장 · 작업지시서 F8)

/** 도움 없이 처음에 맞힌 수에 따라 붙는 별명 (재미용. 기록·채점과 무관) */
const TITLES: [number, string][] = [[40, '글힘 도사'], [20, '근거 사냥꾼'], [8, '글줄 길잡이'], [0, '새내기 글지기']]

interface Props {
  stats: Stats
  name: string
  onName: (name: string) => void
  onBack: () => void
}

export default function StatsScreen({ stats, name, onName, onBack }: Props) {
  const [code, setCode] = useState('')
  const [copied, setCopied] = useState<boolean | null>(null)
  const [failed, setFailed] = useState(false)
  const weak = weakest(stats)
  const judge = judgement(stats)
  const solved = AREAS.reduce((n, a) => n + stats.areas[a].correct, 0)
  const title = TITLES.find(([min]) => solved >= min)?.[1] ?? ''

  const copy = async () => {
    let c: string
    try {
      c = await encodeResult({ name, stats })
    } catch {
      setCode('')
      setFailed(true)
      return
    }
    setFailed(false)
    setCode(c)
    try {
      await navigator.clipboard.writeText(c)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }
  // 이름을 고치면 옛 이름으로 만든 코드는 지운다
  const rename = (v: string) => { onName(v); setCode(''); setCopied(null) }

  return (
    <Page title="내 기록" kicker={title} onBack={onBack}>
      <section className="sheet">
        <p className="muted">처음 풀었을 때 도움 없이 맞힌 비율이야. 단서 보기·뜻 고르기·요약 틀로 푼 건 ‘도움받아 해결’로 따로 세.</p>
        <ul className="stat-list">
          {ROWS.map(({ area, label, hint }) => {
            const a = stats.areas[area]
            const r = a.total === 0 ? null : a.correct / a.total
            return (
              <li key={area} className={weak === area ? 'is-weak' : undefined}>
                <div className="stat-head">
                  <strong>{label}</strong> <span className="muted">{hint}</span>
                  {weak === area && <span className="stat-weak">더 연습할 곳</span>}
                </div>
                <div className="stat-meter" role="meter" aria-label={`${label} 정답률`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={r === null ? 0 : Math.round(r * 100)}>
                  <span style={{ width: r === null ? 0 : pct(r) }} />
                </div>
                <div className="stat-foot">
                  <span>{r === null ? '아직 기록이 없어' : `${pct(r)} (${a.correct}/${a.total})`}</span>
                  {a.helped > 0 && <span className="muted">도움받아 해결 {a.helped}</span>}
                </div>
              </li>
            )
          })}
          <li>
            <div className="stat-head"><strong>판단력</strong> <span className="muted">‘확실해’가 얼마나 잘 맞나</span></div>
            <div className="stat-foot">
              {judge === null
                ? <span className="muted">확실·애매로 낸 질문이 각각 {BALANCE.statsMinSamples}개씩 쌓이면 보여 줄게 (지금 확실 {stats.sure.total} · 애매 {stats.unsure.total})</span>
                : <span>{judge >= 0 ? '+' : ''}{Math.round(judge * 100)} <span className="muted">(높을수록 ‘확실해’라고 한 답이 잘 맞아)</span></span>}
            </div>
          </li>
        </ul>
      </section>

      <section className="sheet">
        <h2>선생님께 결과 보내기</h2>
        <label className="name-field">
          이름 <span className="muted">(이 기기에만 저장돼)</span>
          <input value={name} maxLength={20} onChange={(e) => rename(e.target.value)} />
        </label>
        <div className="page-actions">
          {!name.trim() && <span className="muted">이름을 먼저 써 줘.</span>}
          <button type="button" className="btn btn-ink" disabled={!name.trim()} onClick={copy}>결과 코드 복사</button>
        </div>
        {failed && <p role="alert">이 기기에서는 코드를 만들 수 없어. 선생님께 알려 줘.</p>}
        {code && (
          <>
            <p>{copied ? '복사했어! 선생님이 알려 준 곳에 붙여 넣어.' : '자동 복사가 안 됐어. 아래 코드를 직접 골라 복사해 줘.'}</p>
            <textarea className="code-box" readOnly value={code} rows={3} onFocus={(e) => e.target.select()} />
          </>
        )}
        <p className="muted">코드에는 이름과 맞힌 수만 들어 있어. 내가 쓴 글은 기기 밖으로 나가지 않아.</p>
      </section>
    </Page>
  )
}
