const {assets,scenes}=window.BOARD_DATA
const byId=new Map(assets.map(a=>[a.id,a]))
const el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e}
window.boardElement=el
window.boardFrame=(a,scale=2)=>{
  if(!a.file){return el('div','missing',`${a.id}\n${a.w}×${a.h} · ${a.frames||1}칸 제안`)}
  if(a.index!==undefined){const e=el('span','frame');Object.assign(e.style,{width:`${a.w*scale}px`,height:`${a.h*scale}px`,backgroundImage:`url("${a.file}")`,backgroundSize:`${a.w*a.count*scale}px ${a.h*scale}px`,backgroundPosition:`${-a.index*a.w*scale}px 0`});e.setAttribute('aria-hidden','true');return e}
  if(a.id==='UI-grading-badge')return el('div','missing','HTML/CSS 배지')
  const img=el('img','reference');img.alt=a.id;img.src=a.id==='KEY-title-loop'?byId.get('KEY-title-poster').file:a.file;img.loading='lazy';return img
}
const size=a=>a.w?`${a.w}×${a.h} · ${a.scale}배${a.runtime?` / 게임 호환 ${a.runtime.width}px`:''}${a.frames?` · ${a.frames}칸 제안`:''}`:'HTML·내용 크기'
const counts=assets.reduce((v,a)=>(v[a.status]=(v[a.status]||0)+1,v),{})
document.querySelector('#inventory-count').textContent=`대장 ${assets.length}행 · ${Object.entries(counts).map(([k,v])=>`${k} ${v}`).join(' / ')} · 캡처 ${scenes.length}장`
const sceneFilter=document.querySelector('#scene-filter')
for(let n=1;n<=18;n++){const s=scenes.find(s=>s.num===n),o=el('option','',`${String(n).padStart(2,'0')} ${s?.label||''}`);o.value=String(n);sceneFilter.append(o)}
const sceneNodes=[]
for(let n=1;n<=18;n++){
 const group=el('article','scene');group.dataset.scene=String(n);group.id=`scene-${String(n).padStart(2,'0')}`
 const all=scenes.filter(s=>s.num===n);group.append(el('h3','',`${String(n).padStart(2,'0')} · ${all[0].label}`))
 for(const [i,s] of all.entries()){
  const details=el('details');details.open=i===0;const sum=el('summary','',`${s.label} · ${s.width}×${s.height}${s.width===390?' (전체 스크롤)':''}`);details.append(sum)
  const layout=el('div','scene-layout'),figure=el('figure',`shot${s.width===390?' is-mobile':''}`),img=el('img');img.src=s.file;img.alt=s.label+' 실제 게임 캡처';img.width=s.width;img.height=s.height;img.loading='lazy';figure.append(img)
  const overlay=el('div','markers'),list=el('div','scene-assets');const nodes=[]
  const highlight=id=>{for(const [node,key]of nodes)node.classList.toggle('selected',key===id)}
  for(const p of s.places){const a=byId.get(p.id);if(!a)continue;const m=el('button',`marker${p.proposal?' proposal':''}`);m.type='button';m.setAttribute('aria-label',`자리 ${p.n} ${p.id}${p.proposal?' 제안':''}`);m.title=p.id;Object.assign(m.style,{left:`${p.x/s.width*100}%`,top:`${p.y/s.height*100}%`,width:`${p.w/s.width*100}%`,height:`${p.h/s.height*100}%`});m.append(el('span','',String(p.n)));m.onclick=()=>highlight(p.id);overlay.append(m);nodes.push([m,p.id])}
  const unique=[...new Map(s.places.map(p=>[`${p.n}/${p.id}`,p])).values()]
  for(const p of unique){const a=byId.get(p.id);if(!a)continue;const item=el('div','scene-item'),thumb=el('div','thumb-window');thumb.append(window.boardFrame(a));const body=el('div'),b=el('button','',`${p.n} · ${a.koreanName} · ${p.id}`);b.onclick=()=>highlight(p.id);body.append(b,el('p','',`${size(a)} / ${a.status}`));const link=el('a','','프레임·조건 보기');link.href=`#asset-${p.id}`;body.append(link);item.append(thumb,body);list.append(item);nodes.push([item,p.id])}
  const original=el('a','original','캡처 원본 열기');original.href=s.file;original.target='_blank';original.rel='noopener';const canvas=el('div','capture-canvas');canvas.append(img,overlay);figure.append(canvas,original);layout.append(figure,list);details.append(layout);group.append(details)
 }
 if(n===18)group.append(el('p','','실제 배지: 준비 n%(idle/loading), 간이 채점(failed), 의미 채점(ready). 캐시·로딩 시점에 따라 캡처 상태가 달라져. 별도 PNG 아이콘은 없어.'))
 document.querySelector('#scene-list').append(group);sceneNodes.push(group)
}
sceneFilter.onchange=()=>sceneNodes.forEach(e=>e.hidden=sceneFilter.value!=='all'&&e.dataset.scene!==sceneFilter.value)
document.querySelector('#show-marks').onchange=e=>document.querySelectorAll('.markers').forEach(m=>m.hidden=!e.target.checked)
const cards=[]
for(const a of assets){
 const card=el('article','asset-card');card.id=`asset-${a.id}`;const state=el('span',`state${a.file?'':' proposed'}`,`${a.status} · ${a.version}`),art=el('div','art-window');art.append(window.boardFrame(a));card.append(el('h3','',a.koreanName),el('p','',a.id),state,art,el('p','',size(a)),el('p','',`장면 ${a.scenes} / 자리 ${a.slot}`),el('p','',a.use),el('p','',a.memo));if(a.file){const link=el('a','','파일 열기');link.href=a.reviewFrame??a.file;card.append(link)}document.querySelector('#asset-grid').append(card);cards.push([card,a])
}
const filter=()=>{const state=document.querySelector('#asset-filter').value,q=document.querySelector('#asset-search').value.trim().toLowerCase();for(const[e,a]of cards)e.hidden=(state!=='all'&&a.status!==state)||!(a.id+' '+(a.koreanName||'')).toLowerCase().includes(q)}
document.querySelector('#asset-filter').onchange=filter;document.querySelector('#asset-search').oninput=filter
