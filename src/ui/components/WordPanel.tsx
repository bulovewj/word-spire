import type { WordEntry } from '../../content/types'

interface Props {
  entry: WordEntry
  onDone: (pass: boolean, answer: string) => void
  onCancel: () => void
}

/** 낱말 카드 (임시: 맞음/틀림 버튼. M5에서 채점기로 바꾼다) */
export default function WordPanel({ entry, onDone, onCancel }: Props) {
  return (
    <section className="wpanel" aria-label="낱말 카드">
      <h3>{entry.word}</h3>
      <p>이 말의 뜻을 내 말로 써 봐.</p>
      <div className="row">
        <button type="button" onClick={onCancel}>취소</button>
        <button type="button" onClick={() => onDone(false, '')}>틀림</button>
        <button type="button" onClick={() => onDone(true, '')}>맞음</button>
      </div>
    </section>
  )
}
