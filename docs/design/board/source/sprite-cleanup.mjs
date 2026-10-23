import fs from 'node:fs/promises'
import {fileURLToPath} from 'node:url'
import {createRequire} from 'node:module'
import assert from 'node:assert/strict'
import {cleanSheet,summary,keepReason} from './sprite-components.mjs'
const root=fileURLToPath(new URL('../../../../',import.meta.url)),sharp=createRequire(root+'package.json')('sharp'),base=root+'docs/design/concept/재제작-2판/',frames=JSON.parse(await fs.readFile(root+'src/ui/sprites/frames.json','utf8'))
const baseline=JSON.parse(await fs.readFile(new URL('./sprite-components-before.json',import.meta.url),'utf8')),audit=JSON.parse(await fs.readFile(root+'src/ui/sprites/sprite-audit.json','utf8')),report=[]
const names={reader:'주인공-동작모음',dokkaebi:'먹안개도깨비-동작모음',tiger:'뒤섞는호랑이-동작모음',fox:'헛소문여우-동작모음',seal:'호리병봉인-세단계',gourd:'호리병',icons:'기능아이콘-열두종','card-kinds':'카드종류표식-여섯종','card-frame':'카드틀-미사용초안'}
const oldSummary=c=>({bodyPixels:c[0].area,detachedCount:c.length-1,smallDetachedCount:c.slice(1).filter(c=>c.area<=12).length,detached:c.slice(1)})
for(const [name,f]of Object.entries(frames)){
 const size=f.width*2,file=base+'정리시트/'+names[name]+'.png',cleaned=await cleanSheet(await fs.readFile(file),size,f.labels,name,sharp),game=await sharp(cleaned).resize(f.width*f.labels.length,f.height,{kernel:'nearest'}).png({compressionLevel:9}).toBuffer()
 await fs.writeFile(file,cleaned);await fs.writeFile(root+'src/ui/sprites/'+name+'.png',game)
 const masterCells=[]
 for(const [i,label]of f.labels.entries()){
  const original=baseline.find(b=>b.name===name&&b.label===label),masterCell=await sharp(cleaned).extract({left:i*size,top:0,width:size,height:size}).png().toBuffer(),masterRaw=await sharp(masterCell).ensureAlpha().raw().toBuffer(),gameRaw=await sharp(game).extract({left:i*f.width,top:0,width:f.width,height:f.height}).ensureAlpha().raw().toBuffer(),m=summary(masterRaw,size,size),g=summary(gameRaw,f.width,f.height),reason=keepReason(name,label)
  assert.equal(m.bodyPixels,original.master[0].area,'마스터 몸통 보존');assert.equal(g.bodyPixels,original.game[0].area,'게임 몸통 보존')
  if(m.detachedCount||g.detachedCount)assert.ok(reason,'남긴 조각의 이유 필요: '+name+':'+label)
  masterCells.push(masterCell)
  report.push({name,frame:label,index:i,master:{size,before:oldSummary(original.master),after:m},game:{size:f.width,before:oldSummary(original.game),after:g},removedMasterPixels:original.master.reduce((n,c)=>n+c.area,0)-masterRaw.filter((_,i)=>i%4===3&&masterRaw[i]===255).length,retainedReason:reason})
 }
 if(['reader','dokkaebi','tiger','fox'].includes(name))await sharp({create:{width:size*4,height:size*Math.ceil(masterCells.length/4),channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(masterCells.map((input,i)=>({input,left:i%4*size,top:Math.floor(i/4)*size}))).png().toFile(base+'동작한눈에/'+names[name]+'.png')
 for(const [kind,b]of [['master',cleaned],['game',game]]){const {data}=await sharp(b).ensureAlpha().raw().toBuffer({resolveWithObject:true}),alpha=new Set(),colors=new Set();let opaque=0;for(let p=0;p<data.length;p+=4){alpha.add(data[p+3]);if(data[p+3]){opaque++;colors.add(data.subarray(p,p+3).toString('hex'))}else assert.equal(data[p]+data[p+1]+data[p+2],0)}assert.deepEqual([...alpha].sort((a,b)=>a-b),[0,255]);if(kind==='game'){const a=audit.art.find(a=>a.name===name);a.opaquePixels=opaque;a.opaqueColors=colors.size;if(!a.method.includes('request7'))a.method+='; request7 reviewed connected-component cleanup'}}
}
audit.version='v2.1-clean';audit.componentAudit={connectivity:8,smallAreaMaximum:12,definition:'알파255 픽셀의 8방향 연결. 최대 면적 덩어리=몸. 그 밖의 면적12px 이하를 논리 해상도별로 따로 센다. 큰 잘림 조각도 함께 검사·제거한다.',baseline:'docs/design/board/source/sprite-components-before.json',policy:'docs/design/board/source/sprite-cleanup-policy.json',frames:report}
await fs.writeFile(root+'src/ui/sprites/sprite-audit.json',JSON.stringify({...audit,componentAudit:{...audit.componentAudit,frames:undefined}}).slice(0,-1)+',"frameComponents":[\n'+report.map(r=>JSON.stringify(r)).join(',\n')+'\n]}\n')
let text='# 프레임별 조각 검사 — 요청7\n\n알파255·8방향 연결, 가장 큰 덩어리 밖의 **12px 이하 면적**을 센다. `작은 수 / 전체 분리 수`로 표기하며, 마스터와 게임 사본의 논리 픽셀을 각각 센다. 몸·색·바닥선은 이동하지 않는다.\n\n| 시트·프레임 | 마스터 전→후(작은/전체) | 게임 전→후(작은/전체) | 남긴 이유 |\n|---|---|---|---|\n'
for(const r of report){const cell=s=>`${s.smallDetachedCount}/${s.detachedCount}`;text+=`| ${r.name} ${r.frame} | ${cell(r.master.before)} → ${cell(r.master.after)} | ${cell(r.game.before)} → ${cell(r.game.after)} | ${r.retainedReason||'남긴 조각 없음'} |\n`}
await fs.writeFile(root+'docs/design/스프라이트-조각-검사.md',text)
console.log('72프레임 정리·이진 알파 검사·게임 사본 재생성 완료. 제거 마스터 픽셀',report.reduce((s,r)=>s+r.removedMasterPixels,0))
