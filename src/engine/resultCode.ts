// 결과 코드 (기획안 9장 · 작업지시서 F8). 이름 + 영역별 집계 → JSON → 압축 → base64.
// 학생이 직접 복사해 제출한다. 코드 안에는 집계 숫자만 있고 학생 답 글은 없다.
import { AREAS, type AreaStat, type Stats, type Tally } from './stats'

const PREFIX = 'NT1-'          // 압축
const PREFIX_RAW = 'NT1R-'     // 압축을 못 하는 옛 브라우저(CompressionStream 없음)
const NAME_MAX = 20

export interface ResultCard { name: string; stats: Stats }

interface Payload { n: string; a: number[][]; j: number[] }

async function pipe(bytes: Uint8Array<ArrayBuffer>, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const out = new Blob([bytes]).stream().pipeThrough(stream)
  return new Uint8Array(await new Response(out).arrayBuffer())
}

function toBase64Url(bytes: Uint8Array): string {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(s: string): Uint8Array<ArrayBuffer> {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(bin, (c) => c.charCodeAt(0))
}

export async function encodeResult({ name, stats }: ResultCard): Promise<string> {
  const p: Payload = {
    n: name.trim().slice(0, NAME_MAX),
    a: AREAS.map((k) => [stats.areas[k].correct, stats.areas[k].total, stats.areas[k].helped]),
    j: [stats.sure.correct, stats.sure.total, stats.unsure.correct, stats.unsure.total],
  }
  const json = new TextEncoder().encode(JSON.stringify(p))
  if (typeof CompressionStream === 'undefined') return PREFIX_RAW + toBase64Url(json)
  return PREFIX + toBase64Url(await pipe(json, new CompressionStream('deflate-raw')))
}

const isCount = (x: unknown): x is number => Number.isInteger(x) && (x as number) >= 0

function tallyOf(c: unknown, t: unknown): Tally | null {
  return isCount(c) && isCount(t) && c <= t ? { correct: c, total: t } : null
}

/** 읽을 수 없으면 null (교사 화면에서 그 줄만 "읽을 수 없는 코드") */
export async function decodeResult(code: string): Promise<ResultCard | null> {
  const s = code.trim()
  const compressed = s.startsWith(PREFIX)
  if (!compressed && !s.startsWith(PREFIX_RAW)) return null
  try {
    const bytes = fromBase64Url(s.slice((compressed ? PREFIX : PREFIX_RAW).length))
    const raw = compressed ? await pipe(bytes, new DecompressionStream('deflate-raw')) : bytes
    const p = JSON.parse(new TextDecoder().decode(raw)) as Partial<Payload>
    if (typeof p.n !== 'string' || !Array.isArray(p.a) || p.a.length !== AREAS.length || !Array.isArray(p.j)) return null
    const areas = {} as Stats['areas']
    for (const [i, k] of AREAS.entries()) {
      const row = p.a[i]
      const t = Array.isArray(row) ? tallyOf(row[0], row[1]) : null
      if (!t || !Array.isArray(row) || !isCount(row[2])) return null
      areas[k] = { ...t, helped: row[2] } satisfies AreaStat
    }
    const sure = tallyOf(p.j[0], p.j[1])
    const unsure = tallyOf(p.j[2], p.j[3])
    if (!sure || !unsure) return null
    return { name: p.n.slice(0, NAME_MAX), stats: { areas, sure, unsure } }
  } catch {
    return null
  }
}
