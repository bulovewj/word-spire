import { describe, expect, it } from 'vitest'
import { bee1 } from '../content/passages/bee-1'
import { STARTER_DECK_56 } from '../content/words/pack-5-6'
import type { Passage, Question } from '../content/types'
import { createBattle, incomingDamage, reduce, type Action, type GameState } from './state'

const setup = (passage: Passage = bee1, deck: string[] = STARTER_DECK_56) =>
  createBattle({ passage, deck, seed: 42, playerHp: 40, playerMaxHp: 40 })

const q = (id: string) => bee1.questions.find((x) => x.id === id) as Question
type QAction = Extract<Action, { type: 'resolveQuestion' }>
/** 정답 근거 한 벌: 첫 필수 묶음 + 관련 문장으로 count개 채우기 */
const goodEvidence = (id: string) => {
  const ev = q(id).evidence
  const picked = [...(ev.required[0] ?? [])]
  for (const i of [...ev.required.flat(), ...(ev.allowed ?? [])]) if (picked.length < ev.count && !picked.includes(i)) picked.push(i)
  return picked
}
const right = (id: string, confidence: 'sure' | 'unsure' = 'sure'): QAction =>
  ({ type: 'resolveQuestion', questionId: id, option: q(id).answer, evidence: goodEvidence(id), confidence, usedHint: false })
const wrong = (id: string, confidence: 'sure' | 'unsure' = 'sure'): QAction =>
  ({ type: 'resolveQuestion', questionId: id, option: (q(id).answer + 1) % 4, evidence: [0], confidence, usedHint: false })
const run = (s: GameState, ...actions: Action[]) => actions.reduce(reduce, s)
const end: Action = { type: 'endTurn' }

describe('전투 시작', () => {
  it('생각력 3, 낱말 카드 2장, 글 카드 = 질문 3 + 안개 1', () => {
    const s = setup()
    expect(s).toMatchObject({ turn: 1, think: 3, outcome: 'playing' })
    expect(s.hand).toHaveLength(2)
    expect(s.drawPile).toHaveLength(4)
    expect(s.textCards.map((c) => c.kind)).toEqual(['question', 'question', 'question', 'fog'])
  })
  it('같은 시드면 같은 결과, 보기 순서는 4개 순열', () => {
    expect(setup()).toEqual(setup())
    for (const order of Object.values(setup().optionOrder)) expect([...order].sort()).toEqual([0, 1, 2, 3])
  })
  it('덱이 비어도 시작할 수 있다', () => {
    expect(setup(bee1, []).hand).toEqual([])
  })
})

describe('질문 카드', () => {
  it('생각력이 모자라면 낼 수 없다', () => {
    const s = run(setup(), right('q1'), right('q2'))
    expect(s.think).toBe(0)
    expect(run(s, right('q3'))).toBe(s)
  })
  it('다 맞히면 요약 전 적 체력 1에서 멈추고 요약 봉인이 열린다', () => {
    const s = run(setup(), right('q1'), right('q2'), end, right('q3'))
    expect(s.enemy.hp).toBe(1)   // 7 + 13 + 19 (보호막 -2씩)
    expect(s.textCards.some((c) => c.kind === 'summary')).toBe(true)
    expect(s.outcome).toBe('playing')
  })
  it('질문 피해로는 체력 1 밑으로 안 내려간다', () => {
    const weak = { ...bee1, enemy: { ...bee1.enemy, maxHp: 10 } }
    expect(run(setup(weak), right('q1'), right('q2')).enemy.hp).toBe(1)
  })
  it('관련 낱말 카드를 붙이면 +4, 붙인 카드는 버린 더미로', () => {
    const s0 = setup(bee1, ['h01', 'h01'])
    const uid = s0.hand[0]!.uid
    const s = run(s0, { ...right('q3', 'unsure'), attachedWordUid: uid })
    expect(s.enemy.hp).toBe(40 - (14 + 4 - 2))
    expect(s.hand.map((w) => w.uid)).not.toContain(uid)
    expect(s.discardPile.map((w) => w.uid)).toContain(uid)
  })
  it('관련 없는 낱말 카드나 author가 아닌 질문에는 붙지 않고 손패에 남는다', () => {
    const s0 = setup(bee1, ['h02', 'h01'])
    const unrelated = s0.hand.find((w) => w.wordId === 'h02')!.uid
    const related = s0.hand.find((w) => w.wordId === 'h01')!.uid
    const a = run(s0, { ...right('q3', 'unsure'), attachedWordUid: unrelated })
    expect(a.enemy.hp).toBe(40 - (14 - 2))
    expect(a.hand.map((w) => w.uid)).toContain(unrelated)
    const b = run(s0, { ...right('q1', 'unsure'), attachedWordUid: related })
    expect(b.hand.map((w) => w.uid)).toContain(related)
  })
})

