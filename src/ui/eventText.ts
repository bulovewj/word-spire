import { findWord } from '../content'
import type { BattleEvent } from '../engine/state'

const GRADE = { hit: '정타', weak: '약타', miss: '실패' } as const

export function eventText(e: BattleEvent): string {
  switch (e.kind) {
    case 'question': {
      const penalty = e.enemyAttackBonus > 0 ? ` · 확실했는데 틀려서 적의 다음 공격 +${e.enemyAttackBonus}` : ''
      return `${GRADE[e.grade]}! 피해 ${e.damage}${penalty}`
    }
    case 'word': {
      const word = findWord(e.wordId)?.word ?? e.wordId
      return e.pass ? `"${word}" 발동! 방어 +${e.block}` : `"${word}" 카드 실패`
    }
    case 'enemy':
      return `적의 공격 ${e.attack} → ${e.damage} 받음`
    case 'summaryUnlocked':
      return '요약 봉인 카드가 나타났어!'
    case 'retry':
      return `틀렸던 질문 ${e.questionIds.length}개가 "다시 보기"로 돌아왔어 (피해 절반)`
  }
}
