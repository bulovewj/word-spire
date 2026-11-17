// 저장은 외부 입력이다. 버전이 같아도 빠지거나 깨진 값이면 이어하지 않는다.
import type { Passage } from '../content/types'
import { towerFloors } from '../content'
import { BOON_IDS } from '../engine/boons'
import { RUN_VERSION, type RunState } from '../engine/run'
import { STATE_VERSION, type GameState } from '../engine/state'

export interface Saved {
  format: string
  run: Omit<RunState, 'battle'> & { battle: (Omit<GameState, 'passage'> & { passageId: string }) | null }
}

export const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
export const count = (v: unknown): v is number => Number.isSafeInteger(v) && (v as number) >= 0
const bool = (v: unknown) => typeof v === 'boolean'
const text = (v: unknown): v is string => typeof v === 'string'
const list = (v: unknown, valid: (x: unknown) => boolean): v is unknown[] => Array.isArray(v) && v.every(valid)
const strings = (v: unknown) => list(v, text)
const numbers = (v: unknown) => list(v, count)
const map = (v: unknown, valid: (x: unknown) => boolean) => object(v) && Object.values(v).every(valid)
const oneOf = (v: unknown, values: readonly string[]) => text(v) && values.includes(v)
const fields = (v: Record<string, unknown>, keys: string[]) => keys.every((k) => count(v[k]))
const boons = (v: unknown) => list(v, (id) => oneOf(id, BOON_IDS))
const start = (v: unknown) => object(v) && strings(v.deck) && map(v.wordUses, count) && count(v.combo)

function result(v: unknown): boolean {
  return object(v) && text(v.passageId) && fields(v, ['stars', 'turns', 'retries']) && (v.stars as number) <= 3
    && object(v.checks) && ['sealed', 'allHits', 'healthy'].every((k) => bool(v.checks && (v.checks as Record<string, unknown>)[k]))
}

function reward(v: unknown): boolean {
  if (!object(v) || !strings(v.words) || !result(v.result) || !list(v.offers, (o) => object(o)
    && (o.kind === 'word' ? text(o.id) : o.kind === 'boon' && oneOf(o.id, BOON_IDS)))) return false
  return v.picked === null || (count(v.picked) && v.picked < v.offers.length)
}

function event(v: unknown): boolean {
  if (!object(v)) return false
  const grade = () => oneOf(v.grade, ['hit', 'weak', 'miss'])
  switch (v.kind) {
    case 'question': return text(v.questionId) && grade() && fields(v, ['damage', 'enemyAttackBonus', 'combo', 'comboBonus'])
    case 'word': return text(v.wordId) && bool(v.pass) && count(v.block) && oneOf(v.mode, ['pick', 'write'])
    case 'fog': return text(v.wordId) && bool(v.pass)
    case 'hint': return text(v.questionId) && bool(v.free)
    case 'summary': return bool(v.pass)
    case 'summaryUnlocked': return true
    case 'spark': return count(v.think)
    case 'enemy': return fields(v, ['attack', 'damage'])
    case 'rumor': return grade() && count(v.damage)
    default: return false
  }
}

function battle(v: unknown, p: Passage): boolean {
  if (!object(v) || v.version !== STATE_VERSION || !fields(v, ['rng', 'turn', 'think', 'combo', 'guard'])) return false
  if (!object(v.player) || !fields(v.player, ['hp', 'maxHp', 'block']) || (v.player.hp as number) > (v.player.maxHp as number)) return false
  if (!object(v.enemy) || !fields(v.enemy, ['hp', 'maxHp', 'patternIndex', 'attackBonus', 'ease'])) return false
  if (!object(v.tally) || !fields(v.tally, ['hits', 'misses', 'summaryFails'])) return false
  if (!strings(v.deck) || !map(v.wordUses, count) || !strings(v.reservedWords) || !boons(v.boons)) return false
  if (!numbers(v.fogCleared) || !map(v.hints, count) || !map(v.optionOrder, numbers)) return false
  if (!object(v.optionOrder) || !p.questions.every((q) => {
    const order = (v.optionOrder as Record<string, unknown>)[q.id]
    return Array.isArray(order) && [...order].sort().join() === q.options.map((_, i) => i).join()
  })) return false
  return bool(v.freeHint) && oneOf(v.rumor, ['none', 'active', 'refuted', 'spread'])
    && oneOf(v.outcome, ['playing', 'won', 'lost']) && list(v.events, event)
    && list(v.textCards, (c) => object(c) && oneOf(c.kind, ['question', 'fog', 'summary', 'rumor']) && text(c.refId) && bool(c.lockedThisTurn))
}

/** 지금 콘텐츠와 맞지 않는 진행도 거른다. 별도 키의 판정·성장 기록은 남는다. */
export function restoreRun(value: unknown, format: string, findPassage: (id: string) => Passage | undefined): RunState | null {
  if (!object(value) || value.format !== format || !object(value.run)) return null
  const r = value.run
  if (r.version !== RUN_VERSION || !text(r.towerId) || !oneOf(r.phase, ['intro', 'battle', 'reward', 'complete'])) return null
  if (!fields(r, ['id', 'floor', 'hp', 'maxHp', 'seed', 'combo', 'retries']) || (r.floor as number) < 1 || (r.floor as number) > 3) return null
  if ((r.maxHp as number) <= 0 || (r.hp as number) > (r.maxHp as number)) return null
  if (!strings(r.deck) || !map(r.wordUses, count) || !start(r.floorStart) || !boons(r.boons) || !list(r.results, result)) return null
  if (r.reward !== null && !reward(r.reward)) return null
  if ((r.phase === 'reward' || r.phase === 'complete') && r.reward === null) return null
  const id = towerFloors(r.towerId)[(r.floor as number) - 1]?.id
  const p = id ? findPassage(id) : undefined
  if (!p || p.towerId !== r.towerId || p.floor !== r.floor) return null
  if (r.phase === 'battle') {
    if (!object(r.battle) || r.battle.passageId !== p.id || !battle(r.battle, p)) return null
  } else if (r.battle !== null) return null
  const saved = r as unknown as Saved['run']
  if (!saved.battle) return { ...saved, battle: null }
  const { passageId: _id, ...b } = saved.battle
  return { ...saved, battle: { ...b, passage: p } }
}
