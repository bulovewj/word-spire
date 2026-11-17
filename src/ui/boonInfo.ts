import { BALANCE } from '../engine/balance'
import type { BoonId } from '../engine/boons'
import type { IconName } from './sprites/sprites'

/** 보물의 이름·한 줄 설명·아이콘. 숫자는 balance.ts에서 가져온다 */
export const BOON_INFO: Record<BoonId, { name: string; desc: string; icon: IconName }> = {
  gourd: { name: '약수 호리병', desc: `최대 체력 +${BALANCE.boon.gourdMaxHp}`, icon: 'seal' },
  knot: { name: '청심 매듭', desc: `낱말 방어 +${BALANCE.boon.knotBlock}`, icon: 'defense' },
  stone: { name: '돌문진', desc: `층마다 첫 공격을 ${BALANCE.boon.stoneGuard} 덜 받아`, icon: 'weak' },
  lamp: { name: '밝은 등불', desc: '층마다 단서 보기 한 번 공짜', icon: 'clue' },
  brush: { name: '굳센 붓', desc: `정타 피해 +${BALANCE.boon.brushDamage}`, icon: 'hit' },
}
