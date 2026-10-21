import { describe, expect, it } from 'vitest'
import { bee1 } from '../content/passages/bee-1'
import { STARTER_DECK_56 } from '../content/words/pack-5-6'
import { createBattle, reduce, type Action, type GameState } from './state'

const setup = () => createBattle({ passage: bee1, deck: STARTER_DECK_56, wordUses: {}, seed: 7, playerHp: 40, playerMaxHp: 40 })
const run = (s: GameState, ...actions: Action[]) => actions.reduce(reduce, s)
const fog = (sentence: number): Action => ({ type: 'resolveFog', wordIndex: 0, sentence })
const hint = (questionId: string): Action => ({ type: 'useHint', questionId })
const end: Action = { type: 'endTurn' }
const q1Hit: Action = { type: 'resolveQuestion', questionId: 'q1', option: 0, evidence: [3], confidence: 'unsure' }
const q1Wrong: Action = { type: 'resolveQuestion', questionId: 'q1', option: 1, evidence: [3], confidence: 'unsure' }

describe('안개 걷기 (F3)', () => {
  it('단서 문장을 고르면 안개가 걷히고 낱말 카드가 예약된다 (생각력 1)', () => {
    const s = run(setup(), fog(2))
    expect(s).toMatchObject({ think: 2, fogCleared: [0], reservedWords: ['bee-w1'] })
    expect(s.textCards.some((c) => c.kind === 'fog')).toBe(false)
    expect(s.events).toEqual([{ kind: 'fog', pass: true, wordId: 'bee-w1' }])
  })
  it('다른 단서 문장도 성공 (하나만 골라도 된다)', () => {
    expect(run(setup(), fog(1)).fogCleared).toEqual([0])
  })
  it('틀리면 카드 실패: 이번 턴 잠기고 다음 턴에 다시 할 수 있다', () => {
    const s = run(setup(), fog(4))
    expect(s.fogCleared).toEqual([])
    expect(s.textCards.find((c) => c.kind === 'fog')?.lockedThisTurn).toBe(true)
    expect(run(s, fog(2))).toBe(s)
    expect(run(s, end, fog(2)).fogCleared).toEqual([0])
  })
  it('안개 걷기 전후로 질문 피해가 2 차이 난다 (보호막)', () => {
    const before = run(setup(), q1Hit)
    const after = run(setup(), fog(2), q1Hit)
    expect((40 - after.enemy.hp) - (40 - before.enemy.hp)).toBe(2)
  })
})

describe('단서 보기', () => {
  it('생각력 1로 틀린 보기 하나를 지운다', () => {
    const s = run(setup(), hint('q1'))
    expect(s.think).toBe(2)
    expect(s.hints.q1).toBeDefined()
    expect(s.hints.q1).not.toBe(bee1.questions[0]!.answer)
  })
  it('질문당 1번', () => {
    const s = run(setup(), hint('q1'))
    expect(run(s, hint('q1'))).toBe(s)
  })
  it('질문을 낼 생각력이 남아 있어야 쓸 수 있다', () => {
    const s = run(setup(), hint('q2'))       // 생각력 3 = 단서 1 + 연결 2 → 쓸 수 있다
    expect(s.think).toBe(2)
    const low = run(setup(), q1Hit, hint('q2'))   // 남은 2로는 단서 1 + 연결 2 불가
    expect(low.hints.q2).toBeUndefined()
  })
  it('애매로 틀린 뒤 다음 단서 보기 한 번은 공짜', () => {
    const s = run(setup(), q1Wrong)
    expect(s.freeHint).toBe(true)
    const h = run(s, hint('q2'))
    expect(h).toMatchObject({ think: s.think, freeHint: false })
    expect(h.events).toEqual([{ kind: 'hint', questionId: 'q2', free: true }])
  })
  it('같은 시드면 같은 보기를 지운다', () => {
    expect(run(setup(), hint('q3')).hints).toEqual(run(setup(), hint('q3')).hints)
  })
})
