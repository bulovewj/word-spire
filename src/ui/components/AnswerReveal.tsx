import type { Question } from '../../content/types'
import type { Grade } from '../../engine/judge'
import { evidenceText } from '../answerText'
import { maskFog } from '../fog'

const MARKS = ['①', '②', '③', '④']

interface Props {
  question: Question
  grade: Grade
  order: number[]       // 보기 표시 순서 (학생이 본 번호로 알려 준다)
  fogWords: string[]
}

/** 약타·실패 뒤 바로 보여 주는 정답과 근거 (틀린 질문은 다시 풀지 않는다) */
export default function AnswerReveal({ question, grade, order, fogWords }: Props) {
  const pos = order.indexOf(question.answer)
  return (
    <div className="reveal" role="note">
      <p className="reveal-head">{grade === 'weak' ? '답은 맞았어. 근거는 이렇게 찾아:' : '정답은 이거야:'}</p>
      {grade === 'miss' && (
        <p>{MARKS[pos] ?? ''} {maskFog(question.options[question.answer] ?? '', fogWords)}</p>
      )}
      <p>근거 문장: <strong>{evidenceText(question.evidence)}</strong></p>
    </div>
  )
}
