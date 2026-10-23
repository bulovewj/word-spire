import fs from 'node:fs/promises'
import {browser,png,until,root,end} from './cdp.mjs'
const b=await browser(1280,1600)
await b.rpc('Page.navigate',{url:'http://127.0.0.1:5176/docs/design/board/style.html'})
await until(()=>b.run('document.readyState==="complete" && document.images.length>0 && [...document.images].every(i=>i.complete&&i.naturalWidth)'))
await b.run('document.fonts.ready.then(()=>true)')
const size=await b.run('({w:document.documentElement.scrollWidth,h:document.documentElement.scrollHeight,font:document.fonts.check("16px Galmuri11")})')
await png(b,`${root}/docs/design/스타일-기준.png`,1280,size.h)
console.log(size)
await b.close();end()
