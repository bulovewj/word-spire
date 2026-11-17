// 기존 엔진·화면을 재사용하는 오프라인 검토본. 런타임 src는 수정하지 않는다.
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'
import react from '@vitejs/plugin-react'
const root=fileURLToPath(new URL('../../',import.meta.url)), out='/private/tmp/word-spire-layout-build'
const result=await build({configFile:false,root,define:{'process.env.NODE_ENV':'"production"'},plugins:[react(),{
  name:'review-simple-grading',
  // 검토본은 모델을 시작하지 않는다. worker를 번들에서도 제외한다.
  load(id){if(id===path.join(root,'src/grading/embedder.ts'))return `export const embedder={getStatus:()=>({state:'idle',progress:0}),prewarm:()=>{},similarities:async()=>{throw Error('검토본은 간이 채점')}}`}
}],build:{outDir:out,emptyOutDir:true,assetsInlineLimit:Infinity,cssCodeSplit:false,
  lib:{entry:path.join(root,'검토/보조자료/컴퓨터패드-시안.tsx'),name:'WordSpireLayout',formats:['iife'],fileName:()=> 'preview.js'},
  minify:true}})
const bundles=Array.isArray(result)?result:[result]
const outputs=bundles.flatMap(b=>b.output)
const js=outputs.find(o=>o.type==='chunk').code.replaceAll('</script','<\\/script')
const css=outputs.filter(o=>o.type==='asset'&&o.fileName.endsWith('.css')).map(o=>o.source).join('\n')
const html=`<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>낱말탑 · 컴퓨터와 패드 레이아웃 제안</title><style>${css}</style></head><body><div id="root"></div><script>${js}</script></body></html>`
await fs.writeFile(path.join(root,'검토/15-컴퓨터와패드-레이아웃.html'),html)
console.log('오프라인 레이아웃 검토본 생성 완료')
