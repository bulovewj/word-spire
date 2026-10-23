import fs from 'node:fs/promises'
import path from 'node:path'
import vm from 'node:vm'
import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {execFile} from 'node:child_process'
import {promisify} from 'node:util'
import {root,browser,until,png,end} from '../../docs/design/board/source/cdp.mjs'
const runFile=promisify(execFile),review=path.join(root,'검토'),require=createRequire(path.join(root,'package.json')),sharp=require('sharp')
const context={window:{}};vm.runInNewContext(await fs.readFile(path.join(review,'보조자료/검토-데이터.js'),'utf8'),context)
const {assets,scenes}=context.window.BOARD_DATA
let localLinks=0,koreanFiles=0
async function checkLinks(file){const text=await fs.readFile(file,'utf8'),regex=file.endsWith('.html')?/(?:src|href)="([^"]+)"/g:/url\(['"]?([^'"\)]+)['"]?\)/g;for(const m of text.matchAll(regex)){const target=m[1].split('#')[0];if(!target)continue;assert.ok(!/^(?:https?:|\/\/)/.test(target),'외부 의존성');const resolved=path.resolve(path.dirname(file),decodeURIComponent(target));assert.ok(!path.relative(review,resolved).startsWith('..'),'폴더 밖 링크');await fs.access(resolved);localLinks++}}
async function walk(dir){for(const e of await fs.readdir(dir,{withFileTypes:true})){if(e.name.startsWith('.'))continue;const file=path.join(dir,e.name);if(e.isDirectory())await walk(file);else{assert.ok(!/[A-Za-z]/.test(path.basename(e.name,path.extname(e.name))),file);koreanFiles++;if(/\.(html|css)$/.test(file))await checkLinks(file)}}}
await walk(review)
const alphas=new Set()
for(const a of assets){for(const file of [a.file,a.reviewFrame].filter(Boolean))await fs.access(path.join(review,file));if(a.reviewFrame){const src=await sharp(path.join(review,a.file)).extract({left:a.index*a.w,top:0,width:a.w,height:a.h}).ensureAlpha().raw().toBuffer();const dst=await sharp(path.join(review,a.reviewFrame)).ensureAlpha().raw().toBuffer();assert.deepEqual(src,dst);for(let i=3;i<dst.length;i+=4)alphas.add(dst[i])}}
assert.deepEqual([...alphas].sort((a,b)=>a-b),[0,255]);assert.equal(scenes.length,36)
const fixture=await fs.mkdtemp('/private/tmp/낱말탑-검토검사-')
const refresh=()=>runFile(process.execPath,[path.join(review,'보조자료/검토본-갱신.mjs')],{cwd:root,env:{...process.env,WORD_SPIRE_REVIEW_OUTPUT:fixture}})
await refresh();await fs.writeFile(path.join(fixture,'수정요청.md'),'사용자가 직접 적은 수정요청\n')
await refresh();assert.equal(await fs.readFile(path.join(fixture,'수정요청.md'),'utf8'),'사용자가 직접 적은 수정요청\n');assert.equal(await fs.access(path.join(fixture,'이전판')).then(()=>true,()=>false),false)
await fs.appendFile(path.join(fixture,'00-최종검토.html'),'\n<!-- 이전 검토본 표식 -->\n');await refresh()
const archived=(await fs.readdir(path.join(fixture,'이전판')))[0]
assert.ok((await fs.readFile(path.join(fixture,'이전판',archived,'00-최종검토.html'),'utf8')).includes('이전 검토본 표식'));assert.equal(await fs.readFile(path.join(fixture,'수정요청.md'),'utf8'),'사용자가 직접 적은 수정요청\n')
const reports=[]
for(const width of [1280,390]){
 const b=await browser(width,width===390?844:800,true)
 await b.rpc('Network.setBlockedURLs',{urls:['http://*','https://*']})
 const open=async(file)=>{await b.rpc('Page.navigate',{url:'file://'+path.join(fixture,file)});await until(()=>b.run('document.readyState==="complete"'));await b.run("[...document.images].forEach(i=>i.loading='eager');true");await b.run('document.fonts.ready.then(()=>true)');await until(()=>b.run('[...document.images].every(i=>i.complete&&i.naturalWidth)'))}
 await open('00-최종검토.html')
 const home=await b.run('({width:innerWidth,scroll:document.documentElement.scrollWidth,font:document.fonts.check("16px Galmuri11"),images:document.images.length})');assert.equal(home.width,home.scroll);assert.ok(home.font)
 await png(b,path.join(review,`보조자료/최종검토-${width===390?'휴대폰':'노트북'}-확인.png`),width,width===390?1100:800)
 await open('01-장면별-그림과-움직임.html');await until(()=>b.run('!!window.boardMotionSnapshot'))
 const board=await b.run('({scenes:document.querySelectorAll(".scene").length,assets:document.querySelectorAll(".asset-card").length,frames:document.querySelectorAll(".asset-card .frame").length,width:innerWidth,scroll:document.documentElement.scrollWidth,korean:document.querySelector(".asset-card h3").textContent,reduced:boardMotionSnapshot().reduced})')
 assert.equal(board.scenes,18);assert.equal(board.assets,assets.length);assert.equal(board.frames,assets.filter(a=>a.index!==undefined).length);assert.equal(board.width,board.scroll);assert.equal(board.korean,'주인공-대기');assert.ok(board.reduced)
 await b.run("document.querySelector('#scene-filter').value='3';document.querySelector('#scene-filter').dispatchEvent(new Event('change'));document.querySelector('#scene-03 .marker[title=\"EN-dokkaebi-idle\"]').click()")
 assert.ok(await b.run('!!document.querySelector("#scene-03 .scene-item.selected")'))
 reports.push({width,home,board});console.log('한글 검토본 통과',width);await b.close()
}
await fs.writeFile(path.join(review,'보조자료/검토본-검사기록.json'),JSON.stringify({date:'2026-10-22',method:'검토 폴더만 별도 임시 위치에 재생성, HTTP/HTTPS 차단, file://로 열어 확인',koreanFiles,localLinks,frames:assets.filter(a=>a.index!==undefined).length,alphaValues:[...alphas].sort((a,b)=>a-b),pixelsEqual:true,feedbackPreserved:true,unchangedDoesNotArchive:true,previousBundleArchived:true,reports},null,2)+'\n')
await fs.rm(fixture,{recursive:true,force:true});end()
