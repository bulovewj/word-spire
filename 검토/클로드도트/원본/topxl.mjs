// native PNG → 색 정리(키 매핑) → (축소) → 64×64 가운데 정렬 pxl 칸 문자열
import sharp from 'sharp'
import fs from 'node:fs'
const [src,out,name,scaleStr]=process.argv.slice(2)
const cfg={
 tiger:{pal:{k:'#242331',o:'#e5a34c',l:'#f1cc79',O:'#b9713e',c:'#f6e7c8',C:'#efc99f',w:'#fffaf0',r:'#c34e49'},
  map:{'#242331':'k','#2f2a3d':'k','#78648f':'k','#414459':'k','#d6a33a':'o','#e5a34c':'o','#f1cc79':'l','#b9713e':'O','#825515':'O','#71554e':'O','#a77853':'O','#f6e7c8':'c','#f5eedb':'c','#efc99f':'C','#d8cbb3':'C','#fffaf0':'w','#c34e49':'r'}},
 reader:{pal:{k:'#242331',n:'#414459',N:'#656379',b:'#71554e',s:'#efc99f',S:'#ce956f',c:'#f6e7c8',C:'#d8cbb3',g:'#d6a33a',G:'#825515',v:'#9eb68a',V:'#4b6853'},
  map:{'#242331':'k','#2f2a3d':'k','#414459':'n','#686176':'N','#777080':'N','#78648f':'N','#71554e':'b','#a77853':'b','#efc99f':'s','#ce956f':'S','#b9713e':'S','#f5eedb':'c','#f6e7c8':'c','#fffaf0':'c','#e7eff6':'c','#d8cbb3':'C','#dfd2b8':'C','#d6a33a':'g','#e5a34c':'g','#825515':'G','#845815':'G','#9eb68a':'v','#4b6853':'V'}}}[name]
const {data,info}=await sharp(src).raw().toBuffer({resolveWithObject:true})
const W=info.width,H=info.height
let g=[];for(let y=0;y<H;y++){const row=[];for(let x=0;x<W;x++){const o=(y*W+x)*4;if(!data[o+3]){row.push('.');continue}
 const h='#'+[0,1,2].map(i=>data[o+i].toString(16).padStart(2,'0')).join('');row.push(cfg.map[h]??'?')}g.push(row)}
// 빈 테두리 자르기
const rows=g.map((r,y)=>r.some(c=>c!=='.')?y:-1).filter(v=>v>=0),cols=[...Array(W).keys()].filter(x=>g.some(r=>r[x]!=='.'))
g=g.slice(rows[0],rows.at(-1)+1).map(r=>r.slice(cols[0],cols.at(-1)+1))
const sc=+scaleStr||1
if(sc!==1){ // 축소: 칸마다 덮는 원본 영역에서 가장 많은 키, 단 외곽선 k가 35% 이상이면 k
 const h0=g.length,w0=g[0].length,h1=Math.round(h0*sc),w1=Math.round(w0*sc),ng=[]
 for(let y=0;y<h1;y++){const row=[];for(let x=0;x<w1;x++){const cnt={};let tot=0
  const ya=y/sc,yb=(y+1)/sc,xa=x/sc,xb=(x+1)/sc
  for(let yy=Math.floor(ya);yy<Math.ceil(yb);yy++)for(let xx=Math.floor(xa);xx<Math.ceil(xb);xx++){
   const wgt=(Math.min(yb,yy+1)-Math.max(ya,yy))*(Math.min(xb,xx+1)-Math.max(xa,xx));const c=g[yy]?.[xx]??'.';cnt[c]=(cnt[c]||0)+wgt;tot+=wgt}
  let best='.',bv=-1;for(const [c,v] of Object.entries(cnt))if(v>bv){bv=v;best=c}
  if(best!=='.'&&(cnt.k||0)>=0.35*tot)best='k'
  if(best==='.'&&(cnt['.']||0)<0.6*tot){best='k'} // 테두리 안쪽으로 붙은 칸은 외곽선
  row.push(best)}ng.push(row)}g=ng}
const h=g.length,w=g[0].length
if(h>60||w>60)throw new Error(`too big ${w}x${h}`)
const ox=Math.floor((64-w)/2),oy=62-h // 바닥선: 아래 여백 2칸
const full=[...Array(64)].map((_,y)=>[...Array(64)].map((_,x)=>g[y-oy]?.[x-ox]??'.'))
fs.writeFileSync(out,full.map(r=>r.join('')).join('\n'))
fs.writeFileSync(out+'.pal.json',JSON.stringify(cfg.pal))
console.log(name,w,'x',h,'unknown',full.flat().filter(c=>c==='?').length)
