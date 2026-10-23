import fs from 'node:fs/promises'
import path from 'node:path'
import {execFileSync} from 'node:child_process'
import assert from 'node:assert/strict'
import {root,browser,until,end} from './cdp.mjs'
const tracked=execFileSync('git',['ls-files','-z','--','검토/'],{cwd:root,encoding:'utf8'}).split('\0').filter(Boolean)
assert.ok(!tracked.some(p=>p.startsWith('검토/이전판/')||p.startsWith('검토/생성원본/')&&p.endsWith('.png')))
const fixture=await fs.mkdtemp('/private/tmp/낱말탑-추적검토-')
for(const file of tracked){const to=path.join(fixture,file.slice('검토/'.length));await fs.mkdir(path.dirname(to),{recursive:true});await fs.copyFile(path.join(root,file),to)}
const reports=[]
for(const width of [1280,390]){
 const b=await browser(width,width===390?844:800,true);await b.rpc('Network.setBlockedURLs',{urls:['http://*','https://*']})
 for(const file of ['00-최종검토.html','06-조각정리-전후비교.html']){
  await b.rpc('Page.navigate',{url:'file://'+path.join(fixture,file)});await until(()=>b.run('document.readyState==="complete"'));await b.run("[...document.images].forEach(i=>i.loading='eager');true");await b.run('document.fonts.ready.then(()=>true)');await until(()=>b.run('[...document.images].every(i=>i.complete&&i.naturalWidth)'))
  const view=await b.run('({width:innerWidth,scroll:document.documentElement.scrollWidth,images:document.images.length,broken:[...document.images].filter(i=>!i.naturalWidth).length,font:document.fonts.check("16px Galmuri11")})');assert.equal(view.width,view.scroll);assert.equal(view.broken,0);assert.ok(view.font)
  if(file.startsWith('06'))assert.equal(view.images,66)
  reports.push({file,...view})
 }
 await b.close()
}
await fs.writeFile(root+'/docs/design/board/review-tracked-audit.json',JSON.stringify({date:'2026-10-22',method:'Git 추적 파일만 복사, 원본PNG/이전판 없이 HTTP·HTTPS 차단한 file:// 열기',trackedFiles:tracked.length,reports})+'\n');await fs.rm(fixture,{recursive:true,force:true});end();console.log('Git 추적 파일만으로 현재 검토본·조각 비교 PC/390 통과')
