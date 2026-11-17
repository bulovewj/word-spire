import { describe, expect, it } from 'vitest'
import { bee1 } from '../../content/passages/bee-1'
import { createBattle, reduce, type GameState } from '../../engine/state'
import { soundFor } from '../sfx'
import { summaryFrame } from '../summaryFrame'
import { battleFx } from './battleFx'
import { buildHandCards } from './handCards'

const setup = (): GameState => createBattle({ passage: bee1, deck: ['h01'], wordUses: { h01: 2 }, seed: 1, playerHp: 30, playerMaxHp: 30 })

describe('전투 연출 (사건 → 숫자·한마디·소리)', () => {
  it('정타: 요괴 쪽에 피해 숫자, 요괴가 한마디, 요괴가 번쩍', () => {
    const s = reduce(setup(), { type: 'resolveQuestion', questionId: 'q1', option: 0, evidence: [3], confidence: 'unsure' })
    const fx = battleFx(s)
    expect(fx.floats).toEqual([{ side: 'enemy', text: '정타! -4', tone: 'hit' }])
    expect(fx.line).toBeTruthy()
    expect(fx.flash).toBe('enemy')
    expect(soundFor(s.events, s.outcome)).toBe('hit')
  })
  it('턴 끝 공격: 받으면 내가 번쩍·흔들림, 다 막으면 "막았어!"', () => {
    const hurt = battleFx(reduce(setup(), { type: 'endTurn' }))
    expect(hurt).toMatchObject({ shake: true, flash: 'player', floats: [{ side: 'player', text: '-6', tone: 'hurt' }] })
    const blocked = reduce(reduce(setup(), { type: 'resolveWordCard', wordId: 'h01', pass: true, answer: '' }), { type: 'endTurn' })
    expect(battleFx(blocked).floats).toEqual([{ side: 'player', text: '막았어!', tone: 'block' }])
    expect(soundFor(blocked.events, blocked.outcome)).toBe('block')
  })
  it('아무 일도 없으면 조용하다', () => {
    expect(battleFx(setup())).toEqual({ floats: [], line: undefined, shake: false, flash: undefined })
  })
})

describe('손패', () => {
  it('글 카드 뒤에 낱말 방어 카드가 붙고, 생각력이 모자라면 못 낸다', () => {
    const cards = buildHandCards(setup())
    expect(cards.map((c) => c.kind)).toEqual(['literal', 'connect', 'author', 'fog', 'word'])
    expect(cards.every((c) => !c.disabled)).toBe(true)
    const low = buildHandCards({ ...setup(), think: 1 })
    expect(low.filter((c) => c.disabled).map((c) => [c.kind, c.note])).toEqual([['connect', '생각력 부족'], ['author', '생각력 부족']])
  })
  it('쓸 낱말이 없으면 방어 카드는 꺼진다', () => {
    const card = buildHandCards({ ...setup(), wordUses: { h01: 0 } }).find((c) => c.kind === 'word')
    expect(card).toMatchObject({ disabled: true, note: '낱말을 다 썼어' })
  })
})

describe('요약 틀', () => {
  it('모범 요약에서 핵심 개념 낱말을 묶음마다 하나씩 비운다', () => {
    expect(summaryFrame(bee1.summary)).toBe('○○이 ○○들면 ○○ 덕분에 자라는 과일과 채소도 ○○ 사람의 ○○이 위협받는다.')
  })
})