describe('턴 끝과 적', () => {
  it('확실로 틀리면 다음 공격 +3, 한 번만', () => {
    const s = run(setup(), wrong('q1'))
    expect(incomingDamage(s)).toBe(9)
    const t2 = run(s, end)
    expect(t2.player.hp).toBe(31)
    expect(incomingDamage(t2)).toBe(8)
  })
  it('낱말 카드 통과 = 방어 5, 실패 = 방어 없음. 둘 다 버린 더미로', () => {
    const s0 = setup()
    const a = s0.hand[0]!
    const b = s0.hand[1]!
    const s = run(s0, { type: 'resolveWordCard', uid: a.uid, pass: true, answer: '' }, { type: 'resolveWordCard', uid: b.uid, pass: false, answer: '' })
    expect(s.player.block).toBe(5)
    expect(s.discardPile).toHaveLength(2)
    expect(incomingDamage(s)).toBe(1)
    expect(run(s, end).player.hp).toBe(39)
  })
  it('새 턴: 생각력 3, 방어 0, 남은 낱말 카드는 버리고 2장 새로', () => {
    const s = run(setup(), end)
    expect(s).toMatchObject({ turn: 2, think: 3, player: { block: 0 } })
    expect(s.hand).toHaveLength(2)
    expect(s.discardPile).toHaveLength(2)
  })
  it('뽑을 더미가 비면 버린 더미를 섞어 다시 뽑는다', () => {
    const s = run(setup(), end, end, end)
    expect(s.hand).toHaveLength(2)
    expect(s.hand.length + s.drawPile.length + s.discardPile.length).toBe(6)
  })
  it('계속 틀리면 진다', () => {
    let s = setup()
    for (let i = 0; i < 20 && s.outcome === 'playing'; i++) s = run(s, end)
    expect(s.outcome).toBe('lost')
    expect(s.player.hp).toBe(0)
    expect(run(s, end)).toBe(s)
  })
})

describe('요약 봉인', () => {
  const opened = () => run(setup(), right('q1'), right('q2'), end, right('q3'), end)   // 적 체력 1, 요약 열림, 3턴 시작
  const summary = (pass: boolean): Action => ({ type: 'resolveSummary', pass, answer: '' })

  it('통과하면 적을 봉인하고 이긴다', () => {
    const s = run(opened(), summary(true))
    expect(s).toMatchObject({ outcome: 'won', think: 1, enemy: { hp: 0 } })
    expect(s.events).toEqual([{ kind: 'summary', pass: true }])
    expect(run(s, end)).toBe(s)
  })
  it('실패하면 이번 턴 동안 잠기고 다음 턴에 다시 낼 수 있다', () => {
    const s = run(opened(), summary(false))
    expect(s.textCards.find((c) => c.kind === 'summary')?.lockedThisTurn).toBe(true)
    expect(run(s, summary(true))).toBe(s)
    expect(run(s, end, summary(true)).outcome).toBe('won')
  })
  it('요약 봉인이 열리기 전에는 낼 수 없다', () => {
    const s = setup()
    expect(run(s, summary(true))).toBe(s)
  })
  it('요약 없이는 이길 수 없다: 질문을 다 맞혀도 적 체력 1', () => {
    expect(opened()).toMatchObject({ outcome: 'playing', enemy: { hp: 1 } })
  })
})

describe('다시 보기', () => {
  it('질문을 다 썼는데 요약이 안 열리면 약타·실패 질문이 다시 보기로 돌아온다', () => {
    const s = run(setup(), right('q1'), wrong('q2', 'unsure'), end, wrong('q3', 'unsure'))
    const back = s.textCards.filter((c) => c.kind === 'question')
    expect(back.map((c) => [c.refId, c.retry])).toEqual([['q2', true], ['q3', true]])
    expect(s.textCards.some((c) => c.kind === 'summary')).toBe(true)
  })
  it('다 맞혔는데 피해가 모자라도 질문을 다 쓰면 요약 봉인이 열린다 (다시 보기는 없음)', () => {
    const boss = { ...bee1, enemy: { ...bee1.enemy, maxHp: 55 } }
    const s = run(setup(boss), right('q1', 'unsure'), right('q2', 'unsure'), end, right('q3', 'unsure'))
    expect(s.enemy.hp).toBe(55 - 24)
    expect(s.textCards.map((c) => c.kind)).toEqual(['fog', 'summary'])
  })
  it('다시 보기 피해는 절반', () => {
    const s = run(setup(), wrong('q1', 'unsure'), wrong('q2', 'unsure'), end, wrong('q3', 'unsure'))
    const hp = s.enemy.hp
    expect(run(s, right('q1', 'unsure')).enemy.hp).toBe(hp - (3 - 2))
  })
})
