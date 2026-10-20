// 기기 안 저장. localStorage는 이 파일에서만 다룬다. 학생 답·기록은 기기 밖으로 나가지 않는다.
import type { Passage } from '../content/types'
import { RUN_VERSION, type RunState } from '../engine/run'
import { STATE_VERSION, type GameState } from '../engine/state'

const RUN_KEY = 'wordSpire.v2.run'
const FORMAT = `${RUN_VERSION}.${STATE_VERSION}`   // 둘 중 하나라도 바뀌면 옛 저장은 이어하지 않는다

/** 저장 형식: 전투 속 글 데이터는 id만 남긴다(불러올 때 지금 데이터로 되돌림) */
interface Saved {
  format: string
  run: Omit<RunState, 'battle'> & { battle: (Omit<GameState, 'passage'> & { passageId: string }) | null }
}

function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null   // 시크릿 창 등: 저장만 안 된다
  }
}

export function saveRun(run: RunState): void {
  const { battle, ...rest } = run
  let savedBattle: Saved['run']['battle'] = null
  if (battle) {
    const { passage, ...b } = battle
    savedBattle = { ...b, passageId: passage.id }
  }
  const data: Saved = { format: FORMAT, run: { ...rest, battle: savedBattle } }
  try {
    storage()?.setItem(RUN_KEY, JSON.stringify(data))
  } catch {
    // 용량 초과 등: 오류 없이 저장만 안 됨
  }
}

/** 이어할 진행. 없거나 형식이 다르거나 글을 못 찾으면 null */
export function loadRun(findPassage: (id: string) => Passage | undefined): RunState | null {
  try {
    const raw = storage()?.getItem(RUN_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as Saved
    if (data.format !== FORMAT) return null
    const { battle, ...rest } = data.run
    if (!battle) return { ...rest, battle: null }
    const { passageId, ...b } = battle
    const passage = findPassage(passageId)
    return passage ? { ...rest, battle: { ...b, passage } } : null
  } catch {
    return null
  }
}

export function clearRun(): void {
  try {
    storage()?.removeItem(RUN_KEY)
  } catch {
    // 무시
  }
}
