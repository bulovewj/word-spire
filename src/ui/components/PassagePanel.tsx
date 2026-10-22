import { useState } from 'react'
import { FOG } from '../fog'
import './PassagePanel.css'

export interface FogMark {
  word: string
  sentence: number
}

interface Props {
  title: string
  sentences: string[]
  fog: FogMark[]              // 아직 걷히지 않은 잠긴 낱말
  selected: number[]          // 선택한 문장 index
  onToggle?: (index: number) => void   // 없으면 탭할 수 없다
}

function renderSentence(text: string, words: string[]) {
  if (words.length === 0) return text
  const pattern = new RegExp(`(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`)
  return text.split(pattern).map((part, i) =>
    words.includes(part)
      ? <span key={i} className="fog" aria-label="가려진 낱말">{FOG}</span>
      : part,
  )
}

export default function PassagePanel({ title, sentences, fog, selected, onToggle }: Props) {
  const [folded, setFolded] = useState(false)
  const shut = folded && !onToggle   // 근거를 고를 때는 접혀 있어도 연다
  return (
    <section className={`passage${shut ? ' is-folded' : ''}`} aria-label="본문">
      <div className="passage-head">
        <h2 className="passage-title">{title}</h2>
        <button type="button" className="passage-toggle" aria-expanded={!shut} onClick={() => setFolded((f) => !f)}>
          {shut ? `펼치기 · ${sentences.length}문장` : '접기'}
        </button>
      </div>
      <ol className="passage-list">
        {sentences.map((text, i) => {
          const words = fog.filter((f) => f.sentence === i).map((f) => f.word)
          const isSelected = selected.includes(i)
          return (
            <li key={i}>
              <button
                type="button"
                className={`sentence${isSelected ? ' is-selected' : ''}`}
                aria-pressed={isSelected}
                disabled={!onToggle}
                onClick={() => onToggle?.(i)}
              >
                <span className="sentence-no">{i + 1}</span>
                <span>{renderSentence(text, words)}</span>
              </button>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
