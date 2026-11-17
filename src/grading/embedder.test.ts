import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Embedder } from './embedder'
import type { WorkerOut } from './embed.worker'

class FakeWorker {
  static current: FakeWorker
  onmessage: ((e: { data: WorkerOut }) => void) | null = null
  onerror: (() => void) | null = null
  onmessageerror: (() => void) | null = null
  postMessage = vi.fn()
  terminate = vi.fn()
  constructor() { FakeWorker.current = this }
  reply(data: WorkerOut) { this.onmessage?.({ data }) }
}

beforeEach(() => { vi.useFakeTimers(); vi.stubGlobal('Worker', FakeWorker) })
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals() })

function ready() {
  const e = new Embedder()
  e.start()
  FakeWorker.current.reply({ type: 'ready' })
  return e
}

describe('의미 채점 워커의 실패 복구', () => {
  it('워커가 죽으면 기다리던 채점을 모두 끝내 간이 채점으로 넘긴다', async () => {
    const e = ready()
    const a = expect(e.embed(['첫 답'])).rejects.toThrow('워커 오류')
    const b = expect(e.embed(['둘째 답'])).rejects.toThrow('워커 오류')
    FakeWorker.current.onerror?.()
    await Promise.all([a, b])
    expect(e.getStatus().state).toBe('failed')
    expect(FakeWorker.current.terminate).toHaveBeenCalledOnce()
    expect(vi.getTimerCount()).toBe(0)
  })
  it('응답이 없으면 무한히 채점 중으로 남지 않는다', async () => {
    const e = ready()
    const pending = expect(e.embed(['답'])).rejects.toThrow('시간 초과')
    await vi.advanceTimersByTimeAsync(60_000)
    await pending
    expect(e.getStatus().state).toBe('failed')
  })
  it('성공한 답은 캐시하고 제한 시간 타이머를 지운다', async () => {
    const e = ready()
    const answer = e.embed(['답'])
    FakeWorker.current.reply({ type: 'result', id: 1, vectors: [[1, 0]] })
    expect(await answer).toEqual([[1, 0]])
    expect(await e.embed(['답'])).toEqual([[1, 0]])
    expect(vi.getTimerCount()).toBe(0)
    expect(FakeWorker.current.postMessage).toHaveBeenCalledTimes(2)
  })
  it('아직 준비되지 않은 워커에는 요청을 남기지 않는다', async () => {
    await expect(new Embedder().embed(['답'])).rejects.toThrow('준비되지 않음')
  })
})
