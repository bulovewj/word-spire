import { afterEach, describe, expect, it, vi } from 'vitest'
import { findWord, passages, rewardWordPool, starterDeck, towerFloors } from '../content'
import { clearRun, loadName, loadRecords, loadRun, saveName, saveRecords, saveRun } from '../storage/store'
import { BALANCE } from './balance'
import { newRun, reduceRun, runStars, type RunAction, type RunContext, type RunState } from './run'
import { nextEnemyAttack, type Action } from './state'

const ctx: RunContext = { floors: towerFloors('bee'), wordPool: rewardWordPool }
const run = (r: RunState, ...actions: RunAction[]) => actions.reduce((s, a) => reduceRun(s, a, ctx), r)
const pick: RunAction = { type: 'chooseReward', index: 0 }
const battle = (action: Action): RunAction => ({ type: 'battle', action })

/** 지금 층을 이긴 상태로: 질문을 모두 정타로 낸 뒤 요약 봉인, 남는 생각력은 낱말 방어 */
function winFloor(r: RunState): RunState {
  let s = r
  const b = () => s.battle!
  const p = () => b().passage
  s = run(s, battle({ type: 'resolveFog', wordIndex: 0, sentence: p().lockedWords[0]!.clues[0]! }))
  for (let turn = 0; turn < 10 && b().outcome === 'playing'; turn++) {
    if (!b().textCards.some((c) => c.kind === 'question')) s = run(s, battle({ type: 'resolveSummary', pass: true, answer: '' }))
    for (const c of b().textCards.filter((x) => x.kind === 'question')) {
      const q = p().questions.find((x) => x.id === c.refId)!
      const ev = q.evidence
      const pick = [...ev.required[0]!]
      for (const i of [...ev.required.flat(), ...(ev.allowed ?? [])]) if (pick.length < ev.count && !pick.includes(i)) pick.push(i)
      s = run(s, battle({ type: 'resolveQuestion', questionId: q.id, option: q.answer, evidence: pick, confidence: 'sure' }))
    }
    // 남은 생각력으로 낱말 방어 (방어 없이는 3층에서 진다)
    for (const id of b().deck) if (b().think > 0 && (b().wordUses[id] ?? 0) > 0) s = run(s, battle({ type: 'resolveWordCard', wordId: id, pass: true, answer: '' }))
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
  it('이기면 보상: 안개 낱말이 덱에, 다음 층으로', () => {
    const won = winFloor(run(newRun('bee', starterDeck, 1), { type: 'startFloor' }))
    expect(won.battle?.outcome).toBe('won')
    const r = run(won, { type: 'finishFloor' })
    expect(r).toMatchObject({ phase: 'reward', floor: 2, hp: won.battle!.player.hp })
    expect(r.deck).toContain('bee-w1')
    expect(r.reward?.words).toEqual(['bee-w1'])
  })
  it('층을 봉인하면 다음 층은 체력이 가득 찬 채로 시작한다', () => {
    let r = run(newRun('bee', starterDeck, 1), { type: 'startFloor' })
    r = run(r, battle({ type: 'endTurn' }))   // 한 대 맞고
    expect(r.battle!.player.hp).toBeLessThan(BALANCE.playerMaxHp)
    r = run(winFloor(r), { type: 'finishFloor' }, pick, { type: 'startFloor' })
    expect(r.battle?.passage.id).toBe('bee-2')
    expect(r.battle?.player.hp).toBe(r.maxHp)
    expect(r.battle!.deck.length).toBeGreaterThanOrEqual(starterDeck.length + 1)
  })
  it('보상 고르기: 보물 2개 + 새 낱말 1장 중 하나. 고르기 전에는 다음 층으로 못 간다', () => {
    const r = run(winFloor(run(newRun('bee', starterDeck, 1), { type: 'startFloor' })), { type: 'finishFloor' })
    const offers = r.reward!.offers
    expect(offers.map((o) => o.kind)).toEqual(['boon', 'boon', 'word'])
    expect(run(r, { type: 'startFloor' })).toBe(r)
    const word = offers.findIndex((o) => o.kind === 'word')
    const got = run(r, { type: 'chooseReward', index: word })
    expect(got.deck).toContain(offers[word]!.id)
    expect(got.wordUses[offers[word]!.id]).toBe(BALANCE.wordUsesPerTower)
    expect(run(got, pick)).toBe(got)   // 한 번만 고른다
    const boon = run(r, pick)
    expect(boon.boons).toEqual([offers[0]!.id])
    expect(run(boon, { type: 'startFloor' }).battle?.boons).toEqual(boon.boons)
  })
  it('약수 호리병을 고르면 최대 체력이 늘고, 다음 층을 그만큼 가득 채워 시작한다', () => {
    const r = run(winFloor(run(newRun('bee', starterDeck, 1), { type: 'startFloor' })), { type: 'finishFloor' })
    const withGourd = { ...r, reward: { ...r.reward!, offers: [{ kind: 'boon' as const, id: 'gourd' as const }] } }
    const next = run(withGourd, pick, { type: 'startFloor' })
    expect(next.maxHp).toBe(BALANCE.playerMaxHp + BALANCE.boon.gourdMaxHp)
    expect(next.battle?.player).toMatchObject({ hp: next.maxHp, maxHp: next.maxHp })
  })
  it('층 결과: 다 맞히고 체력을 지키면 별 3개, 연속 정타는 다음 층으로 이어진다', () => {
    const won = winFloor(run(newRun('bee', starterDeck, 1), { type: 'startFloor' }))
    const r = run(won, { type: 'finishFloor' })
    expect(r.results).toHaveLength(1)
    expect(r.results[0]).toMatchObject({ passageId: 'bee-1', stars: 3, checks: { sealed: true, allHits: true, healthy: true } })
    expect(runStars(r)).toBe(3)
    expect(r.combo).toBe(won.battle!.combo)
    expect(run(r, pick, { type: 'startFloor' }).battle?.combo).toBe(r.combo)
  })
  it('낱말 횟수는 탑 안에서 이어지고, 새로 얻은 낱말은 가득 찬 채로', () => {
    const fresh = run(newRun('bee', starterDeck, 1), { type: 'startFloor' })
    const used = run(fresh, battle({ type: 'resolveWordCard', wordId: starterDeck[0]!, pass: true, answer: '' }))
    expect(used.battle!.wordUses[starterDeck[0]!]).toBe(BALANCE.wordUsesPerTower - 1)
    const won = winFloor(used)
    const r = run(won, { type: 'finishFloor' })
    expect(r.wordUses[starterDeck[0]!]).toBe(won.battle!.wordUses[starterDeck[0]!])
    expect(r.wordUses['bee-w1']).toBe(BALANCE.wordUsesPerTower)
    const next = run(r, pick, { type: 'startFloor' })
    expect(next.battle!.wordUses).toEqual(next.wordUses)
  })
  it('3층을 이기면 탑 완료', () => {
    let r = run(newRun('bee', starterDeck, 3), { type: 'startFloor' })
    for (let f = 1; f <= 3; f++) {
      r = run(winFloor(r), { type: 'finishFloor' })
      if (f < 3) r = run(r, pick, { type: 'startFloor' })
    }
    expect(r).toMatchObject({ phase: 'complete', battle: null })
    expect(r.deck).toEqual(expect.arrayContaining(['bee-w1', 'bee-w2', 'bee-w3']))
    expect(r.results.map((x) => x.passageId)).toEqual(['bee-1', 'bee-2', 'bee-3'])
    expect(r.reward?.offers).toEqual([])   // 마지막 층은 고를 보상이 없다
  })
  it('지면 그 층 시작 상태로 다시', () => {
    let r = run(newRun('bee', starterDeck, 1), { type: 'startFloor' })
    for (let i = 0; i < 20 && r.battle?.outcome === 'playing'; i++) r = run(r, battle({ type: 'endTurn' }))
    expect(r.battle?.outcome).toBe('lost')
    const again = run(r, { type: 'retryFloor' })
    expect(again.battle).toMatchObject({ outcome: 'playing', turn: 1, player: { hp: BALANCE.playerMaxHp }, wordUses: r.floorStart.wordUses })
    expect(again.retries).toBe(1)
  })
  it('다시 할 때마다 요괴가 지쳐 공격이 1씩 약해진다 (3까지)', () => {
    const lose = (r: RunState) => {
      let s = r
      for (let i = 0; i < 20 && s.battle?.outcome === 'playing'; i++) s = run(s, battle({ type: 'endTurn' }))
      return s
    }
    let r = run(newRun('bee', starterDeck, 1), { type: 'startFloor' })
    const first = nextEnemyAttack(r.battle!)
    for (let n = 1; n <= 5; n++) {
      r = run(lose(r), { type: 'retryFloor' })
      expect(nextEnemyAttack(r.battle!)).toBe(first - Math.min(n, BALANCE.retryEaseMax))
    }
    // 그 층을 봉인하고 다음 층으로 가면 다시 제 힘
    const up = run(winFloor(r), { type: 'finishFloor' }, pick, { type: 'startFloor' })
    expect(up.battle?.enemy.ease).toBe(0)
    expect(up.retries).toBe(0)
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
    saveRecords([...log, { ...log[0]!, area: 'nope' as 'word' }])
    saveName('하늘')
    clearRun()
    expect(loadRecords()).toEqual(log)   // 모양이 틀린 줄은 버림
    expect(loadName()).toBe('하늘')
    m.set('wordSpire.v2.records', '{깨짐')
    expect(loadRecords()).toEqual([])
  })
  it('보상 낱말은 실제 낱말이다', () => {
    expect(findWord('bee-w1')?.word).toBe('위협')
  })
})
