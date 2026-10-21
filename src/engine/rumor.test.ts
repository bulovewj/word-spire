import { describe, expect, it } from 'vitest'
import { bee1 } from '../content/passages/bee-1'
import { bee3 } from '../content/passages/bee-3'
import { STARTER_DECK_56 } from '../content/words/pack-5-6'
import { judgementsFrom } from './records'
import { createBattle, nextEnemyAttack, reduce, type Action, type GameState } from './state'

const setup = (passage = bee3) => createBattle({ passage, deck: STARTER_DECK_56, wordUses: {}, seed: 3, playerHp: 30, playerMaxHp: 30 })
const good = bee3.rumor!.evidence.required[0]!
const rumor = (pass: boolean, evidence: number[] = good): Action => ({ type: 'resolveRumor', evidence, pass, answer: '' })
const base = (s: GameState) => nextEnemyAttack({ ...s, rumor: 'none' })
const clearFog = (s: GameState) => ({ ...s, fogCleared: s.passage.lockedWords.map((_, i) => i) })

describe('헛소문 반박', () => {
  it('소문이 있는 글은 반박 카드가 있고, 봉인 전에는 적 공격 +2', () => {
    const s = setup()
    expect(s.rumor).toBe('active')
    expect(s.textCards.some((c) => c.kind === 'rumor')).toBe(true)
    expect(nextEnemyAttack(s)).toBe(base(s) + 2)
    expect(setup(bee1).rumor).toBe('none')
  })
  it('근거 O + 반박 통과 = 정타 12(보호막이면 -2), 소문 봉인, 공격 보너스 사라짐', () => {
    const s = reduce(clearFog(setup()), rumor(true))
    expect(s).toMatchObject({ rumor: 'refuted', think: 1, enemy: { hp: bee3.enemy.maxHp - 12 } })
    expect(s.events).toEqual([{ kind: 'rumor', grade: 'hit', damage: 12 }])
    expect(nextEnemyAttack(s)).toBe(base(s))
    expect(reduce(setup(), rumor(true)).enemy.hp).toBe(bee3.enemy.maxHp - 10)
  })
  it('근거만 맞으면 약타 6, 근거가 틀리면 0. 둘 다 소문이 퍼져 공격 +2가 남고 카드는 사라진다', () => {
    const weak = reduce(clearFog(setup()), rumor(false))
    expect(weak).toMatchObject({ rumor: 'spread', enemy: { hp: bee3.enemy.maxHp - 6 } })
    expect(nextEnemyAttack(weak)).toBe(base(weak) + 2)
    expect(weak.textCards.some((c) => c.kind === 'rumor')).toBe(false)
    const miss = reduce(clearFog(setup()), rumor(true, [0, 1]))
    expect(miss).toMatchObject({ rumor: 'spread', enemy: { hp: bee3.enemy.maxHp } })
    expect(reduce(weak, rumor(true))).toBe(weak)   // 한 번만
  })
  it('생각력이 모자라면 낼 수 없고, 기록은 추리의 눈(author) 영역', () => {
    const s = { ...setup(), think: 1 }
    expect(reduce(s, rumor(true))).toBe(s)
    const t = setup()
    expect(judgementsFrom(t, rumor(true), reduce(t, rumor(true))))
      .toEqual([{ area: 'author', ref: 'bee-3:rumor', correct: true, helped: false }])
  })
})
