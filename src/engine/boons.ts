// 층 보상으로 고르는 보물 (docs/개편-기록.md 2장). 효과 숫자는 balance.ts, 이름·설명은 ui/boonInfo.ts
import { BALANCE } from './balance'
import { shuffle } from './rng'

/** gourd 약수 호리병 · knot 청심 매듭 · stone 돌문진 · lamp 밝은 등불 · brush 굳센 붓 */
export type BoonId = 'gourd' | 'knot' | 'stone' | 'lamp' | 'brush'

export const BOON_IDS: readonly BoonId[] = ['gourd', 'knot', 'stone', 'lamp', 'brush']

/** 층 보상 한 칸: 보물 또는 새 낱말 카드 */
export type RewardOffer = { kind: 'boon'; id: BoonId } | { kind: 'word'; id: string }

export const hasBoon = (boons: readonly BoonId[], id: BoonId): boolean => boons.includes(id)

/**
 * 층 보상 고르기에 내놓을 것: 아직 없는 보물 중 몇 개 + 내 묶음에 없는 낱말 1장.
 * 난수는 진행의 시드만 쓴다. 다음 시드를 함께 돌려준다
 */
export function makeOffers(owned: readonly BoonId[], deck: readonly string[], wordPool: readonly string[], seed: number): [RewardOffer[], number] {
  const [boons, s1] = shuffle(BOON_IDS.filter((id) => !owned.includes(id)), seed)
  const [words, s2] = shuffle(wordPool.filter((id) => !deck.includes(id)), s1)
  const offers: RewardOffer[] = boons.slice(0, BALANCE.rewardBoons).map((id) => ({ kind: 'boon', id }))
  const word = words[0]
  if (word !== undefined) offers.push({ kind: 'word', id: word })
  return [offers, s2]
}
