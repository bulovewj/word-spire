// 1칸짜리 색 덩어리를 상하좌우 이웃 중 가장 많은 색으로 바꾼다(keep 목록 제외). 바꾼 칸 수를 출력
import fs from 'node:fs'
const [file,keepArg='']=process.argv.slice(2),keep=new Set(keepArg.split(' ').filter(Boolean))
let g=fs.readFileSync(file,'utf8').split('\n').map(r=>[...r]),changed=0
for(let pass=0;pass<4;pass++){const H=g.length,W=g[0].length;let n=0
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const c=g[y][x];if(c==='.'||keep.has(`${x},${y}`))continue
  let alone=true;for(let dy=-1;dy<=1&&alone;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;if(g[y+dy]?.[x+dx]===c){alone=false;break}}
  if(!alone)continue
  const cnt={};for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const v=g[y+dy]?.[x+dx];if(v&&v!=='.')cnt[v]=(cnt[v]||0)+1}
  const best=Object.entries(cnt).sort((a,b)=>b[1]-a[1])[0];if(best){g[y][x]=best[0];n++}}
 changed+=n;if(!n)break}
fs.writeFileSync(file,g.map(r=>r.join('')).join('\n'));console.log('fixed',changed)
