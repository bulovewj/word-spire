// 같은 색 8방향 덩어리 중 1칸짜리 위치를 grid 키로 보여 준다
import fs from 'node:fs'
const g=fs.readFileSync(process.argv[2],'utf8').split('\n')
const H=g.length,W=g[0].length,seen=new Set(),out=[]
for(let y=0;y<H;y++)for(let x=0;x<W;x++){const c=g[y][x];if(c==='.'||seen.has(y*W+x))continue
 const st=[[x,y]],comp=[];seen.add(y*W+x)
 while(st.length){const [a,b]=st.pop();comp.push([a,b]);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=a+dx,ny=b+dy;if(nx<0||ny<0||nx>=W||ny>=H||seen.has(ny*W+nx)||g[ny][nx]!==c)continue;seen.add(ny*W+nx);st.push([nx,ny])}}
 if(comp.length===1)out.push(`${c}@${x},${y}`)}
console.log(out.length,out.join(' '))
