import { describe, expect, it } from 'vitest'
import { bee1 } from '../content/passages/bee-1'
import type { Question } from '../content/types'
import { evidenceOk, judgeQuestion, previewDamage } from './judge'

const [q1, q2, q3] = bee1.questions as [Question, Question, Question]
const open = { shield: false }
const fogged = { shield: true }

describe('기획안 6-2 질문 카드', () => {
  it('거기 있음 정타 6', () => {
    expect(judgeQuestion(q1, { option: 0, evidence: [3], confidence: 'unsure' }, open).damage).toBe(6)
  })
  it('연결 정타 10, 근거 순서는 상관없다', () => {
    const r = judgeQuestion(q2, { option: 0, evidence: [2, 1], confidence: 'unsure' }, open)
    expect(r).toMatchObject({ grade: 'hit', damage: 10 })
  })
  it('연결: 다른 허용 근거 조합도 정타', () => {
    expect(judgeQuestion(q2, { option: 0, evidence: [0, 1], confidence: 'unsure' }, open).grade).toBe('hit')
  })
  it('글쓴이와 나 정타 14', () => {
    expect(judgeQuestion(q3, { option: 0, evidence: [4], confidence: 'unsure' }, open).damage).toBe(14)
  })
  it('글쓴이와 나 + 관련 낱말 카드 +4', () => {
    expect(judgeQuestion(q3, { option: 0, evidence: [4], confidence: 'unsure', attachedWordId: 'h01' }, open).damage).toBe(18)
  })
  it('관련 없는 낱말 카드는 보너스 없음', () => {
    expect(judgeQuestion(q3, { option: 0, evidence: [4], confidence: 'unsure', attachedWordId: 'h02' }, open).damage).toBe(14)
  })
  it('해석 O 근거 X = 약타(절반, 내림)', () => {
    expect(judgeQuestion(q2, { option: 0, evidence: [1], confidence: 'unsure' }, open)).toMatchObject({ grade: 'weak', damage: 5 })
  })
  it('근거를 더 많이 골라도 허용 조합과 다르면 약타', () => {
    expect(judgeQuestion(q1, { option: 0, evidence: [3, 4], confidence: 'unsure' }, open).grade).toBe('weak')
  })
  it('해석 X = 실패(0), 근거가 맞아도', () => {
    expect(judgeQuestion(q1, { option: 1, evidence: [3], confidence: 'unsure' }, open)).toMatchObject({ grade: 'miss', damage: 0 })
  })
})

describe('기획안 6-3 확신도', () => {
  it('확실 + 맞음 = ×1.5 반올림', () => {
    expect(judgeQuestion(q1, { option: 0, evidence: [3], confidence: 'sure' }, open)).toMatchObject({ damage: 9, enemyAttackBonus: 0 })
  })
  it('확실 + 약타 = 적의 다음 공격 +3, 배율 없음', () => {
    expect(judgeQuestion(q1, { option: 0, evidence: [2], confidence: 'sure' }, open)).toMatchObject({ grade: 'weak', damage: 3, enemyAttackBonus: 3, freeHint: false })
  })
  it('확실 + 실패 = 적의 다음 공격 +3', () => {
    expect(judgeQuestion(q1, { option: 2, evidence: [3], confidence: 'sure' }, open)).toMatchObject({ damage: 0, enemyAttackBonus: 3 })
  })
  it('애매 + 맞음 = 그대로', () => {
    expect(judgeQuestion(q3, { option: 0, evidence: [4], confidence: 'unsure' }, open)).toMatchObject({ damage: 14, enemyAttackBonus: 0, freeHint: false })
  })
  it('애매 + 틀림 = 벌 없음 + 다음 단서 보기 공짜', () => {
    expect(judgeQuestion(q1, { option: 3, evidence: [0], confidence: 'unsure' }, open)).toMatchObject({ enemyAttackBonus: 0, freeHint: true })
  })
})

describe('보호막', () => {
  it('안개 보호막 -2', () => {
    expect(judgeQuestion(q1, { option: 0, evidence: [3], confidence: 'sure' }, fogged).damage).toBe(7)
  })
  it('보호막은 0 밑으로 안 내린다', () => {
    const tiny = { ...q1, evidence: { count: 1, required: [[3]] } }
    const r = judgeQuestion(tiny, { option: 0, evidence: [0], confidence: 'unsure' }, { shield: true })
    expect(r.damage).toBe(1)   // 6 → 약타 3 → 보호막 1
    const none = judgeQuestion(tiny, { option: 1, evidence: [0], confidence: 'unsure' }, { shield: true })
    expect(none.damage).toBe(0)
  })
})

describe('근거 판정 (개수 + 필수 + 허용)', () => {
  const spec = { count: 2, required: [[6], [3, 4]], allowed: [5] }
  it('정확히 count개, 필수 묶음 하나를 다 포함하면 정답', () => {
    expect(evidenceOk(spec, [6, 5])).toBe(true)
    expect(evidenceOk(spec, [4, 3])).toBe(true)
    expect(evidenceOk(spec, [4, 6])).toBe(true)
  })
  it('개수가 다르면 오답 (많이 골라도, 적게 골라도)', () => {
    expect(evidenceOk(spec, [6])).toBe(false)
    expect(evidenceOk(spec, [3, 4, 6])).toBe(false)
  })
  it('필수 묶음을 다 못 채우면 오답', () => {
    expect(evidenceOk(spec, [3, 5])).toBe(false)
  })
  it('관련 없는 문장을 섞으면 오답', () => {
    expect(evidenceOk(spec, [6, 0])).toBe(false)
  })
  it('질문을 되풀이한 문장은 근거가 아니다 (1층 연결: 2번+5번)', () => {
    expect(evidenceOk(q2.evidence, [1, 4])).toBe(false)
    expect(evidenceOk(q2.evidence, [0, 1])).toBe(true)
    expect(evidenceOk(q2.evidence, [1, 2])).toBe(true)
  })
})

describe('미리보기', () => {
  it('정답 여부와 상관없이 등급별 피해만', () => {
    expect(previewDamage(q2, 'sure', undefined, open)).toEqual({ hit: 15, weak: 5, miss: 0 })
  })
})
