import { describe, expect, it } from 'vitest'
import { checkContent, wordPacks } from './index'
import { bee1 } from './passages/bee-1'
import { STARTER_DECK_56, pack56 } from './words/pack-5-6'
import type { Passage } from './types'
import { validateContent, validatePassage, validateWords } from './validate'

const ids = new Set([...pack56.map((w) => w.id), 'bee-w1'])
const copy = (): Passage => structuredClone(bee1)

describe('실제 콘텐츠', () => {
  it('오류가 없다', () => {
    expect(checkContent()).toEqual([])
  })
  it('처음 덱 id가 모두 팩에 있다', () => {
    const packIds = new Set(pack56.map((w) => w.id))
    expect(STARTER_DECK_56.every((id) => packIds.has(id))).toBe(true)
  })
})

describe('틀린 데이터를 잡는다', () => {
  it('문장 index 범위 밖 근거', () => {
    const p = copy()
    p.questions[0]!.evidence = [[9]]
    expect(validatePassage(p, ids)).toEqual(['passages/bee-1 questions[0] q1.evidence[0]: 문장 index 9는 범위(0~4) 밖'])
  })
  it('answer 범위 밖', () => {
    const p = copy()
    p.questions[1]!.answer = 4
    expect(validatePassage(p, ids).join()).toContain('q2: answer 4는 보기 범위 밖')
  })
  it('보기가 4개가 아님', () => {
    const p = copy()
    p.questions[0]!.options.pop()
    expect(validatePassage(p, ids).join()).toContain('보기는 4개여야 함(지금 3개)')
  })
  it('잠긴 낱말이 문장에 없음', () => {
    const p = copy()
    p.lockedWords[0]!.sentence = 0
    expect(validatePassage(p, ids).join()).toContain('"위협"가 문장 0에 없음')
  })
  it('conceptLabels 길이가 다름', () => {
    const p = copy()
    p.summary.conceptLabels.pop()
    expect(validatePassage(p, ids).join()).toContain('conceptLabels(2)와 concepts(3) 길이가 다름')
  })
  it('모르는 보너스 낱말 id', () => {
    const p = copy()
    p.questions[2]!.bonusWords = ['zz9']
    expect(validatePassage(p, ids).join()).toContain('모르는 낱말 id zz9')
  })
  it('낱말 id 중복과 빈 accepts', () => {
    const a = pack56[0]!
    const errors = validateWords([a, { ...a, accepts: [] }], 'words/test')
    expect(errors).toContain('words/test: 낱말 id 중복 g01')
    expect(errors.join()).toContain('words/test [1] g01: accepts가 1개 이상이어야 함')
  })
  it('안개 낱말 카드 id가 팩과 겹침', () => {
    const p = copy()
    p.lockedWords[0]!.card.id = 'h01'
    expect(validateContent(wordPacks, [p])).toContain('passages/bee-1: 낱말 id 중복 h01')
  })
})
