// 문장 임베딩 워커. 학생 답은 이 워커 안에서만 다루고 밖으로 보내지 않는다.
import { env, pipeline, type FeatureExtractionPipeline } from '@huggingface/transformers'
import mjsUrl from 'onnxruntime-web/ort-wasm-simd-threaded.mjs?url'
import wasmUrl from 'onnxruntime-web/ort-wasm-simd-threaded.wasm?url'
import { POLICY } from './policy'

export type WorkerIn =
  | { type: 'load' }
  | { type: 'embed'; id: number; texts: string[] }

export type WorkerOut =
  | { type: 'progress'; progress: number }
  | { type: 'ready' }
  | { type: 'failed'; message: string }
  | { type: 'result'; id: number; vectors: number[][] }
  | { type: 'embedFailed'; id: number; message: string }

const ctx = self as unknown as DedicatedWorkerGlobalScope
const post = (m: WorkerOut) => ctx.postMessage(m)

// 실행 엔진(wasm)은 앱과 함께 묶어 둔 파일을 쓴다(외부 CDN 요청 없음). 모델 파일만 내려받는다.
env.allowLocalModels = false
const wasm = env.backends.onnx.wasm
if (wasm) {
  wasm.wasmPaths = { mjs: mjsUrl, wasm: wasmUrl }
  wasm.numThreads = 1
}

let extractor: Promise<FeatureExtractionPipeline> | null = null

function load(): Promise<FeatureExtractionPipeline> {
  extractor ??= pipeline('feature-extraction', POLICY.model, {
    dtype: POLICY.dtype,
    progress_callback: (p) => {
      if (p.status === 'progress_total') post({ type: 'progress', progress: Math.round(p.progress) })
    },
  })
  return extractor
}

ctx.onmessage = async (ev: MessageEvent<WorkerIn>) => {
  const msg = ev.data
  if (msg.type === 'load') {
    try {
      await load()
      post({ type: 'ready' })
    } catch (e) {
      extractor = null
      post({ type: 'failed', message: e instanceof Error ? e.message : String(e) })
    }
    return
  }
  try {
    const run = await load()
    const out = await run(msg.texts.map((t) => POLICY.inputPrefix + t), { pooling: 'mean', normalize: true })
    post({ type: 'result', id: msg.id, vectors: out.tolist() as number[][] })
  } catch (e) {
    post({ type: 'embedFailed', id: msg.id, message: e instanceof Error ? e.message : String(e) })
  }
}
