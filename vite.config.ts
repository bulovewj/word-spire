import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',
  plugins: [react()],
  worker: { format: 'es' },   // 임베딩 워커가 동적 import를 쓴다
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
})
