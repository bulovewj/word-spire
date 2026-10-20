import { useSyncExternalStore } from 'react'
import { embedder, type EmbedderStatus } from '../grading/embedder'

export function useEmbedderStatus(): EmbedderStatus {
  return useSyncExternalStore(
    (cb) => embedder.subscribe(cb),
    () => embedder.getStatus(),
  )
}
