// 게임 숫자는 전부 여기 (기획안 6장 + docs/개편-기록.md). 시뮬레이션(simulate.test.ts)으로 맞춘 값
import type { QuestionType } from '../content/types'

export const BALANCE = {
  thinkPerTurn: 3,              // 생각력
  wordUsesPerTower: 2,          // 낱말마다 한 탑에서 방어·붙이기에 쓸 수 있는 횟수
  playerMaxHp: 30,              // 층을 봉인하면 체력을 모두 회복한다 (층마다 새로 겨룬다)
  retryEase: 1,                 // 진 층을 다시 할 때마다 요괴가 지쳐 공격이 이만큼 약해진다
  retryEaseMax: 3,              // 그 상한

  questionCost: { literal: 1, connect: 2, author: 2 } satisfies Record<QuestionType, number>,
  questionDamage: { literal: 6, connect: 10, author: 14 } satisfies Record<QuestionType, number>,
  bonusWordDamage: 4,           // author 질문에 관련 낱말 카드를 붙이면
  sureMultiplier: 1.5,          // 정타 + 확실 (반올림)
  surePenalty: 3,               // 확실인데 약타·실패면 적의 다음 공격 +
  fogShield: 2,                 // 잠긴 낱말이 남아 있는 동안 질문 피해 -

  comboDamageStep: 1,           // 연속 정타마다 정타 피해 +
  comboDamageMax: 4,            // 연속 정타 보너스 상한
  comboThinkEvery: 3,           // 연속 정타가 이 배수가 될 때마다 생각력 +1 (번뜩임)

  fogCost: 1,
  wordCardCost: 1,
  wordBlockPick: 5,             // 낱말 방어: 뜻 고르기
  wordBlockWrite: 8,            // 낱말 방어: 뜻 쓰기
  summaryCost: 2,
  summaryUnlockRatio: 0.4,      // 적 체력이 이 비율 이하면 요약 봉인 등장
  summaryHelpAfter: 2,          // 요약을 이만큼 실패하면 요약 틀(도움)을 보여 준다
  hintCost: 1,

  rumorCost: 2,                 // 헛소문 반박 (우두머리 층)
  rumorDamage: 12,
  rumorAttackBonus: 2,          // 소문을 봉인하기 전(또는 퍼진 뒤) 적 공격 +

  starHpRatio: 0.5,             // 별: 체력을 이 비율 이상 남기고 봉인
  rewardBoons: 2,               // 층 보상으로 내놓는 보물 수 (여기에 새 낱말 1장이 더 붙는다)
  boon: {
    gourdMaxHp: 6,              // 약수 호리병: 최대 체력 +
    knotBlock: 2,               // 청심 매듭: 낱말 방어 +
    stoneGuard: 4,              // 돌문진: 층마다 첫 공격 피해 -
    brushDamage: 2,             // 굳센 붓: 정타 피해 +
  },

  statsMinSamples: 5,           // 판단력·약점은 영역마다 첫 시도 기록이 이만큼 쌓여야 표시
} as const
