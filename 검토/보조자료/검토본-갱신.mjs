// 검토용 한글 사본만 만든다. src·채점·콘텐츠·원본 그림은 수정하지 않는다.
import fs from 'node:fs/promises'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {createRequire} from 'node:module'
import crypto from 'node:crypto'
import {assetName,captureName,sheetNames} from './검토-이름표.mjs'
const root=fileURLToPath(new URL('../../',import.meta.url)),review=process.env.WORD_SPIRE_REVIEW_OUTPUT||path.join(root,'검토'),design=path.join(root,'docs/design')
const require=createRequire(path.join(root,'package.json')),sharp=require('sharp')
const date=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul'}).format(new Date())
const files=new Map(),paths=new Map(),frameRows=[]
const exists=async p=>fs.access(p).then(()=>true,()=>false)
const hash=b=>crypto.createHash('sha256').update(b).digest('hex')
const put=(name,data)=>{files.set(name,Buffer.isBuffer(data)?data:Buffer.from(data))}
const copy=async(from,to)=>{put(to,await fs.readFile(from));paths.set(path.resolve(from),to)}
const assets=JSON.parse(await fs.readFile(path.join(design,'board/assets.json'),'utf8'))
const scenes=JSON.parse(await fs.readFile(path.join(design,'board/scenes.json'),'utf8'))
const originalAssets=structuredClone(assets)
for(const a of assets){
 a.koreanName=assetName(a)
 if(!a.file)continue
 const from=path.resolve(design,a.reviewSource||a.file)
 if(a.reviewSource){a.runtime={width:a.w,height:a.h,scale:a.scale};a.w=a.reviewWidth;a.h=a.reviewHeight;a.scale=a.reviewScale}
 if(a.generationSource){const raw=path.resolve(design,a.generationSource),to='생성원본/'+sheetNames[a.name]+'-생성프롬프트.txt';if(!files.has(to))await copy(raw.replace('.png','.prompt.txt'),to)}
 if(a.id==='UI-grading-badge'){
  a.file='보조자료/채점상태배지-설명.md';put(a.file,'# 채점 상태 배지\n\nPNG 없이 HTML/CSS로 표시한다. 준비 중: 의미 채점 준비 n% · 간이 채점. 준비 완료: 의미 채점. 모델 실패: 간이 채점. 실제 분기는 src/ui/components/GradingBadge.tsx다.\n');paths.set(from,a.file);continue
 }
 const to='그림원본/'+(sheetNames[a.name]||a.koreanName)+path.extname(from)
 if(!files.has(to)){await copy(from,to);const prompt=from.replace(/\.(png|mp4)$/,'.prompt.txt');if(await exists(prompt))await copy(prompt,to.replace(/\.(png|mp4)$/,'-제작기록.txt'))}
 a.file=to
 if(a.index!==undefined){
  a.reviewFrame='그림프레임/'+a.koreanName+'.png'
  put(a.reviewFrame,await sharp(from).extract({left:a.index*a.w,top:0,width:a.w,height:a.h}).png().toBuffer())
  frameRows.push({id:a.id,name:a.koreanName,file:a.reviewFrame,source:to,index:a.index,width:a.w,height:a.h})
 }
}
for(const name of ['reader','dokkaebi','tiger','fox'])await copy(path.join(design,'concept/재제작-2판/동작한눈에',sheetNames[name]+'.png'),'동작한눈에/'+sheetNames[name]+'.png')
for(const name of ['옷자락-시작.png','옷자락-중간.png','옷자락-최대.png'])await copy(path.join(design,'concept/영상-재제작-2판',name),'비교자료/'+name)
await copy(path.join(design,'concept/영상-재제작-2판/영상-프레임검사.json'),'보조자료/영상-프레임검사.json')
await copy(path.join(design,'concept/영상-재제작-2판/실제플레이어-검사.json'),'보조자료/영상플레이어-검사.json')
await copy(path.join(design,'board/sprite-export-audit.json'),'보조자료/그림규격-검사.json')
for(const s of scenes){const to='장면캡처/'+captureName(s);await copy(path.join(design,s.file),to);s.file=to}
const crops={ 'key-tiger':'키아트-호랑이얼굴','key-reader':'키아트-주인공등판','reader-front':'주인공-앞깃','reader-back':'주인공-용문양','mobile-window':'휴대폰-캐릭터자리','reader-current':'현재-주인공한칸' }
for(const [from,to]of Object.entries(crops))await copy(path.join(design,`board/crops/${from}.png`),`비교자료/${to}.png`)
await copy(path.join(design,'스타일-기준.png'),'02-그림-스타일-비교.png')
await copy(path.join(root,'src/styles/tokens.css'),'보조자료/공통색과글꼴.css')
for(const [from,to]of [['Galmuri11.woff2','본문-보통.woff2'],['Galmuri11-Bold.woff2','본문-굵게.woff2'],['Galmuri9.woff2','작은글씨.woff2']])await copy(path.join(root,'node_modules/galmuri/dist',from),'보조자료/'+to)
await copy(path.join(root,'node_modules/galmuri/ofl-ko.md'),'보조자료/글꼴-이용허락.md')
let css=await fs.readFile(path.join(design,'board/board.css'),'utf8')
for(const [from,to]of [['Galmuri11.woff2','본문-보통.woff2'],['Galmuri11-Bold.woff2','본문-굵게.woff2'],['Galmuri9.woff2','작은글씨.woff2']])css=css.replace(`../../../node_modules/galmuri/dist/${from}`,to)
put('보조자료/장면보드-꾸밈.css',css)
put('보조자료/검토-데이터.js','window.BOARD_DATA={assets:[\n'+assets.map(a=>JSON.stringify(a)).join(',\n')+'\n],scenes:[\n'+scenes.map(s=>JSON.stringify(s)).join(',\n')+'\n]};\n')
let board=await fs.readFile(path.join(design,'asset-board.html'),'utf8')
for(const [from,to]of [['../../src/styles/tokens.css','보조자료/공통색과글꼴.css'],['board/board.css','보조자료/장면보드-꾸밈.css'],['board/data.js','보조자료/검토-데이터.js'],['board/board.js','보조자료/장면보드-구성.js'],['board/motion.js','보조자료/움직임-미리보기.js'],['에셋-대장.md','03-에셋-대장.md'],['스타일-기준.png','02-그림-스타일-비교.png'],['board/style.html','05-스타일-원본크기.html'],['스타일-설명.md','04-스타일-설명.md']])board=board.replaceAll(from,to)
board=board.replace('<nav aria-label="보드 바로가기">','<nav aria-label="보드 바로가기"><a href="00-최종검토.html">검토 첫 화면</a>')
put('01-장면별-그림과-움직임.html',board)
let js=await fs.readFile(path.join(design,'board/board.js'),'utf8')
js=js.replace("el('h3','',a.id),state","el('h3','',a.koreanName),el('p','',a.id),state")
 .replace('`${p.n} · ${p.id}`','`${p.n} · ${a.koreanName} · ${p.id}`')
 .replace("link.href=a.file","link.href=a.reviewFrame??a.file")
