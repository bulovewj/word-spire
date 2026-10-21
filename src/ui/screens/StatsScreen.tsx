import { useState } from 'react'
import type { Area } from '../../engine/records'
import { encodeResult } from '../../engine/resultCode'
import { judgement, weakest, type Stats } from '../../engine/stats'
import { BALANCE } from '../../engine/balance'
import './screens.css'

// 내 기록 (기획안 8장 · 작업지시서 F8). 디자인은 M11

const ROWS: { area: Area; label: string; hint: string }[] = [
  { area: 'word', label: '낱말 베기', hint: '낱말 뜻' },
  { area: 'connect', label: '연결 사슬', hint: '연결 질문' },
  { area: 'author', label: '추리의 눈', hint: '글쓴이와 나' },
  { area: 'summary', label: '요약 봉인', hint: '한 문장 요약' },
]

const pct = (x: number) => `${Math.round(x * 100)}%`

interface Props {
  stats: Stats
  name: string
  onName: (name: string) => void
  onHome: () => void
}

export default function StatsScreen({ stats, name, onName, onHome }: Props) {
  const [code, setCode] = useState('')
  const [copied, setCopied] = useState<boolean | null>(null)
  const weak = weakest(stats)
  const judge = judgement(stats)

  const copy = async () => {
    const c = await encodeResult({ name, stats })
    setCode(c)
    try {
      await navigator.clipboard.writeText(c)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <section className="screen">
      <h2>내 기록</h2>
      <p className="muted">처음 풀었을 때 맞힌 비율이야. 단서 보기·다시 보기로 푼 건 따로 세.</p>
      <ul className="stat-list">
        {ROWS.map(({ area, label, hint }) => {
          const a = stats.areas[area]
          return (
            <li key={area} className={weak === area ? 'weak' : undefined}>
              <strong>{label}</strong> <span className="muted">({hint})</span>
              <span>{a.total === 0 ? '아직 기록 없어' : `${pct(a.correct / a.total)} (${a.correct}/${a.total})`}</span>
              {a.helped > 0 && <span className="muted">도움받아 해결 {a.helped}</span>}
              {weak === area && <span className="badge">⚠ 약점</span>}
            </li>
          )
        })}
        <li>
          <strong>판단력</strong> <span className="muted">(확실일 때 정답률 − 애매일 때 정답률)</span>
          {judge === null
            ? <span className="muted">확실·애매로 낸 질문이 각각 {BALANCE.statsMinSamples}개씩 쌓이면 보여 줄게 (지금 확실 {stats.sure.total} · 애매 {stats.unsure.total})</span>
            : <span>{judge >= 0 ? '+' : ''}{Math.round(judge * 100)} <span className="muted">(높을수록 &lsquo;확실&rsquo;이라 한 답이 잘 맞아)</span></span>}
        </li>
      </ul>

      <label className="name-field">
        이름 <span className="muted">(이 기기에만 저장돼)</span>
        <input value={name} maxLength={20} onChange={(e) => onName(e.target.value)} />
      </label>
      <button type="button" className="primary" disabled={!name.trim()} onClick={copy}>결과 코드 복사</button>
      {!name.trim() && <p className="muted">이름을 먼저 써 줘.</p>}
      {code && (
        <>
          <p>{copied ? '복사했어! 선생님이 알려 준 곳에 붙여 넣어.' : '자동 복사가 안 됐어. 아래 코드를 직접 골라 복사해 줘.'}</p>
          <textarea className="code-box" readOnly value={code} rows={3} onFocus={(e) => e.target.select()} />
        </>
      )}
      <button type="button" onClick={onHome}>처음으로</button>
    </section>
  )
}
