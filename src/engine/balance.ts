// 게임 숫자는 전부 여기. 플레이테스트 전 가정값 (기획안 6장)
import type { QuestionType } from '../content/types'

export const BALANCE = {
  thinkPerTurn: 3,              // 생각력
  wordUsesPerTower: 2,          // 낱말마다 한 탑에서 방어·붙이기에 쓸 수 있는 횟수
  playerMaxHp: 30,
  healBetweenFloors: 8,

  questionCost: { literal: 1, connect: 2, author: 2 } satisfies Record<QuestionType, number>,
  questionDamage: { literal: 6, connect: 10, author: 14 } satisfies Record<QuestionType, number>,
  bonusWordDamage: 4,           // author 질문에 관련 낱말 카드를 붙이면
  sureMultiplier: 1.5,          // 정타 + 확실 (반올림)
  surePenalty: 3,               // 확실인데 약타·실패면 적의 다음 공격 +
  fogShield: 2,                 // 잠긴 낱말이 남아 있는 동안 질문 피해 -

  fogCost: 1,
  wordCardCost: 1,
  wordCardBlock: 5,
  summaryCost: 2,
  summaryUnlockRatio: 0.4,      // 적 체력이 이 비율 이하면 요약 봉인 등장
  hintCost: 1,

  rumorCost: 2,                 // 헛소문 반박 (3층부터 시험)
  rumorDamage: 12,
  rumorAttackBonus: 2,          // 소문을 봉인하기 전(또는 퍼진 뒤) 적 공격 +

  statsMinSamples: 5,           // 판단력·약점은 영역마다 첫 시도 기록이 이만큼 쌓여야 표시
} as const
