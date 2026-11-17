import './Stamp.css'

/** 카드·패널의 종류. 부적패에 찍힌 낙관(도장) 한 글자로 알린다 */
export type CardKind = 'literal' | 'connect' | 'author' | 'fog' | 'rumor' | 'summary' | 'word'

export const CARD_KIND: Record<CardKind, { stamp: string; title: string; caption: string }> = {
  literal: { stamp: '찾', title: '거기 있음', caption: '글에서 찾기' },
  connect: { stamp: '잇', title: '연결', caption: '문장 잇기' },
  author: { stamp: '눈', title: '글쓴이와 나', caption: '생각 더하기' },
  fog: { stamp: '걷', title: '안개 걷기', caption: '보호막 깨기' },
  rumor: { stamp: '반', title: '헛소문 반박', caption: '소문 묶기' },
  summary: { stamp: '봉', title: '요약 봉인', caption: '마무리!' },
  word: { stamp: '막', title: '낱말 방어', caption: '뜻 맞히기' },
}

interface Props {
  kind: CardKind
  size?: 'sm' | 'md' | 'lg'
}

/** 종류를 알리는 도장. 글자는 장식이라 읽어 주지 않는다(옆에 이름이 따로 있다) */
export default function Stamp({ kind, size = 'md' }: Props) {
  return <span className={`stamp stamp-${kind} stamp-${size}`} aria-hidden="true">{CARD_KIND[kind].stamp}</span>
}
