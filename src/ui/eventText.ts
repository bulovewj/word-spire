import { findWord } from '../content'
import type { BattleEvent } from '../engine/state'

const GRADE = { hit: '정타', weak: '약타', miss: '실패' } as const

export function eventText(e: BattleEvent): string {
  switch (e.kind) {
    case 'question': {
      const penalty = e.enemyAttackBonus > 0 ? ` · 확실했는데 틀려서 적의 다음 공격 +${e.enemyAttackBonus}` : ''
      const why = e.grade === 'weak' ? ' — 답은 맞았는데 근거 문장이 모자라거나 맞지 않아' : e.grade === 'miss' ? ' — 고른 답이 글의 내용과 달라' : ''
      return `${GRADE[e.grade]}! 피해 ${e.damage}${why}${penalty}`
    }
    case 'word': {
      const word = findWord(e.wordId)?.word ?? e.wordId
      return e.pass ? `"${word}" 발동! 방어 +${e.block}` : `"${word}" 뜻 쓰기 실패`
    }
    case 'enemy':
      return `적의 공격 ${e.attack} → ${e.damage} 받음`
    case 'summary':
      return e.pass ? '요약 봉인 성공!' : '요약 봉인 실패. 다음 턴에 다시 도전해 봐.'
    case 'summaryUnlocked':
      return '요약 봉인 카드가 나타났어!'
    case 'fog': {
      const word = findWord(e.wordId)?.word ?? e.wordId
      return e.pass ? `안개가 걷혔어! "${word}" 낱말 카드를 이 층 보상으로 얻을 거야. 보호막도 사라졌어.` : '안개 걷기 실패. 다음 턴에 다시 해 봐.'
    }
    case 'rumor':
      return e.grade === 'hit' ? `헛소문을 부적에 묶었어! 피해 ${e.damage}`
        : e.grade === 'weak' ? `근거는 맞았는데 반박이 모자라 소문이 퍼졌어. 피해 ${e.damage} · 이 층 동안 적 공격 +2`
        : '근거가 소문을 반박하지 못해 소문이 퍼졌어. 이 층 동안 적 공격 +2'
    case 'hint':
      return e.free ? '단서 보기(공짜): 틀린 보기 하나를 지웠어.' : '단서 보기: 틀린 보기 하나를 지웠어.'
  }
}
