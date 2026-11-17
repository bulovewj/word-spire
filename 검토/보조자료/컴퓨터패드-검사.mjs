import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import {browser,end,png,until,root} from '../../docs/design/board/source/cdp.mjs'
const folder=`${root}/검토/컴퓨터패드배치`
await fs.mkdir(folder,{recursive:true})
const reports=[]
for(const [width,height,name] of [[1512,982,'컴퓨터'],[1280,800,'노트북'],[1024,768,'패드가로'],[820,1180,'패드세로'],[390,844,'휴대폰']]){
 const b=await browser(width,height)
 await b.rpc('Network.setBlockedURLs',{urls:['http://*','https://*']})
 await b.rpc('Page.navigate',{url:`file://${root}/검토/15-컴퓨터와패드-레이아웃.html`})
 await until(()=>b.run('!!document.querySelector(".battle")'))
 await b.run('document.fonts.ready')
 const measure=()=>b.run(`(()=>{const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}};return {width:innerWidth,scroll:document.documentElement.scrollWidth,font:document.fonts.check('18px Galmuri11'),bodyFont:getComputedStyle(document.querySelector('.sentence')).fontSize,text:rect('.battle-text'),stage:rect('.battle-stage'),field:rect('.battle-field'),bar:rect('.battle-bar'),hp:document.querySelector('.hpbar-text').textContent}})()`)
 const initial=await measure()
 assert.equal(initial.width,initial.scroll);assert.equal(initial.bodyFont,'18px');assert.ok(initial.font);assert.equal(initial.hp,'30 / 30')
 if(width>=1280){assert.ok(initial.text.x<initial.stage.x&&initial.stage.x<initial.field.x)}
 if(width===1024||width===820){assert.ok(initial.stage.y<initial.text.y);assert.ok(initial.text.x<initial.field.x)}
 await png(b,`${folder}/${name}-전투.png`,width,height)
 await b.click('질문: 거기 있음','.card')
 assert.equal(await b.run('document.querySelector(".qsubmit").disabled'),true)
 await b.run("document.querySelectorAll('.sentence')[3].click();document.querySelector('.qopt').click();document.querySelector('.qconf').click()")
 assert.equal(await b.run('document.querySelector(".qsubmit").disabled'),false)
 assert.equal(await b.run('document.querySelectorAll(".sentence.is-selected").length'),1)
 assert.equal((await measure()).scroll,width)
 await png(b,`${folder}/${name}-질문.png`,width,Math.max(height,await b.run('document.documentElement.scrollHeight')))
 await b.click('취소','.qpanel-actions button')
 await b.click('협력','.pouch-word')
 await b.input('#word-answer','함께 힘을 합치는 것')
 assert.equal((await measure()).scroll,width)
 await b.click('취소','.wpanel button')
 for(const floor of [2,3]){
   await b.click(`${floor}층 보기`,'.preview-tests button')
   assert.equal((await measure()).scroll,width)
   assert.equal(await b.run('!!document.querySelector(".unit-enemy .sprite")'),true)
 }
 await png(b,`${folder}/${name}-삼층.png`,width,Math.max(height,await b.run('document.documentElement.scrollHeight')))
 await b.click('1층 보기','.preview-tests button')
 for(let turn=0;turn<8;turn++){
   if(await b.run('!!document.querySelector(".overlay")'))break
   await b.click('턴 끝내기','.end-turn')
 }
 assert.ok(await b.run('document.querySelector(".overlay").textContent.includes("다시")'))
 await b.click('이 층 다시 하기','.overlay button')
 assert.equal((await measure()).hp,'30 / 30')
 reports.push({name,width,height,initial,questionSelection:true,wordInput:true,allFloorsFit:true,retryWorks:true,offline:true})
 console.log(`${name} ${width}px: 배치·질문·낱말·3층·재시작 통과`)
 await b.close()
}
await fs.writeFile(`${root}/검토/보조자료/컴퓨터패드-검사기록.json`,JSON.stringify({date:'2026-11-08',reports})+'\n')
end()
