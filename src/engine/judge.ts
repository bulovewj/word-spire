// 질문 판정 (기획안 6-2, 6-3 · 작업지시서 F2). 순수 함수만.
import type { Question } from '../content/types'
import { BALANCE } from './balance'

export type Grade = 'hit' | 'weak' | 'miss'          // 정타 / 약타 / 실패
export type Confidence = 'sure' | 'unsure'           // 확실 / 애매

export interface QuestionAnswer {
  option: number
  evidence: number[]
  confidence: Confidence
  attachedWordId?: string   // 붙인 낱말 카드의 낱말 id
}

export interface JudgeContext {
  shield: boolean           // 안개 보호막
  retry: boolean            // "다시 보기"로 돌아온 질문 (피해 절반)
}

export interface QuestionResult {
  grade: Grade
  damage: number            // 적 체력 1 하한은 엔진 상태에서 적용
  enemyAttackBonus: number  // 적의 다음 공격에 더할 값
  freeHint: boolean         // 애매로 틀렸으면 다음 단서 보기 공짜
}

function sameSet(a: number[], b: number[]): boolean {
  const sa = new Set(a)
  const sb = new Set(b)
  return sa.size === sb.size && [...sa].every((x) => sb.has(x))
}

export function gradeQuestion(q: Question, option: number, evidence: number[]): Grade {
  if (option !== q.answer) return 'miss'
  return q.evidence.some((set) => sameSet(set, evidence)) ? 'hit' : 'weak'
}

/** 피해 계산 순서: 기본 → 보너스 낱말 → 약타 절반 → 다시 보기 절반 → 정타+확실 ×1.5 → 보호막 */
export function computeDamage(
  q: Question, grade: Grade, confidence: Confidence, attachedWordId: string | undefined, ctx: JudgeContext,
): number {
  if (grade === 'miss') return 0
  let dmg: number = BALANCE.questionDamage[q.type]
  if (q.type === 'author' && attachedWordId && q.bonusWords?.includes(attachedWordId)) {
    dmg += BALANCE.bonusWordDamage
  }
  if (grade === 'weak') dmg = Math.floor(dmg / 2)
  if (ctx.retry) dmg = Math.floor(dmg / 2)
  if (grade === 'hit' && confidence === 'sure') dmg = Math.round(dmg * BALANCE.sureMultiplier)
  if (ctx.shield) dmg = Math.max(0, dmg - BALANCE.fogShield)
  return dmg
}

export function judgeQuestion(q: Question, answer: QuestionAnswer, ctx: JudgeContext): QuestionResult {
  const grade = gradeQuestion(q, answer.option, answer.evidence)
  const wrong = grade !== 'hit'
  return {
    grade,
    damage: computeDamage(q, grade, answer.confidence, answer.attachedWordId, ctx),
    enemyAttackBonus: wrong && answer.confidence === 'sure' ? BALANCE.surePenalty : 0,
    freeHint: wrong && answer.confidence === 'unsure',
  }
}

/** 제출 전 미리보기: 정답 여부를 드러내지 않고 등급별 피해만 */
export function previewDamage(
  q: Question, confidence: Confidence, attachedWordId: string | undefined, ctx: JudgeContext,
): Record<Grade, number> {
  return {
    hit: computeDamage(q, 'hit', confidence, attachedWordId, ctx),
    weak: computeDamage(q, 'weak', confidence, attachedWordId, ctx),
    miss: 0,
  }
}
