// 기기 안 저장. localStorage는 이 파일에서만 다룬다. 학생 답·기록은 기기 밖으로 나가지 않는다.
import type { Passage } from '../content/types'
import type { Area, JudgeRecord } from '../engine/records'
import { RUN_VERSION, type RunState } from '../engine/run'
import { STATE_VERSION, type GameState } from '../engine/state'
import { AREAS } from '../engine/stats'

const RUN_KEY = 'wordSpire.v2.run'
const FORMAT = `${RUN_VERSION}.${STATE_VERSION}`   // 둘 중 하나라도 바뀌면 옛 저장은 이어하지 않는다
const FORMAT_V1 = `1.${STATE_VERSION}`               // 진행 v1 → v2는 id만 늘어서 시드로 채워 이어한다

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
    if (data.format !== FORMAT && data.format !== FORMAT_V1) return null
    const { battle, ...saved } = data.run
    const rest = { ...saved, version: RUN_VERSION, id: saved.id ?? saved.seed }
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

// 판정 기록·이름. 진행 저장과 따로 두어 진행 형식이 바뀌어도 남는다(작업지시서 5장)
const RECORDS_KEY = 'wordSpire.v2.records'
const NAME_KEY = 'wordSpire.v2.name'
const RECORDS_FORMAT = 1

const isRecord = (r: unknown): r is JudgeRecord => {
  const x = r as Partial<JudgeRecord> | null
  return !!x && AREAS.includes(x.area as Area) && typeof x.ref === 'string' && typeof x.correct === 'boolean'
    && typeof x.helped === 'boolean' && typeof x.firstTry === 'boolean' && typeof x.scope === 'string'
}

/** 모양이 맞지 않는 기록 한 줄은 버린다 */
export function loadRecords(): JudgeRecord[] {
  try {
    const raw = storage()?.getItem(RECORDS_KEY)
    const data = raw ? (JSON.parse(raw) as { format?: number; log?: unknown }) : null
    if (data?.format === RECORDS_FORMAT && Array.isArray(data.log)) return data.log.filter(isRecord)
  } catch {
    // 깨진 기록: 처음부터
  }
  return []
}

export function saveRecords(log: JudgeRecord[]): void {
  try {
    storage()?.setItem(RECORDS_KEY, JSON.stringify({ format: RECORDS_FORMAT, log }))
  } catch {
    // 오류 없이 저장만 안 됨
  }
}

export function loadName(): string {
  try {
    return storage()?.getItem(NAME_KEY) ?? ''
  } catch {
    return ''
  }
}

export function saveName(name: string): void {
  try {
    storage()?.setItem(NAME_KEY, name)
  } catch {
    // 오류 없이 저장만 안 됨
  }
}
