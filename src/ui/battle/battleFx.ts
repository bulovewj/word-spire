// 방금 일어난 일(state.events) → 무대 연출: 떠오르는 숫자, 요괴의 한마디, 흔들림. 순수 함수
import { findYokai, type YokaiLines } from '../../content/yokai'
import type { BattleEvent, GameState } from '../../engine/state'

export type FloatTone = 'hit' | 'crit' | 'weak' | 'miss' | 'block' | 'hurt' | 'good' | 'think'

export interface FloatText { side: 'player' | 'enemy'; text: string; tone: FloatTone }

export interface BattleFx {
  floats: FloatText[]
  line?: string             // 요괴 말풍선
  shake: boolean            // 무대 흔들림 (센 정타, 내가 맞았을 때)
  flash?: 'player' | 'enemy'   // 맞은 쪽이 번쩍
}

const CRIT_DAMAGE = 12       // 이만큼 이상의 정타는 '강타'로 크게 보여 준다 (연출만, 규칙 아님)

function pick(lines: string[] | undefined, n: number): string | undefined {
  return lines && lines.length > 0 ? lines[n % lines.length] : undefined
}

function attackFloats(grade: 'hit' | 'weak' | 'miss', damage: number): FloatText[] {
  if (grade === 'miss') return [{ side: 'enemy', text: '빗나감', tone: 'miss' }]
  if (grade === 'weak') return [{ side: 'enemy', text: `약타 -${damage}`, tone: 'weak' }]
  return [{ side: 'enemy', text: `정타! -${damage}`, tone: damage >= CRIT_DAMAGE ? 'crit' : 'hit' }]
}

function floatsFor(e: BattleEvent): FloatText[] {
  switch (e.kind) {
    case 'question': {
      const out = attackFloats(e.grade, e.damage)
      if (e.enemyAttackBonus > 0) out.push({ side: 'enemy', text: `다음 공격 +${e.enemyAttackBonus}`, tone: 'hurt' })
      return out
    }
    case 'rumor': return attackFloats(e.grade, e.damage)
    case 'spark': return [{ side: 'player', text: `번뜩임! 생각력 +${e.think}`, tone: 'think' }]
    case 'word': return [{ side: 'player', text: e.pass ? `방어 +${e.block}` : '방어 실패', tone: e.pass ? 'block' : 'miss' }]
    case 'enemy': return [{ side: 'player', text: e.damage > 0 ? `-${e.damage}` : '막았어!', tone: e.damage > 0 ? 'hurt' : 'block' }]
    case 'fog': return [{ side: 'enemy', text: e.pass ? '보호막이 걷혔어!' : '안개가 그대로야', tone: e.pass ? 'good' : 'miss' }]
    case 'summary': return e.pass ? [] : [{ side: 'enemy', text: '봉인 실패', tone: 'miss' }]
    case 'summaryUnlocked': return [{ side: 'enemy', text: '기운이 빠졌어!', tone: 'good' }]
    case 'hint': return []
  }
}

/** 이 사건에 요괴가 할 말의 종류 (없으면 조용히) */
function lineKind(e: BattleEvent): keyof YokaiLines | undefined {
  switch (e.kind) {
    case 'question': case 'rumor': return e.grade
    case 'enemy': return e.damage > 0 ? 'attack' : 'blocked'
    case 'fog': return e.pass ? 'fog' : undefined
    case 'summaryUnlocked': return 'low'
    default: return undefined
  }
}

export function battleFx(s: GameState): BattleFx {
  const floats = s.events.flatMap(floatsFor)
  const lines = findYokai(s.passage.enemy.sprite)?.lines
  // 뒤에 일어난 일이 먼저: 요약 봉인이 열렸으면 그 말을, 아니면 마지막 사건의 말을
  const kind = [...s.events].reverse().map(lineKind).find((k) => k !== undefined)
  const hurt = s.events.some((e) => e.kind === 'enemy' && e.damage > 0)
  const struck = s.events.some((e) => (e.kind === 'question' || e.kind === 'rumor') && e.grade !== 'miss')
  return {
    floats,
    line: kind ? pick(lines?.[kind], s.turn + s.enemy.hp + s.player.hp) : undefined,
    shake: hurt || floats.some((f) => f.tone === 'crit'),
    flash: hurt ? 'player' : struck ? 'enemy' : undefined,
  }
}
