import { BALANCE } from '../../engine/balance'
import { wordBlock } from '../../engine/defend'
import { canUseWord, type GameState } from '../../engine/state'
import type { CardKind } from '../components/Stamp'
import { activeFogWords, maskFog } from '../fog'

/** 손패에서 고른 것. 어떤 패널을 열지 정한다 */
export type PanelTarget =
  | { kind: 'question'; id: string }
  | { kind: 'pouch' }                    // 낱말 방어: 어떤 낱말로 막을지 고르기
  | { kind: 'word'; wordId: string }
  | { kind: 'fog'; index: number }
  | { kind: 'summary' }
  | { kind: 'rumor' }

export interface HandCard {
  key: string
  kind: CardKind
  cost: number
  power: string               // 카드가 하는 일을 숫자로: '공격 6', '방어 +5~8'
  detail: string              // 읽어 주는 설명 (질문이면 질문 글)
  note?: string               // 지금 못 내는 까닭
  glow: boolean               // 요약 봉인: 반짝여 알린다
  disabled: boolean
  target: PanelTarget
}

/** 생각력이 모자라거나 이번 턴에 잠긴 카드 */
function blocked(s: GameState, cost: number, locked: boolean): Pick<HandCard, 'disabled' | 'note'> {
  if (locked) return { disabled: true, note: '다음 턴에' }
  if (s.think < cost) return { disabled: true, note: '생각력 부족' }
  return { disabled: false }
}

/** 지금 손패: 글 카드(질문·안개·헛소문·요약) + 낱말 방어 */
export function buildHandCards(s: GameState): HandCard[] {
  const fog = activeFogWords(s)
  const cards = s.textCards.map((c): HandCard => {
    if (c.kind === 'question') {
      const q = s.passage.questions.find((x) => x.id === c.refId)
      const type = q?.type ?? 'literal'
      const cost = BALANCE.questionCost[type]
      return {
        key: `q-${c.refId}`, kind: type, cost, power: `공격 ${BALANCE.questionDamage[type]}`, glow: false,
        detail: maskFog(q?.prompt ?? '', fog), target: { kind: 'question', id: c.refId }, ...blocked(s, cost, c.lockedThisTurn),
      }
    }
    if (c.kind === 'fog') {
      return {
        key: `f-${c.refId}`, kind: 'fog', cost: BALANCE.fogCost, power: '낱말 얻기', glow: false,
        detail: '가려진 낱말의 단서 문장 찾기', target: { kind: 'fog', index: Number(c.refId) }, ...blocked(s, BALANCE.fogCost, c.lockedThisTurn),
      }
    }
    if (c.kind === 'rumor') {
      return {
        key: 'rumor', kind: 'rumor', cost: BALANCE.rumorCost, power: `공격 ${BALANCE.rumorDamage}`, glow: false,
        detail: '근거를 찾아 요괴의 소문을 반박하기', target: { kind: 'rumor' }, ...blocked(s, BALANCE.rumorCost, c.lockedThisTurn),
      }
    }
    return {
      key: 'summary', kind: 'summary', cost: BALANCE.summaryCost, power: '봉인!', glow: !c.lockedThisTurn,
      detail: '글을 한 문장으로 요약해 요괴를 봉인하기', target: { kind: 'summary' }, ...blocked(s, BALANCE.summaryCost, c.lockedThisTurn),
    }
  })
  const usable = s.deck.filter((id) => canUseWord(s, id)).length
  const guard: HandCard = {
    key: 'word', kind: 'word', cost: BALANCE.wordCardCost, glow: false,
    power: `방어 +${wordBlock(s, 'pick')}~${wordBlock(s, 'write')}`,
    detail: `내 낱말의 뜻을 맞혀 공격 막기 (쓸 수 있는 낱말 ${usable}개)`, target: { kind: 'pouch' },
    ...(usable === 0 ? { disabled: true, note: '낱말을 다 썼어' } : blocked(s, BALANCE.wordCardCost, false)),
  }
  return [...cards, guard]
}
