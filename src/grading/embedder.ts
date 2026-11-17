// 메인 스레드 쪽 임베딩 창구: 로딩 상태·진행률, 문장 벡터 캐시(키: 문장 그대로)
import { cosine } from './cosine'
import type { WorkerIn, WorkerOut } from './embed.worker'

export interface EmbedderStatus {
  state: 'idle' | 'loading' | 'ready' | 'failed'
  progress: number
}

type Pending = { resolve: (v: number[][]) => void; reject: (e: Error) => void; timer: ReturnType<typeof setTimeout> }
const REQUEST_TIMEOUT = 60_000

export class Embedder {
  private worker: Worker | null = null
  private status: EmbedderStatus = { state: 'idle', progress: 0 }
  private listeners = new Set<(s: EmbedderStatus) => void>()
  private cache = new Map<string, number[]>()
  private pending = new Map<number, Pending>()
  private nextId = 1

  getStatus(): EmbedderStatus {
    return this.status
  }

  subscribe(fn: (s: EmbedderStatus) => void): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  /** 모델 내려받기 시작. 여러 번 불러도 한 번만 */
  start(): void {
    if (this.worker) return
    try {
      this.worker = new Worker(new URL('./embed.worker.ts', import.meta.url), { type: 'module' })
    } catch {
      this.setStatus({ state: 'failed', progress: 0 })
      return
    }
    this.worker.onmessage = (ev: MessageEvent<WorkerOut>) => this.onMessage(ev.data)
    this.worker.onerror = () => this.fail(new Error('의미 채점 워커 오류'))
    this.worker.onmessageerror = () => this.fail(new Error('의미 채점 응답 오류'))
    this.setStatus({ state: 'loading', progress: 0 })
    this.send({ type: 'load' })
  }

  /** 문장들의 벡터. 캐시에 없는 것만 워커에 보낸다 */
  async embed(texts: string[]): Promise<number[][]> {
    const missing = [...new Set(texts.filter((t) => !this.cache.has(t)))]
    if (missing.length > 0) {
      const vectors = await this.request(missing)
      missing.forEach((t, i) => { const v = vectors[i]; if (v) this.cache.set(t, v) })
    }
    return texts.map((t) => this.cache.get(t) ?? [])
  }

  /** 답 하나와 기준 문장들의 코사인 유사도 */
  async similarities(answer: string, refs: string[]): Promise<number[]> {
    const [a = [], ...rest] = await this.embed([answer, ...refs])
    return rest.map((v) => cosine(a, v))
  }

  /** 준비되면 미리 계산해 둘 문장들(전투 시작 때 비교 대상 뜻) */
  prewarm(texts: string[]): void {
    if (this.status.state === 'ready') void this.embed(texts).catch(() => undefined)
  }

  private request(texts: string[]): Promise<number[][]> {
    if (!this.worker || this.status.state !== 'ready') return Promise.reject(new Error('의미 채점이 준비되지 않음'))
    const id = this.nextId++
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => this.fail(new Error('의미 채점 시간 초과')), REQUEST_TIMEOUT)
      this.pending.set(id, { resolve, reject, timer })
      try { this.send({ type: 'embed', id, texts }) } catch {
        this.fail(new Error('의미 채점 요청 오류'))
      }
    })
  }

  private send(m: WorkerIn): void {
    this.worker?.postMessage(m)
  }

  private onMessage(m: WorkerOut): void {
    if (m.type === 'progress') this.setStatus({ state: 'loading', progress: m.progress })
    else if (m.type === 'ready') this.setStatus({ state: 'ready', progress: 100 })
    else if (m.type === 'failed') this.fail(new Error(m.message))
    else {
      const p = this.pending.get(m.id)
      this.pending.delete(m.id)
      if (p) clearTimeout(p.timer)
      if (m.type === 'result') p?.resolve(m.vectors)
      else p?.reject(new Error(m.message))
    }
  }

  /** 기다리는 채점도 모두 끝내야 화면이 간이 채점으로 이어진다. */
  private fail(error: Error): void {
    this.worker?.terminate()
    this.worker = null
    for (const p of this.pending.values()) { clearTimeout(p.timer); p.reject(error) }
    this.pending.clear()
    this.setStatus({ state: 'failed', progress: this.status.progress })
  }

  private setStatus(s: EmbedderStatus): void {
    this.status = s
    for (const fn of this.listeners) fn(s)
  }
}

export const embedder = new Embedder()
