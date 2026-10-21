import { afterEach, describe, expect, it, vi } from 'vitest'
import { findWord, passages, starterDeck, towerFloors } from '../content'
import { clearRun, loadRecords, loadRun, saveRecords, saveRun } from '../storage/store'
import { newRun, reduceRun, type RunAction, type RunState } from './run'
import type { Action } from './state'

const floors = towerFloors('bee')
const run = (r: RunState, ...actions: RunAction[]) => actions.reduce((s, a) => reduceRun(s, a, floors), r)
const battle = (action: Action): RunAction => ({ type: 'battle', action })

/** 지금 층을 바로 이긴 상태로 (요약 봉인까지) */
function winFloor(r: RunState): RunState {
  let s = r
  const b = () => s.battle!
  const p = () => b().passage
  s = run(s, battle({ type: 'resolveFog', wordIndex: 0, sentence: p().lockedWords[0]!.clues[0]! }))
  for (let turn = 0; turn < 10 && b().outcome === 'playing'; turn++) {
    if (b().textCards.some((c) => c.kind === 'summary')) s = run(s, battle({ type: 'resolveSummary', pass: true, answer: '' }))
    for (const c of b().textCards.filter((x) => x.kind === 'question')) {
      const q = p().questions.find((x) => x.id === c.refId)!
      const ev = q.evidence
      const pick = [...ev.required[0]!]
      for (const i of [...ev.required.flat(), ...(ev.allowed ?? [])]) if (pick.length < ev.count && !pick.includes(i)) pick.push(i)
      s = run(s, battle({ type: 'resolveQuestion', questionId: q.id, option: q.answer, evidence: pick, confidence: 'sure' }))
    }
    if (b().outcome === 'playing') s = run(s, battle({ type: 'endTurn' }))
  }
  return s
}

describe('탑 흐름 (F7)', () => {
  it('소개 → 1층 전투', () => {
    const r = run(newRun('bee', starterDeck, 1), { type: 'startFloor' })
    expect(r).toMatchObject({ phase: 'battle', floor: 1 })
    expect(r.battle?.passage.id).toBe('bee-1')
  })
  it('이기면 보상: 안개 낱말이 덱에, 체력 +10(최대 넘지 않음), 다음 층', () => {
    const won = winFloor(run(newRun('bee', starterDeck, 1), { type: 'startFloor' }))
    expect(won.battle?.outcome).toBe('won')
    const hpAfter = won.battle!.player.hp
    const r = run(won, { type: 'finishFloor' })
    expect(r).toMatchObject({ phase: 'reward', floor: 2, hp: Math.min(40, hpAfter + 10) })
    expect(r.deck).toContain('bee-w1')
    expect(r.reward?.words).toEqual(['bee-w1'])
  })
  it('체력은 층 사이에 이어진다', () => {
    const r = run(winFloor(run(newRun('bee', starterDeck, 1), { type: 'startFloor' })), { type: 'finishFloor' }, { type: 'startFloor' })
    expect(r.battle?.passage.id).toBe('bee-2')
    expect(r.battle?.player.hp).toBe(r.hp)
    expect(r.battle!.drawPile.length + r.battle!.hand.length).toBe(starterDeck.length + 1)
  })
  it('3층을 이기면 탑 완료', () => {
    let r = run(newRun('bee', starterDeck, 3), { type: 'startFloor' })
    for (let f = 1; f <= 3; f++) {
      r = run(winFloor(r), { type: 'finishFloor' })
      if (f < 3) r = run(r, { type: 'startFloor' })
    }
    expect(r).toMatchObject({ phase: 'complete', battle: null })
    expect(r.deck).toEqual(expect.arrayContaining(['bee-w1', 'bee-w2', 'bee-w3']))
  })
  it('지면 그 층 시작 상태로 다시', () => {
    let r = run(newRun('bee', starterDeck, 1), { type: 'startFloor' })
    for (let i = 0; i < 20 && r.battle?.outcome === 'playing'; i++) r = run(r, battle({ type: 'endTurn' }))
    expect(r.battle?.outcome).toBe('lost')
    const again = run(r, { type: 'retryFloor' })
    expect(again.battle).toMatchObject({ outcome: 'playing', turn: 1, player: { hp: 40 } })
  })
  it('엉뚱한 때의 action은 무시', () => {
    const r = newRun('bee', starterDeck, 1)
    expect(run(r, { type: 'finishFloor' }, { type: 'retryFloor' }, battle({ type: 'endTurn' }))).toBe(r)
  })
})

describe('저장 (storage/store)', () => {
  afterEach(() => vi.unstubAllGlobals())
  const fake = () => {
    const m = new Map<string, string>()
    vi.stubGlobal('localStorage', { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => m.set(k, v), removeItem: (k: string) => m.delete(k) })
    return m
  }
  const find = (id: string) => passages.find((p) => p.id === id)

  it('저장하고 불러오면 같은 진행 (글은 id로 저장했다가 지금 데이터로 복원)', () => {
    const m = fake()
    const r = run(newRun('bee', starterDeck, 5), { type: 'startFloor' }, battle({ type: 'endTurn' }))
    saveRun(r)
    expect([...m.values()][0]).not.toContain(r.battle!.passage.sentences[0])
    expect(loadRun(find)).toEqual(r)
  })
  it('형식이 다르거나 깨진 저장, 저장소가 없으면 null (오류 없음)', () => {
    const m = fake()
    m.set('wordSpire.v2.run', '{"format":"0.0"}')
    expect(loadRun(find)).toBeNull()
    m.set('wordSpire.v2.run', '{깨짐')
    expect(loadRun(find)).toBeNull()
    clearRun()
    expect(loadRun(find)).toBeNull()
    vi.unstubAllGlobals()
    expect(() => saveRun(newRun('bee', starterDeck, 1))).not.toThrow()
  })
  it('기록·이름은 진행과 따로 저장되고, 깨지면 빈 기록', () => {
    const m = fake()
    const log = [{ area: 'word' as const, ref: 'h01', correct: true, helped: false, firstTry: true, scope: 's', at: 1 }]
    saveRecords({ name: '하늘', log })
    clearRun()
    expect(loadRecords()).toEqual({ name: '하늘', log })
    m.set('wordSpire.v2.records', '{깨짐')
    expect(loadRecords()).toEqual({ name: '', log: [] })
  })
  it('보상 낱말은 실제 낱말이다', () => {
    expect(findWord('bee-w1')?.word).toBe('위협')
  })
})
