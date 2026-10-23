import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import {root,browser,until,wait,end} from './cdp.mjs'
const reports=[]
for(const width of [1280,390]){
 const b=await browser(width,width===390?844:800,false);await b.nav();await b.activate()
 await until(()=>b.run('document.querySelector("video")?.readyState>=2'))
 await b.run('document.querySelector("video").play().then(()=>true)')
 const sample=()=>b.run('(()=>{const v=document.querySelector("video"),q=v.getVideoPlaybackQuality();return{time:v.currentTime,paused:v.paused,decoded:q.totalVideoFrames,dropped:q.droppedVideoFrames,width:v.videoWidth,height:v.videoHeight,duration:v.duration}})()')
 const first=await sample();await wait(1000);const after=await sample();assert.ok(after.decoded>first.decoded+10);assert.ok(after.time!==first.time);assert.equal(after.width,1280);assert.equal(after.height,720);assert.equal(after.duration,6)
 await b.run('document.querySelector("video").pause()')
 const decode=async(time)=>b.run(`new Promise(resolve=>{const v=document.querySelector('video');const draw=()=>{const c=document.createElement('canvas');c.width=300;c.height=340;const x=c.getContext('2d');x.imageSmoothingEnabled=false;x.drawImage(v,v.videoWidth*1170/1920,v.videoHeight*346/1080,v.videoWidth*600/1920,v.videoHeight*680/1080,0,0,300,340);resolve({png:c.toDataURL('image/png'),pixels:[...x.getImageData(0,0,300,340).data]})};v.addEventListener('seeked',()=>requestAnimationFrame(draw),{once:true});v.currentTime=${time}})`)
 const start=await decode(.05),middle=await decode(2.95);let sum=0;for(let i=0;i<start.pixels.length;i++)if(i%4!==3)sum+=Math.abs(start.pixels[i]-middle.pixels[i]);const difference=sum/(300*340*3);assert.ok(difference>8,'실제 재생 프레임의 옷자락 변화 부족')
 if(width===1280)for(const [name,s]of [['시작',start],['중간',middle]])await fs.writeFile(`${root}/docs/design/concept/영상-재제작-2판/플레이어-옷자락-${name}.png`,Buffer.from(s.png.split(',')[1],'base64'))
 await b.run('(()=>{const v=document.querySelector("video");v.currentTime=5.9;return v.play().then(()=>true)})()');await wait(450);const loop=await sample();assert.ok(loop.time<1,'반복 재생 안 됨')
 const cover=await browser(400,800,true);await wait(100);assert.ok(await b.run('document.hidden'));assert.ok((await sample()).paused);await cover.close();await b.activate();await until(async()=>!(await sample()).paused)
 await b.click('움직임 끄기','.title-motion');assert.equal(await b.run('document.querySelectorAll("video").length'),0);await b.click('움직임 켜기','.title-motion');await until(()=>b.run('document.querySelector("video")?.readyState>=2'))
 await b.rpc('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await until(()=>b.run('document.querySelectorAll("video").length===0'))
 reports.push({width,first,after,loop,coatStartMiddleMeanDifference:difference,hiddenPause:true,manualToggle:true,reducedStops:true});console.log('실제 영상 재생·옷자락·반복·정지 통과',width,difference.toFixed(2));await b.close()
}
const b=await browser(390,844,true);await b.nav();const reduced=await b.run('({videos:document.querySelectorAll("video").length,requests:performance.getEntriesByType("resource").filter(r=>new URL(r.name).pathname.endsWith(".mp4")&&!new URL(r.name).search).length})');assert.deepEqual(reduced,{videos:0,requests:0});await b.close()
await fs.writeFile(root+'/docs/design/concept/영상-재제작-2판/실제플레이어-검사.json',JSON.stringify({date:'2026-10-22',reports,reducedInitial:reduced,note:'실제 HTMLVideoElement에서 디코딩한 시작/중간 옷자락 PNG를 저장하고 직접 비교함. 차이 수치만으로 움직임을 단정하지 않음.'})+'\n');end()
