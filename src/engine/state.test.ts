import { describe, expect, it } from 'vitest'
import { bee1 } from '../content/passages/bee-1'
import { STARTER_DECK_56 } from '../content/words/pack-5-6'
import type { Passage, Question } from '../content/types'
import { createBattle, incomingDamage, reduce, type Action, type GameState } from './state'

const setup = (passage: Passage = bee1, deck: string[] = STARTER_DECK_56) =>
  createBattle({ passage, deck, wordUses: Object.fromEntries(deck.map((id) => [id, 2])), seed: 42, playerHp: 40, playerMaxHp: 40 })

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
  ({ type: 'resolveQuestion', questionId: id, option: q(id).answer, evidence: goodEvidence(id), confidence })
const wrong = (id: string, confidence: 'sure' | 'unsure' = 'sure'): QAction =>
  ({ type: 'resolveQuestion', questionId: id, option: (q(id).answer + 1) % 4, evidence: [0], confidence })
const run = (s: GameState, ...actions: Action[]) => actions.reduce(reduce, s)
const end: Action = { type: 'endTurn' }

describe('전투 시작', () => {
  it('생각력 3, 내 낱말 묶음 그대로, 글 카드 = 질문 3 + 안개 1', () => {
    const s = setup()
    expect(s).toMatchObject({ turn: 1, think: 3, outcome: 'playing' })
    expect(s.deck).toEqual(STARTER_DECK_56)
    expect(s.textCards.map((c) => c.kind)).toEqual(['question', 'question', 'question', 'fog'])
  })
  it('같은 시드면 같은 결과, 보기 순서는 4개 순열', () => {
    expect(setup()).toEqual(setup())
    for (const order of Object.values(setup().optionOrder)) expect([...order].sort()).toEqual([0, 1, 2, 3])
  })
  it('덱이 비어도 시작할 수 있다', () => {
    expect(setup(bee1, []).deck).toEqual([])
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
  it('관련 낱말을 붙이면 +4, 그 낱말 횟수가 1 깎인다', () => {
    const s = run(setup(bee1, ['h01']), { ...right('q3', 'unsure'), attachedWordId: 'h01' })
    expect(s.enemy.hp).toBe(40 - (14 + 4 - 2))
    expect(s.wordUses.h01).toBe(1)
  })
  it('관련 없거나, 묶음에 없거나, 횟수가 없거나, author가 아니면 붙지 않고 횟수도 그대로', () => {
    const s0 = setup(bee1, ['h02', 'h01'])
    const a = run(s0, { ...right('q3', 'unsure'), attachedWordId: 'h02' })
    expect(a.enemy.hp).toBe(40 - (14 - 2))
    expect(a.wordUses.h02).toBe(2)
    expect(run(s0, { ...right('q1', 'unsure'), attachedWordId: 'h01' }).wordUses.h01).toBe(2)
    expect(run(setup(bee1, ['h02']), { ...right('q3', 'unsure'), attachedWordId: 'h01' }).enemy.hp).toBe(40 - (14 - 2))
    const spent = { ...s0, wordUses: { ...s0.wordUses, h01: 0 } }
    expect(run(spent, { ...right('q3', 'unsure'), attachedWordId: 'h01' }).enemy.hp).toBe(40 - (14 - 2))
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
  it('낱말 뜻 통과 = 방어 5, 실패 = 방어 없음. 맞히든 틀리든 횟수 1 깎임', () => {
    const word = (wordId: string, pass: boolean): Action => ({ type: 'resolveWordCard', wordId, pass, answer: '' })
    const s = run(setup(), word('h01', true), word('h02', false))
    expect(s.player.block).toBe(5)
    expect([s.wordUses.h01, s.wordUses.h02]).toEqual([1, 1])
    expect(incomingDamage(s)).toBe(1)
    expect(run(s, end).player.hp).toBe(39)
  })
  it('횟수를 다 쓴 낱말·묶음에 없는 낱말은 쓸 수 없다', () => {
    const word = (wordId: string): Action => ({ type: 'resolveWordCard', wordId, pass: true, answer: '' })
    const s = run(setup(), word('h01'), word('h01'))
    expect(s.wordUses.h01).toBe(0)
    expect(run(s, word('h01'))).toBe(s)
    expect(run(s, word('bee-w1'))).toBe(s)
  })
  it('새 턴: 생각력 3, 방어 0, 낱말 횟수는 이어진다', () => {
    const s = run(setup(), { type: 'resolveWordCard', wordId: 'h01', pass: true, answer: '' }, end)
    expect(s).toMatchObject({ turn: 2, think: 3, player: { block: 0 } })
    expect(s.wordUses.h01).toBe(1)
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

describe('질문을 다 썼을 때', () => {
  it('틀린 질문이 있어도 다시 풀지 않고 요약 봉인만 열린다', () => {
    const s = run(setup(), right('q1'), wrong('q2', 'unsure'), end, wrong('q3', 'unsure'))
    expect(s.textCards.map((c) => c.kind)).toEqual(['fog', 'summary'])
  })
  it('다 맞혔는데 피해가 모자라도 질문을 다 쓰면 요약 봉인이 열린다', () => {
    const boss = { ...bee1, enemy: { ...bee1.enemy, maxHp: 55 } }
    const s = run(setup(boss), right('q1', 'unsure'), right('q2', 'unsure'), end, right('q3', 'unsure'))
    expect(s.enemy.hp).toBe(55 - 24)
    expect(s.textCards.map((c) => c.kind)).toEqual(['fog', 'summary'])
  })
})