put('보조자료/장면보드-구성.js',js)
await copy(path.join(design,'board/motion.js'),'보조자료/움직임-미리보기.js')
let style=await fs.readFile(path.join(design,'board/style.html'),'utf8')
for(const [from,to]of [['../../../src/styles/tokens.css','보조자료/공통색과글꼴.css'],['board.css','보조자료/장면보드-꾸밈.css'],['style.css','보조자료/스타일비교-꾸밈.css']])style=style.replaceAll(from,to)
for(const [from,to]of Object.entries(crops))style=style.replaceAll(`crops/${from}.png`,`비교자료/${to}.png`)
put('05-스타일-원본크기.html',style)
await copy(path.join(design,'board/style.css'),'보조자료/스타일비교-꾸밈.css')
function localLinks(text,base){return text.replace(/\]\(([^)]+)\)/g,(whole,target)=>{const [file,anchor]=target.split('#');const resolved=path.resolve(base,file);return paths.has(resolved)?`](${paths.get(resolved)}${anchor?'#'+anchor:''})`:whole})}
paths.set(path.join(design,'asset-board.html'),'01-장면별-그림과-움직임.html');paths.set(path.join(design,'스타일-설명.md'),'04-스타일-설명.md')
let ledger=await fs.readFile(path.join(design,'에셋-대장.md'),'utf8')
ledger=localLinks(ledger,design).split('\n').map(line=>{const id=line.match(/^\| (\S+) \|/)?.[1],a=assets.find(a=>a.id===id);return a?.file?line.replace(/\[[^\]]+\]\([^)]+\)/,`[${a.koreanName}](${a.reviewFrame||a.file})`):line}).join('\n')
put('03-에셋-대장.md',ledger)
put('04-스타일-설명.md',localLinks(await fs.readFile(path.join(design,'스타일-설명.md'),'utf8'),design))
for(const [from,to]of [['board-audit.json','원본보드-검수기록.json'],['title-audit.json','시작화면-검수기록.json'],['title-compression-audit.json','시작배경-압축기록.json']])await copy(path.join(design,'board',from),'보조자료/'+to)
put('보조자료/그림목록.json',JSON.stringify({date,assets,frames:frameRows},null,0)+'\n')
put('보조자료/장면목록.json',JSON.stringify(scenes)+'\n')
const pairs=JSON.parse(await fs.readFile(path.join(design,'board/cleanup-comparison.json'),'utf8'))
let cleanup=await fs.readFile(path.join(design,'조각정리-전후비교.html'),'utf8')
cleanup=cleanup.replaceAll('../../src/styles/tokens.css','보조자료/공통색과글꼴.css').replaceAll('board/board.css','보조자료/장면보드-꾸밈.css')
for(const c of pairs)for(const key of ['before','after']){const to='조각비교/'+path.basename(c[key]);await copy(path.join(design,c[key]),to);cleanup=cleanup.replaceAll(c[key],to)}
put('06-조각정리-전후비교.html',cleanup)
await copy(path.join(design,'스프라이트-조각-검사.md'),'07-프레임별-조각검사.md')
await copy(path.join(design,'board/title-video-compression-audit.json'),'보조자료/시작영상-압축검사.json')
const home=await fs.readFile(new URL('./검토-첫화면-원본.txt',import.meta.url),'utf8')
put('00-최종검토.html',home.replaceAll('18장면·36캡처',`${new Set(scenes.map(s=>s.num)).size}장면·${scenes.length}캡처`).replaceAll('40프레임',`${frameRows.length}프레임`))
put('보조자료/검토-첫화면.css',await fs.readFile(new URL('./검토-첫화면-원본.css',import.meta.url)))
put('검토-규칙.md',await fs.readFile(new URL('./검토-규칙-원본.md',import.meta.url)))
if(!await exists(path.join(review,'수정요청.md')))put('수정요청.md',await fs.readFile(new URL('./수정요청-빈양식.md',import.meta.url)))
const manifest={date,source:'요청7 조각 정리·영상 압축판',assets:assets.length,scenes:18,captures:scenes.length,frames:frameRows.length,originalNames:originalAssets.map((a,i)=>({id:a.id,original:a.file,korean:assets[i].reviewFrame||assets[i].file})),files:[...files].filter(([file])=>file!=='수정요청.md').map(([file,data])=>({file,bytes:data.length,sha256:hash(data)}))}
put('보조자료/파일목록.json',JSON.stringify(manifest)+'\n')
let changed=false
for(const [name,data]of files){const file=path.join(review,name);if(!await exists(file)||hash(await fs.readFile(file))!==hash(data)){changed=true;break}}
if(changed&&await exists(path.join(review,'00-최종검토.html'))){
 let n=1,archive
 do{archive=path.join(review,'이전판',`${date}-${String(n++).padStart(3,'0')}`)}while(await exists(archive))
 await fs.mkdir(archive,{recursive:true})
 for(const e of await fs.readdir(review,{withFileTypes:true}))if(e.name!=='이전판')await fs.cp(path.join(review,e.name),path.join(archive,e.name),{recursive:true})
 console.log('이전 검토본 보존:',path.relative(root,archive))
}
for(const [name,data]of files){const to=path.join(review,name);await fs.mkdir(path.dirname(to),{recursive:true});await fs.writeFile(to,data)}
console.log(`검토본 갱신: ${assets.length}행 / ${scenes.length}캡처 / ${frameRows.length}프레임 / ${files.size}파일`)
