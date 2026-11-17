// 질문 카드 내기 (기획안 6-2·6-3 · 작업지시서 F2). reduce가 부른다
import { BALANCE } from './balance'
import { applyCombo, openWhenQuestionsExhausted, unlockSummaryIfLow } from './battle'
import { hasBoon } from './boons'
import { comboBonus, judgeQuestion, type JudgeContext } from './judge'
import { canUseWord, hasShield, spendWord } from './select'
import type { Action, GameState } from './state'

/** 지금 질문을 내면 적용될 조건 (화면 미리보기와 판정이 같은 값을 쓴다) */
export function judgeContext(s: GameState): JudgeContext {
  return { shield: hasShield(s), combo: s.combo, brush: hasBoon(s.boons, 'brush') }
}

export function resolveQuestion(s: GameState, a: Extract<Action, { type: 'resolveQuestion' }>): GameState {
  const card = s.textCards.find((c) => c.kind === 'question' && c.refId === a.questionId)
  const q = s.passage.questions.find((x) => x.id === a.questionId)
  if (!card || !q || card.lockedThisTurn) return s
  const cost = BALANCE.questionCost[q.type]
  if (s.think < cost) return s
  // 붙이기는 author 질문의 관련 낱말만, 횟수가 남았을 때. 아니면 무시하고 횟수도 그대로
  const attached = q.type === 'author' && a.attachedWordId && q.bonusWords?.includes(a.attachedWordId)
    && canUseWord(s, a.attachedWordId) ? a.attachedWordId : undefined
  const r = judgeQuestion(q, { option: a.option, evidence: a.evidence, confidence: a.confidence, attachedWordId: attached }, judgeContext(s))
  const hit = r.grade === 'hit'
  const next: GameState = {
    ...s,
    think: s.think - cost,
    enemy: { ...s.enemy, hp: Math.max(1, s.enemy.hp - r.damage), attackBonus: s.enemy.attackBonus + r.enemyAttackBonus },
    textCards: s.textCards.filter((c) => c !== card),
    wordUses: attached ? spendWord(s, attached) : s.wordUses,
    freeHint: r.freeHint || s.freeHint,
    tally: { ...s.tally, hits: s.tally.hits + (hit ? 1 : 0), misses: s.tally.misses + (hit ? 0 : 1) },
    events: [{
      kind: 'question', questionId: q.id, grade: r.grade, damage: r.damage, enemyAttackBonus: r.enemyAttackBonus,
      combo: hit ? s.combo + 1 : 0, comboBonus: hit ? comboBonus(s.combo) : 0,
    }],
  }
  return openWhenQuestionsExhausted(unlockSummaryIfLow(applyCombo(next, hit)))
}
