import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import {root,browser,until,wait,png,end} from './cdp.mjs'
const reports=[]
for(const [width,reduced] of [[1280,false],[390,false],[390,true]]){
 const b=await browser(width,width===390?844:800,reduced)
 await b.nav();await b.run('localStorage.clear()');await b.nav();await b.run('document.fonts.ready.then(()=>true)')
 const measure=()=>b.run(`({width:innerWidth,scroll:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,buttons:[...document.querySelectorAll('button')].map(e=>({text:e.textContent,h:e.getBoundingClientRect().height,w:e.getBoundingClientRect().width})),video:document.querySelectorAll('video').length,poster:{width:document.querySelector('.title-art-image').naturalWidth,height:document.querySelector('.title-art-image').naturalHeight},badge:document.querySelector('.badge').textContent})`)
 const fresh=await measure();assert.equal(fresh.width,fresh.scroll);assert.ok(fresh.buttons.every(e=>e.h>=44&&e.w>=44));assert.deepEqual(fresh.poster,{width:1232,height:693});if(reduced)assert.equal(fresh.video,0)
 await b.rpc('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});await b.rpc('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9})
 const focus=await b.run('({tag:document.activeElement.tagName,outline:getComputedStyle(document.activeElement).outlineWidth,visible:document.activeElement.matches(":focus-visible")})');assert.ok(focus.visible);assert.equal(focus.outline,'3px')
 if(!reduced){await b.click('움직임 끄기','.title-motion');assert.equal(await b.run('document.querySelectorAll("video").length'),0);await b.click('움직임 켜기','.title-motion');assert.equal(await b.run('document.querySelectorAll("video").length'),1)}
 await b.click('내 기록','.title-secondary button');await until(()=>b.run('!!document.querySelector(".name-field")'))
 await b.nav();await b.click('선생님','.title-secondary button');await until(()=>b.run('!!document.querySelector(".screen-wide textarea")'))
 await b.nav();await b.click('꿀벌 탑','.title-tower');await until(()=>b.run('document.body.textContent.includes("1층으로")'))
 await b.click('1층으로');await until(()=>b.run('!!document.querySelector(".battle")'))
 await b.nav();const saved=await measure();assert.equal(saved.width,saved.scroll);assert.ok(saved.buttons.every(e=>e.h>=44&&e.w>=44));assert.ok(saved.buttons.some(e=>e.text.includes('꿀벌 탑 · 1층')));assert.ok(await b.run('document.querySelector(".title-save-warning").textContent.includes("지워져")'));if(width===1280)assert.equal(saved.height,800)
 await png(b,`${root}/docs/design/board/title-${width}${reduced?'-reduced':''}-saved.png`,width,width===390?saved.height:800)
 await b.click('이어하기','.title-continue');await until(()=>b.run('!!document.querySelector(".battle")'))
 await b.nav();await b.click('꿀벌 탑','.title-tower');await until(()=>b.run('document.body.textContent.includes("1층으로")'))
 if(!reduced){await b.nav();await b.rpc('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await until(()=>b.run('!document.querySelector("video")'));assert.ok(await b.run('document.querySelector(".title-motion").disabled'))}
 reports.push({width,reduced,fresh,saved,focus,navigation:'内 기록·선생님·새 탑·전투 저장·이어하기·진행 중 새 탑 선택 통과'.replace('内','내')});console.log('시작 화면 통과',width,reduced)
 await b.close()
}
await fs.writeFile(`${root}/docs/design/board/title-audit.json`,JSON.stringify({date:'2026-10-22',reports})+'\n');end()
