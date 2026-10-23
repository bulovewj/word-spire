import {fileURLToPath} from "node:url"
import fs from 'node:fs/promises'
export const root=fileURLToPath(new URL('../../../../',import.meta.url)).replace(/\/$/,'')
const endpoint = await (await fetch('http://127.0.0.1:9230/json/version')).json()
const ws = new WebSocket(endpoint.webSocketDebuggerUrl)
await new Promise(r => ws.addEventListener('open', r, {once:true}))
let serial=0
const jobs=new Map()
ws.addEventListener('message',({data})=>{const m=JSON.parse(data); if(!m.id)return; const j=jobs.get(m.id); jobs.delete(m.id); m.error?j.reject(Error(JSON.stringify(m.error))):j.resolve(m.result)})
export function command(method,params={},sessionId){return new Promise((resolve,reject)=>{const id=++serial; jobs.set(id,{resolve,reject}); ws.send(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})}))})}
export const wait=ms=>new Promise(r=>setTimeout(r,ms))
export async function browser(width=1280,height=800,reduced=true){
  const {targetId}=await command('Target.createTarget',{url:'about:blank'})
  const {sessionId}=await command('Target.attachToTarget',{targetId,flatten:true})
  const rpc=(method,params)=>command(method,params,sessionId)
  const run=async(expression)=>{const v=await rpc('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true}); if(v.exceptionDetails)throw Error(JSON.stringify(v.exceptionDetails)); return v.result.value}
  await rpc('Page.enable'); await rpc('Network.enable')
  await rpc('Network.setBlockedURLs',{urls:['*huggingface.co*','*cdn-lfs*','*jsdelivr.net*']})
  await rpc('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<500})
  await rpc('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:reduced?'reduce':'no-preference'}]})
  const nav=async()=>{await rpc('Page.navigate',{url:'http://127.0.0.1:5176/'}); await until(()=>run('!!document.querySelector(".title-paper")'))}
  const click=async(label,selector='button')=>{await until(()=>run(`(()=>{const b=[...document.querySelectorAll(${JSON.stringify(selector)})].find(b=>!b.disabled&&b.textContent.includes(${JSON.stringify(label)}));if(!b)return false;b.click();return true})()`));await wait(100)}
  const input=async(selector,value)=>{await run(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});const proto=e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));return true})()`);await wait(80)}
  return {rpc,run,nav,click,input,activate:()=>command('Target.activateTarget',{targetId}),close:()=>command('Target.closeTarget',{targetId})}
}
export async function until(fn){for(let n=0;n<150;n++){if(await fn())return;await wait(100)}throw Error('대기 시간 초과')}
export async function png(b,file,width,height){await b.run('window.scrollTo(0,0)');const shot=await b.rpc('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{x:0,y:0,width,height,scale:1}});await fs.writeFile(file,Buffer.from(shot.data,'base64'))}
export function end(){ws.close()}
