// 게임용 도트 시트 (Codex [요청4]). 좌표는 frames.json, 그림은 Vite가 묶는다
import frameData from './frames.json'
import cardKinds from './card-kinds.png'
import dokkaebi from './dokkaebi.png'
import fox from './fox.png'
import gourd from './gourd.png'
import icons from './icons.png'
import reader from './reader.png'
import seal from './seal.png'
import tiger from './tiger.png'

export interface Sheet { url: string; width: number; height: number; count: number; labels: string[] }

interface FrameData { width: number; height: number; frames: unknown[]; labels: string[] }
const data = frameData as Record<string, FrameData>

const URLS = { reader, dokkaebi, tiger, fox, seal, gourd, icons, 'card-kinds': cardKinds } as const
export type SheetName = keyof typeof URLS

export function sheet(name: SheetName): Sheet {
  const d = data[name]
  return { url: URLS[name], width: d?.width ?? 0, height: d?.height ?? 0, count: d?.frames.length ?? 0, labels: d?.labels ?? [] }
}

export const isSheetName = (s: string): s is SheetName => s in URLS

export type IconName = 'think' | 'damage' | 'defense' | 'fog' | 'evidence' | 'clue' | 'sure' | 'unsure' | 'seal' | 'hit' | 'weak' | 'fail'
export type KindName = 'literal' | 'connect' | 'author' | 'fog' | 'seal' | 'word'
