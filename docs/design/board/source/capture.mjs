import fs from 'node:fs/promises'
import {root,browser,wait,png,until,end} from './cdp.mjs'
const out=`${root}/docs/design/board/captures`
await fs.mkdir(out,{recursive:true})
const b=await browser()
await b.nav();await b.run('localStorage.clear()');await b.nav()
await b.run(`Promise.all([import('/src/content/index.ts'),import('/src/engine/run.ts'),import('/src/storage/store.ts'),import('/src/engine/judge.ts')]).then(([c,r,s,j])=>{window.qa={...c,...r,...s,...j};return true})`)
const scenes=[]
const marks=()=>b.run(String.raw`(()=>{
 const rect=e=>{const r=e.getBoundingClientRect();return{x:Math.round(r.x+scrollX),y:Math.round(r.y+scrollY),w:Math.round(r.width),h:Math.round(r.height)}};
 const m=[]; const add=(n,id,sel,proposal=false)=>{document.querySelectorAll(sel).forEach(e=>{const r=rect(e);if(r.w&&r.h)m.push({n,id,...r,proposal})})};
 add(1,'KEY-title-poster','.title-art');add(2,'UI-gourd','.title-gourd');add(16,'UI-grading-badge','.badge[role="status"]');
 const enemy=document.querySelector('.unit-enemy .unit-art');if(enemy){let p=document.body.textContent.includes('여우')?'3':document.body.textContent.includes('호랑이')?'2':'1';add(1,'BG-floor'+p,'.unit-enemy .unit-art',true)}
 document.querySelectorAll('.sprite').forEach(e=>{const s=e.style;const file=(s.backgroundImage.match(/\/([^/]+)\.png/)||[])[1];if(!file)return;const index=Math.round(-parseFloat(s.backgroundPositionX||0)/parseFloat(s.width));const labels={reader:['idle','defend','point','down','stamp'],dokkaebi:['idle','idle2','attack','flinch'],tiger:['idle','idle2','attack','flinch'],fox:['idle','idle2','attack','flinch'],seal:['fold','pour','closed'],icons:['think','damage','defense','fog','evidence','clue','sure','unsure','seal','hit','weak','fail'],'card-kinds':['literal','connect','author','fog','seal','word']};
 let label=labels[file]?.[index]||labels[file]?.[0];let id,n;if(file==='reader'){id='CH-reader-'+label;n=3}else if(['dokkaebi','tiger','fox'].includes(file)){id='EN-'+file+'-'+label;n=2}else if(file==='seal'){id='FX-seal-'+(matchMedia('(prefers-reduced-motion: reduce)').matches?'closed':label);n=15}else if(file==='icons'){id='UI-icon-'+label;n=e.closest('.events')?10:{damage:4,fog:5,defense:6,think:7,clue:11,evidence:12,sure:13,unsure:14}[label]||10}else{id='UI-kind-'+label;n=label==='word'?9:8}m.push({n,id,...rect(e),proposal:false})});
 const sc=document.querySelector('.screen');if(sc){const h=sc.querySelector('h2')?.textContent||'';let id=h.includes('완료')?'KEY-complete':h.includes('봉인')?'KEY-reward':h.includes('탑')?'KEY-intro':null;if(id){const r=rect(sc);m.push({n:20,id,x:r.x+16,y:r.y+r.h+24,w:160,h:96,proposal:true})}}
 if(document.querySelector('.overlay:not(.overlay-won)')){const r=rect(document.querySelector('.overlay'));m.push({n:20,id:'KEY-defeat',x:r.x+16,y:r.y+r.h+24,w:128,h:96,proposal:true})}
 return m})()`)
