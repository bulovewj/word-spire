import type { Area } from '../engine/records'

/** 스탯·교사 화면에 보이는 영역 4줄 (기획안 8장). literal은 기록만 하고 보이지 않는다 */
export const AREA_ROWS: { area: Area; label: string; hint: string }[] = [
  { area: 'word', label: '낱말 베기', hint: '낱말 뜻' },
  { area: 'connect', label: '연결 사슬', hint: '연결 질문' },
  { area: 'author', label: '추리의 눈', hint: '글쓴이와 나' },
  { area: 'summary', label: '요약 봉인', hint: '한 문장 요약' },
]

export const pct = (x: number) => `${Math.round(x * 100)}%`
