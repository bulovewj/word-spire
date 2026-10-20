import { useState } from 'react'
import GradingBadge from '../components/GradingBadge'
import SummaryCheck from './SummaryCheck'
import WordCheck from './WordCheck'
import './gradingCheck.css'

// 채점 점검 화면 (작업지시서 F10, 개발용 ?dev=grading). 실제 학생 답으로 기준값을 정한다.

export default function GradingCheck() {
  const [tab, setTab] = useState<'word' | 'summary'>('word')
  return (
    <main className="gcheck">
      <h1>채점 점검 <GradingBadge /></h1>
      <p>기준값은 <code>src/grading/policy.ts</code>에 있습니다.</p>
      <div className="gtabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'word'} onClick={() => setTab('word')}>낱말 뜻</button>
        <button type="button" role="tab" aria-selected={tab === 'summary'} onClick={() => setTab('summary')}>요약</button>
      </div>
      {tab === 'word' ? <WordCheck /> : <SummaryCheck />}
    </main>
  )
}
