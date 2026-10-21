import { BALANCE } from '../../engine/balance'
import type { GameState } from '../../engine/state'
import type { HandCard } from '../components/Hand'
import { activeFogWords, maskFog } from '../fog'

/** 손패나 낱말 묶음에서 고른 것. 활성 패널이 무엇을 열지 정한다 */
export type PanelTarget =
  | { kind: 'question'; id: string }
  | { kind: 'word'; wordId: string }
  | { kind: 'fog'; index: number }
  | { kind: 'summary' }

export const TYPE_LABEL = { literal: '거기 있음', connect: '연결', author: '글쓴이와 나' } as const

export function buildHandCards(s: GameState): HandCard[] {
  const fog = activeFogWords(s)
  const text = s.textCards.map((c): HandCard => {
    if (c.kind === 'question') {
      const q = s.passage.questions.find((x) => x.id === c.refId)
      const cost = q ? BALANCE.questionCost[q.type] : 0
      return {
        key: `q-${c.refId}`, kind: 'question', cost, target: { kind: 'question', id: c.refId },
        title: `질문: ${q ? TYPE_LABEL[q.type] : ''}`, sub: maskFog(q?.prompt ?? '', fog),
        disabled: s.think < cost || c.lockedThisTurn,
      }
    }
    if (c.kind === 'fog') {
      return {
        key: `f-${c.refId}`, kind: 'fog', cost: BALANCE.fogCost, target: { kind: 'fog', index: Number(c.refId) },
        title: '안개 걷기', sub: '가려진 낱말의 단서 찾기', disabled: s.think < BALANCE.fogCost || c.lockedThisTurn,
      }
    }
    return {
      key: 'summary', kind: 'summary', cost: BALANCE.summaryCost, target: { kind: 'summary' },
      title: '요약 봉인', sub: '한 문장으로 요약해 마무리', disabled: s.think < BALANCE.summaryCost || c.lockedThisTurn,
    }
  })
  return text
}
