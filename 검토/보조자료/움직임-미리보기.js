// docs 보드 전용. AI 재제작 시트의 실제 눈·머리·옷자락 프레임을 재생한다.
(()=>{
const el=window.boardElement,assets=window.BOARD_DATA.assets
const specs=[
 ['reader',1,2800,.12,[['blink',160,4],['grip',480,2],['hem',600,1]]],
 ['dokkaebi',2,3200,.47,[['blink',160,4],['tilt',600,2],['settle',480,1]]],
 ['tiger',1,2600,.73,[['blink',160,4],['ear',320,2],['tail',640,2]]],
 ['fox',2,3400,.91,[['blink',180,4],['head',900,2],['ear',360,2],['tail',720,1]]]
]
let manualReduce=false,mode='both',clock=0,lastTime=performance.now(),eventUntil=0,seed=621
const query=matchMedia('(prefers-reduced-motion: reduce)'),log=[],audit={accents:[],events:[],snapshots:[]}
let lastPreference=query.matches
const rng=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}
const interval=()=>Math.max(3000,Math.min(7000,(3000+rng()*4000)*(.8+rng()*.4)*Number(document.querySelector('#interval').value)))
const stopped=()=>manualReduce||query.matches
const actors=specs.map(([name,amp,period,phase,choices])=>{
 const a=assets.find(a=>a.name===name&&a.label==='idle'),card=el('article','actor'),stage=el('div','actor-stage'),sprite=window.boardFrame(a,a.scale),caption=el('p'),status=el('p');stage.append(sprite);const field=el('label','','주기(ms) '),input=el('input');input.type='number';input.min='2400';input.max='3400';input.step='100';input.value=String(period);input.setAttribute('aria-label',name+' 규칙 주기 ms');field.append(input);card.append(el('h3','',name),stage,caption,field,status);document.querySelector('#motion-cast').append(card)
 caption.textContent=`R ${amp}px / ${period}ms / 위상 ${phase} · A ${choices.map(c=>c[0]).join('·')}`
 const actor={name,amp,period,phase,choices,a,sprite,status,next:clock+interval(),accent:null,previous:null,until:0,index:0,y:0};input.onchange=()=>{const value=Number(input.value);if(!Number.isFinite(value))return;actor.period=Math.max(2400,Math.min(3400,Math.round(value/100)*100));input.value=String(actor.period);caption.textContent=`R ${amp}px / ${actor.period}ms / 위상 ${phase} · A ${choices.map(c=>c[0]).join('·')}`};return actor
})
function setFrame(a,index,y){a.index=index;a.y=y;a.sprite.style.backgroundPosition=`${-index*a.a.w*a.a.scale}px 0`;a.sprite.style.transform=`translateY(${y*a.a.scale}px)`}
function note(text){log.unshift(text);log.splice(24);document.querySelector('#motion-log').textContent=log.join('\n')}
function reset(){eventUntil=0;for(const a of actors){a.accent=null;a.until=0;a.next=clock+interval();setFrame(a,0,0)}}
function controls(){const reduced=stopped();document.querySelector('#reduce').textContent=query.matches?'기기 설정 · 정지':'움직임 줄이기 '+(manualReduce?'끄기':'켜기');document.querySelector('#reduce').setAttribute('aria-pressed',String(reduced));document.querySelector('#reduce').disabled=query.matches;document.querySelector('#event').disabled=reduced;document.querySelector('#motion-state').textContent=reduced?'모든 대기 정지 · 첫 idle 프레임':`${mode==='both'?'R + A':mode==='regular'?'R 규칙만':'A 불규칙만'} · 사건은 700ms 우선`;for(const b of document.querySelectorAll('[data-mode]'))b.setAttribute('aria-pressed',String(b.dataset.mode===mode))}
document.querySelector('#reduce').onclick=()=>{manualReduce=!manualReduce;reset();controls()}
query.addEventListener('change',()=>{reset();controls()})
for(const b of document.querySelectorAll('[data-mode]'))b.onclick=()=>{mode=b.dataset.mode;reset();controls()}
for(const id of ['interval','amplitude'])document.querySelector('#'+id).onchange=reset
document.querySelector('#event').onclick=()=>{
 if(stopped())return;eventUntil=clock+700;for(const a of actors){a.accent=null;a.until=0;a.next=eventUntil+interval();setFrame(a,a.name==='reader'?1:2,0)}
 audit.events.push({start:clock,end:eventUntil});note(`E ${clock.toFixed(0)}~${eventUntil.toFixed(0)}ms · A 취소·새 예약`)
}
function accent(a){
 const choices=a.choices.filter(c=>c[0]!==a.previous),total=choices.reduce((s,c)=>s+c[2],0);let pick=rng()*total,chosen=choices.at(-1)
 for(const c of choices){pick-=c[2];if(pick<=0){chosen=c;break}}
 const duration=chosen[1]*(.8+rng()*.4),gap=interval();a.accent=chosen[0];a.previous=chosen[0];a.started=clock;a.duration=duration;a.until=clock+duration;a.next=a.until+gap
 const entry={name:a.name,accent:a.accent,start:clock,duration,gap,next:a.next};audit.accents.push(entry);if(audit.accents.length>100)audit.accents.shift();note(`A ${a.name} ${a.accent} · ${Math.round(duration)}ms · 다음 대기 ${Math.round(gap)}ms`)
}
function tick(now){
 if(query.matches!==lastPreference){lastPreference=query.matches;reset();controls()}
 const delta=Math.min(100,now-lastTime);lastTime=now
 if(!document.hidden&&!stopped())clock+=delta*Number(document.querySelector('#speed').value)
 for(const a of actors){
  if(stopped()){setFrame(a,0,0);a.status.textContent='정지 · idle';continue}
  if(clock<eventUntil){a.status.textContent=`E 우선 · ${Math.ceil(eventUntil-clock)}ms 남음`;continue}
  if(mode!=='regular'&&clock>=a.next)accent(a)
  if(a.accent&&clock>=a.until)a.accent=null
  const ampValue=document.querySelector('#amplitude').value,amp=ampValue==='default'?a.amp:Number(ampValue)
  const y=mode==='accent'?0:-Math.round(amp*(1-Math.cos((clock/a.period+a.phase)*Math.PI*2))/2)
  let idx=0
  if(mode!=='regular'&&a.accent){const f=assets.filter(f=>f.name===a.name&&new RegExp('^'+a.accent+'[0-9]+$').test(f.label)).map(f=>f.index);const seq=a.accent==='blink'?[...f,f[0],0]:[...f,...f.slice(0,-1).reverse(),0];idx=seq[Math.min(seq.length-1,Math.floor((clock-a.started)/a.duration*seq.length))]??0}
  setFrame(a,idx,y);a.status.textContent=a.accent?`A ${a.accent} · 실제 ${idx}번 프레임`:`idle · 다음 A ${mode==='regular'?'안 봄':Math.max(0,Math.ceil((a.next-clock)/1000))+'초'}`
 }
 requestAnimationFrame(tick)
}
// 브라우저 검수용 읽기 전용 표본. 제품 코드에는 연결하지 않는다.
window.boardMotionSnapshot=()=>({clock,mode,reduced:stopped(),eventUntil,actors:actors.map(a=>({name:a.name,y:a.y,index:a.index,accent:a.accent,next:a.next,period:a.period})),audit:structuredClone(audit)})
document.addEventListener('visibilitychange',()=>{lastTime=performance.now();if(!document.hidden){for(const a of actors){a.accent=null;a.until=0;a.next=clock+interval()}}})
controls();requestAnimationFrame(tick)
})()
