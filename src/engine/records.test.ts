import { describe, expect, it } from 'vitest'
import { bee1 } from '../content/passages/bee-1'
import type { Question } from '../content/types'
import { STARTER_DECK_56 } from '../content/words/pack-5-6'
import { addRecords, judgementsFrom, type JudgeRecord } from './records'
import { createBattle, reduce, type Action, type GameState } from './state'
import { computeStats, judgement, weakest } from './stats'

const setup = () => createBattle({ passage: bee1, deck: STARTER_DECK_56, seed: 42, playerHp: 40, playerMaxHp: 40 })
const q = (id: string) => bee1.questions.find((x) => x.id === id) as Question
const answer = (id: string, ok: boolean, confidence: 'sure' | 'unsure' = 'sure'): Action => {
  const ev = q(id).evidence
  const picked = [...(ev.required[0] ?? [])]
  for (const i of [...ev.required.flat(), ...(ev.allowed ?? [])]) if (picked.length < ev.count && !picked.includes(i)) picked.push(i)
  return { type: 'resolveQuestion', questionId: id, option: ok ? q(id).answer : (q(id).answer + 1) % 4, evidence: picked, confidence }
}
const step = (s: GameState, a: Action) => {
  const next = reduce(s, a)
  return { next, items: judgementsFrom(s, a, next) }
}

describe('판정 기록', () => {
  it('질문은 영역·정타 여부·확신도를 남긴다', () => {
    const { items } = step(setup(), answer('q1', true, 'unsure'))
    expect(items).toEqual([{ area: 'literal', ref: 'q1', correct: true, confidence: 'unsure', helped: false }])
  })
  it('단서 보기를 쓰면 도움받음', () => {
    const s = reduce(setup(), { type: 'useHint', questionId: 'q1' })
    expect(step(s, answer('q1', true)).items[0]?.helped).toBe(true)
  })
  it('낱말 카드·요약도 기록, 안개 걷기·턴 끝은 기록하지 않음', () => {
    const s = setup()
    const uid = s.hand[0]!.uid
    expect(step(s, { type: 'resolveWordCard', uid, pass: false, answer: '' }).items)
      .toEqual([{ area: 'word', ref: s.hand[0]!.wordId, correct: false, helped: false }])
    expect(step(s, { type: 'resolveFog', wordIndex: 0, sentence: 0 }).items).toEqual([])
    expect(step(s, { type: 'endTurn' }).items).toEqual([])
  })
  it('생각력이 모자라 아무 일도 없으면 기록 없음', () => {
    const s = { ...setup(), think: 0 }
    expect(step(s, answer('q1', true)).items).toEqual([])
  })
  it('같은 묶음에서 두 번째로 푼 대상은 첫 시도가 아니다', () => {
    const j = { area: 'word' as const, ref: 'h01', correct: true, helped: false }
    let log = addRecords([], [j], 'a', 1)
    log = addRecords(log, [j], 'a', 2)
    log = addRecords(log, [j], 'b', 3)
    expect(log.map((r) => r.firstTry)).toEqual([true, false, true])
  })
})

const rec = (area: JudgeRecord['area'], correct: boolean, extra: Partial<JudgeRecord> = {}): JudgeRecord =>
  ({ area, ref: 'x', correct, helped: false, firstTry: true, scope: 's', at: 0, ...extra })

describe('스탯', () => {
  it('첫 시도·도움 없는 것만 정답률에, 도움받은 해결은 따로', () => {
    const s = computeStats([rec('word', true), rec('word', false), rec('word', true, { helped: true }), rec('word', true, { firstTry: false }), rec('word', true, { firstTry: false, helped: true })])
    expect(s.areas.word).toEqual({ correct: 1, total: 2, helped: 2 })
  })
  it('판단력은 확실·애매가 각각 5개 이상일 때만', () => {
    const many = (c: 'sure' | 'unsure', n: number, ok: number) =>
      Array.from({ length: n }, (_, i) => rec('connect', i < ok, { confidence: c }))
    expect(judgement(computeStats([...many('sure', 5, 4), ...many('unsure', 4, 1)]))).toBeNull()
    expect(judgement(computeStats([...many('sure', 5, 4), ...many('unsure', 5, 1)]))).toBeCloseTo(0.6)
  })
  it('약점: 표본 5개 넘는 영역이 둘 이상일 때 가장 낮은 곳. literal은 빼고', () => {
    const n = (area: JudgeRecord['area'], ok: number) => Array.from({ length: 5 }, (_, i) => rec(area, i < ok))
    expect(weakest(computeStats(n('word', 1)))).toBeNull()
    expect(weakest(computeStats([...n('word', 4), ...n('author', 2), ...n('literal', 0)]))).toBe('author')
  })
})
