import { FOG } from '../fog'
import './PassagePanel.css'

export interface FogMark {
  word: string
  sentence: number
}

/** 방금 틀린 질문의 정답 근거: 꼭 들어가야 하는 문장과, 함께 골라도 되는 문장 */
export interface AnswerMarks { must: number[]; also: number[] }

interface Props {
  title: string
  sentences: string[]
  fog: FogMark[]              // 아직 걷히지 않은 잠긴 낱말
  selected: number[]          // 선택한 문장 index
  onToggle?: (index: number) => void   // 없으면 탭할 수 없다
  guide?: string              // 문장을 고르는 중일 때 위에 띄우는 안내
  answer?: AnswerMarks        // 정답 근거 표시 (제출한 뒤에만)
}

function renderSentence(text: string, words: string[]) {
  if (words.length === 0) return text
  const pattern = new RegExp(`(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`)
  return text.split(pattern).map((part, i) =>
    words.includes(part)
      ? <span key={i} className="fog" aria-label="안개에 가려진 낱말">{FOG}</span>
      : part,
  )
}

/** 본문: 게임의 주인공. 언제나 또렷하게 보이고, 근거를 고를 때만 문장을 누를 수 있다 */
export default function PassagePanel({ title, sentences, fog, selected, onToggle, guide, answer }: Props) {
  const picking = Boolean(onToggle)
  return (
    <section className={`passage${picking ? ' is-picking' : ''}`} aria-label="본문">
      <header className="passage-head">
        <h2 className="passage-title">{title}</h2>
        {picking && guide && <p className="passage-guide" role="status">{guide}</p>}
      </header>
      <ol className="passage-list">
        {sentences.map((text, i) => {
          const words = fog.filter((f) => f.sentence === i).map((f) => f.word)
          const isSelected = selected.includes(i)
          const mark = answer?.must.includes(i) ? ' is-answer' : answer?.also.includes(i) ? ' is-also' : ''
          return (
            <li key={i}>
              <button type="button" className={`sentence${isSelected ? ' is-selected' : ''}${mark}`}
                aria-pressed={picking ? isSelected : undefined} disabled={!picking} onClick={() => onToggle?.(i)}>
                <span className="sentence-no">{i + 1}</span>
                <span className="sentence-text">{renderSentence(text, words)}</span>
                {mark && <span className="sr-only">{mark === ' is-answer' ? ' (정답 근거)' : ' (함께 골라도 되는 근거)'}</span>}
              </button>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
