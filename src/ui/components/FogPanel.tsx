import { FOG } from '../fog'
import './WordPanel.css'

interface Props {
  sentenceNo: number          // 가려진 낱말이 있는 문장 (화면 번호)
  picked: number | undefined  // 고른 문장 index
  onSubmit: (sentence: number) => void
  onCancel: () => void
}

/** 안개 걷기 (작업지시서 F3): 가려진 낱말의 뜻을 짐작하게 해 주는 문장 하나를 본문에서 고른다 */
export default function FogPanel({ sentenceNo, picked, onSubmit, onCancel }: Props) {
  return (
    <section className="wpanel" aria-label="안개 걷기">
      <h3>안개 걷기</h3>
      <p>{sentenceNo}번 문장의 ‘{FOG}’ 뜻을 짐작하게 해 주는 문장을 본문에서 하나 골라 봐.</p>
      <p className="wanswer">고른 문장: {picked !== undefined ? `${picked + 1}번` : '없음'}</p>
      <div className="row">
        <button type="button" onClick={onCancel}>취소</button>
        <button type="button" disabled={picked === undefined} onClick={() => picked !== undefined && onSubmit(picked)}>제출</button>
      </div>
    </section>
  )
}
