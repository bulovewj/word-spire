import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import {root,browser,until,png,end} from './cdp.mjs'
for(const width of [1280,390]){
 const b=await browser(width,width===390?844:800,true)
 await b.rpc('Page.navigate',{url:'http://127.0.0.1:5176/docs/design/asset-board.html'})
 await until(()=>b.run('!!window.boardMotionSnapshot'))
 await b.run('document.fonts.ready.then(()=>true)')
 const counts=await b.run('({scenes:document.querySelectorAll(".scene").length,assets:document.querySelectorAll(".asset-card").length,captures:window.BOARD_DATA.scenes.length,loop:!!document.querySelector("#scene-01 .marker[title=\\"KEY-title-loop\\"]"),width:innerWidth,scroll:document.documentElement.scrollWidth})')
 assert.equal(counts.scenes,18);assert.equal(counts.assets,87);assert.equal(counts.captures,36);assert.equal(counts.width,counts.scroll);assert.ok(counts.loop)
 const period=await b.run(`(()=>{const i=document.querySelector('.actor input');i.value='5000';i.dispatchEvent(new Event('change'));const clamped=boardMotionSnapshot().actors[0].period;i.value='2800';i.dispatchEvent(new Event('change'));return clamped})()`)
 assert.equal(period,3400)
 await png(b,`${root}/docs/design/board/board-${width}-preview.png`,width,width===390?1100:800)
 console.log(counts,'주기 범위 제한',period);await b.close()
}
end()