async function shot(num,label,suffix='',width=1280){
 await b.run('document.fonts.ready.then(()=>true)');await wait(120)
 const height=width===390?await b.run('document.documentElement.scrollHeight'):800
 const file=`${String(num).padStart(2,'0')}${suffix}.png`
 const places=await marks();await png(b,`${out}/${file}`,width,height)
 const overflow=await b.run('({viewport:innerWidth,document:document.documentElement.scrollWidth})')
 const row={num,label,file:`board/captures/${file}`,width,height,viewportHeight:width===390?844:800,places:places.filter(p=>p.y<height),overflow,badge:await b.run('document.querySelector(".badge[role=status]")?.textContent')}
 scenes.push(row);console.log(num,suffix,label,height,places.length,overflow)
}
async function freshFloor(floor){
 await b.run(`(async()=>{const c=await import('/src/content/index.ts'),r=await import('/src/engine/run.ts'),s=await import('/src/storage/store.ts');let v=r.newRun('bee',c.starterDeck,621);v.floor=${floor};s.saveRun(v);return true})()`)
 await b.nav();await b.click('이어하기');await b.click('1층으로')
 await until(()=>b.run('!!document.querySelector(".unit-enemy")'))
}
async function data(){return b.run(`(async()=>{const c=await import('/src/content/index.ts');const label=document.querySelector('header')?.textContent||'';const floor=label.match(/([123])층/)?.[1]||1;return c.passages[Number(floor)-1]})()`)}
async function solve(q){
 if(await b.run('document.querySelector(".card-question")?.disabled'))await b.click('턴 끝내기')
 await b.click(`질문: ${{literal:'거기 있음',connect:'연결',author:'글쓴이와 나'}[q.type]}`,'.card')
 await b.click(q.options[q.answer],'.qopt')
 const chosen=[...q.evidence.required[0]];for(const i of [...(q.evidence.allowed||[]),...q.evidence.required.flat()])if(chosen.length<q.evidence.count&&!chosen.includes(i))chosen.push(i)
 for(const i of chosen)await b.run(`document.querySelectorAll('.sentence')[${i}].click()`)
 await b.click('확실','.qconf');await b.click('제출','.qsubmit')
}
await shot(1,'타이틀')
await b.click('꿀벌 탑');await shot(2,'탑 소개');await b.click('1층으로');await shot(3,'전투 시작')
await b.click('질문: 거기 있음','.card');await b.click('단서 보기','.qclue');await b.run("document.querySelectorAll('.sentence')[3].click()");await b.click('애매','.qconf');await shot(4,'질문 · 단서로 지운 보기 · 근거 선택')
await b.click('취소');await freshFloor(1);let p=await data();await solve(p.questions[0]);await shot(5,'정타 뒤')
await freshFloor(1);await b.run("document.querySelector('.pouch-word').click()");await shot(6,'낱말 뜻 입력')
await b.input('#word-answer','맛있는 음식이야');await b.click('제출');await until(()=>b.run('!!document.querySelector(".wresult")'));await shot(7,'낱말 실패 · 뜻 가까움')
await freshFloor(1);await b.click('안개 걷기','.card');await b.run("document.querySelectorAll('.sentence')[2].click()");await shot(8,'안개 걷기')
await b.click('제출');await b.click('턴 끝내기');p=await data()
for(const q of p.questions){await solve(q);if(await b.run('!!document.querySelector(".card-summary")'))break}
await shot(9,'요약 봉인 카드 등장')
if(await b.run('document.querySelector(".card-summary")?.disabled'))await b.click('턴 끝내기')
await b.click('요약 봉인','.card');await b.input('#summary-answer',p.summary.models[0]);await shot(10,'요약 입력 · 글자 수')
await b.click('제출');await until(()=>b.run('!!document.querySelector(".wresult")'));if(!await b.run('document.querySelector(".wresult").textContent.includes("성공")'))throw Error('요약 실패')
await b.click('계속');await shot(11,'층 봉인 승리');await b.click('보상 받기');await shot(12,'층 보상')
await freshFloor(2);await shot(3,'2층 호랑이 실제 자리','-floor2')
await b.rpc('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await shot(13,'390px 전투','',390)
await b.rpc('Emulation.setDeviceMetricsOverride',{width:1280,height:800,deviceScaleFactor:1,mobile:false})
await freshFloor(3);await shot(3,'3층 여우 · 헛소문 카드','-floor3');await b.click('헛소문 반박','.card');await shot(4,'3층 헛소문 반박 입력','-rumor');await b.click('취소')
p=await data();for(const q of p.questions)await solve(q)
if(await b.run('document.querySelector(".card-summary")?.disabled'))await b.click('턴 끝내기')
await b.click('요약 봉인','.card');await b.input('#summary-answer',p.summary.models[0]);await b.click('제출');await until(()=>b.run('!!document.querySelector(".wresult")'));await b.click('계속');await b.click('탑 완료');await shot(14,'塔 완료'.replace('塔','탑'))
await freshFloor(1);for(let n=0;n<12;n++){if(await b.run('!!document.querySelector(".overlay")'))break;await b.click('턴 끝내기')}
await shot(15,'패배 · 같은 층 재도전')
await b.nav();await b.click('내 기록');await shot(16,'내 기록 · 실제 이번 검수의 풀이 기록')
await b.input('.name-field input','검수예시');await b.click('결과 코드 복사');await until(()=>b.run('!!document.querySelector(".code-box")'));const code=await b.run('document.querySelector(".code-box").value')
await b.click('처음으로');await b.click('선생님');await b.input('.code-box',code);await b.click('표 만들기');await until(()=>b.run('!!document.querySelector(".class-table")'));await shot(17,'교사 · 검수용 가상 결과 코드')
await b.nav();await shot(18,'채점 배지 · 실제 준비 상태')
await shot(1,'이어하기 · 저장 경고','-saved')
await b.rpc('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await shot(1,'390px 이어하기 · 저장 경고','-mobile',390)
await freshFloor(1)
for(const [num,label] of [[3,'전투 시작'],[4,'질문'],[5,'정타'],[6,'낱말 입력'],[7,'낱말 실패'],[8,'안개 걷기'],[9,'요약 등장'],[10,'요약 입력'],[11,'봉인 승리'],[15,'패배']]){
 if(num===4)await b.click('질문: 거기 있음','.card')
 if(num===5){await b.click('취소');p=await data();await solve(p.questions[0])}
 if(num===6){await freshFloor(1);await b.run("document.querySelector('.pouch-word').click()")}
 if(num===7){await b.input('#word-answer','맛있는 음식이야');await b.click('제출');await until(()=>b.run('!!document.querySelector(".wresult")'))}
 if(num===8){await freshFloor(1);await b.click('안개 걷기','.card')}
 if(num===9){await b.click('취소');p=await data();for(const q of p.questions)await solve(q)}
 if(num===10){if(await b.run('document.querySelector(".card-summary")?.disabled'))await b.click('턴 끝내기');await b.click('요약 봉인','.card');await b.input('#summary-answer',p.summary.models[0])}
 if(num===11){await b.click('제출');await until(()=>b.run('!!document.querySelector(".wresult")'));await b.click('계속')}
 if(num===15){await freshFloor(1);for(let n=0;n<12;n++){if(await b.run('!!document.querySelector(".overlay")'))break;await b.click('턴 끝내기')}}
 await shot(num,`390px ${label}`,'-mobile',390)
}
await freshFloor(3);await shot(13,'390px 보스 여우 · 크기 비교 기준','-fox',390)
await fs.writeFile(`${root}/docs/design/board/scenes.json`,JSON.stringify(scenes,null,2)+'\n')
await b.close();end()
