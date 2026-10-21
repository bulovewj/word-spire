import { useState } from 'react'
import { buildClassTable, type ClassTable } from '../../engine/classTable'
import { rate, type Tally } from '../../engine/stats'
import { AREA_ROWS, pct } from '../areaLabels'
import './screens.css'

// 교사 화면 (기획안 9장 · 작업지시서 F9). 저장하지 않는다. 교사 화면 문구는 존댓말

const cell = (t: Tally) => {
  const r = rate(t)
  return r === null ? '—' : `${pct(r)} (${t.correct}/${t.total})`
}
const judgeText = (j: number | null) => (j === null ? '—' : `${j >= 0 ? '+' : ''}${Math.round(j * 100)}`)

export default function TeacherScreen({ onHome }: { onHome: () => void }) {
  const [text, setText] = useState('')
  const [table, setTable] = useState<ClassTable | null>(null)

  return (
    <section className="screen screen-wide">
      <h2>선생님 화면</h2>
      <p className="muted">학생들이 제출한 결과 코드를 한 줄에 하나씩 붙여 넣으세요. 이 화면은 아무것도 저장하지 않습니다. 새로 고치면 사라집니다.</p>
      <textarea className="code-box" rows={6} value={text} onChange={(e) => setText(e.target.value)}
        placeholder="NT1-…" aria-label="결과 코드 붙여 넣기" />
      <button type="button" className="primary" disabled={!text.trim()} onClick={async () => setTable(await buildClassTable(text))}>
        표 만들기
      </button>

      {table && (
        <>
          {table.broken.length > 0 && (
            <ul className="broken-list" role="alert">
              {table.broken.map((b) => <li key={b.line}>{b.line}번째 줄: 읽을 수 없는 코드입니다. 학생에게 다시 복사해 달라고 해 주세요.</li>)}
            </ul>
          )}
          {table.rows.length === 0 ? <p>읽은 학생이 없습니다.</p> : (
            <div className="table-wrap">
              <table className="class-table">
                <thead>
                  <tr>
                    <th scope="col">이름</th>
                    {AREA_ROWS.map((r) => <th key={r.area} scope="col">{r.label}<br /><span className="muted">{r.hint}</span></th>)}
                    <th scope="col">판단력<br /><span className="muted">확실 − 애매</span></th>
                  </tr>
                </thead>
                <tbody>
                  {table.rows.map((s) => (
                    <tr key={s.line}>
                      <th scope="row">{s.name || '(이름 없음)'}</th>
                      {AREA_ROWS.map((r) => (
                        <td key={r.area} className={s.weak === r.area ? 'weak' : undefined}>
                          {cell(s.stats.areas[r.area])}{s.weak === r.area && <span className="badge"> ⚠ 약점</span>}
                        </td>
                      ))}
                      <td>{judgeText(s.judge)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <th scope="row">학급 전체 ({table.rows.length}명)</th>
                    {AREA_ROWS.map((r) => <td key={r.area}>{cell(table.total.areas[r.area])}</td>)}
                    <td>—</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
          <p className="muted">정답률은 처음 풀었을 때 도움 없이 맞힌 비율입니다. 약점은 처음 푼 문항이 5개 이상 쌓인 영역이 둘 이상일 때 가장 낮은 영역에 표시합니다. 판단력은 확실·애매로 낸 질문이 각각 5개 이상일 때만 나옵니다.</p>
        </>
      )}
      <button type="button" onClick={onHome}>처음으로</button>
    </section>
  )
}
