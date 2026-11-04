// 원화의 실제 칸 경계를 DP로 찾아 칸 가운데 색을 읽고 공용 팔레트로 옮긴다
import sharp from 'sharp'
import fs from 'node:fs'
const [src,out,lo,hi]=[process.argv[2],process.argv[3],+process.argv[4],+process.argv[5]]
const pal=JSON.parse(fs.readFileSync('/Users/wonjin/dev/word-spire-story/docs/design/palette.json','utf8')).colors.map(c=>c.hex)
const {data,info}=await sharp(src).removeAlpha().raw().toBuffer({resolveWithObject:true})
const W=info.width,H=info.height
const diff=(p,q)=>Math.abs(data[p]-data[q])+Math.abs(data[p+1]-data[q+1])+Math.abs(data[p+2]-data[q+2])
const ex=new Float64Array(W+1),ey=new Float64Array(H+1)
for(let y=0;y<H;y++)for(let x=1;x<W;x++)if(diff((y*W+x)*3,(y*W+x-1)*3)>40)ex[x]++
for(let y=1;y<H;y++)for(let x=0;x<W;x++)if(diff((y*W+x)*3,((y-1)*W+x)*3)>40)ey[y]++
const dp=(e,N)=>{const best=new Float64Array(N+1).fill(-1),prev=new Int32Array(N+1).fill(-1);for(let s=0;s<hi;s++)best[s]=e[s]
 for(let x=0;x<=N;x++){if(best[x]<0)continue;for(let g=lo;g<=hi&&x+g<=N;g++){const v=best[x]+e[x+g];if(v>best[x+g]){best[x+g]=v;prev[x+g]=x}}}
 let end=N;for(let x=N-hi;x<=N;x++)if(best[x]>best[end])end=x
 const b=[];for(let x=end;x>=0;x=prev[x])b.unshift(x);return b}
const bx=dp(ex,W),by=dp(ey,H)
const hex2=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16))
const lab=([r,g,b])=>{const f=v=>{v/=255;return v>0.04045?((v+0.055)/1.055)**2.4:v/12.92};const R=f(r),G=f(g),B=f(b)
 let X=(R*.4124+G*.3576+B*.1805)/.95047,Y=R*.2126+G*.7152+B*.0722,Z=(R*.0193+G*.1192+B*.9505)/1.08883
 const t=v=>v>.008856?Math.cbrt(v):7.787*v+16/116;return[116*t(Y)-16,500*(t(X)-t(Y)),200*(t(Y)-t(Z))]}
const PL=pal.map(h=>lab(hex2(h)))
const near=rgb=>{const L=lab(rgb);let bi=0,bd=1e9;PL.forEach((p,i)=>{const d=(p[0]-L[0])**2+(p[1]-L[1])**2+(p[2]-L[2])**2;if(d<bd){bd=d;bi=i}});return pal[bi]}
const cw=bx.length-1,ch=by.length-1,img=Buffer.alloc(cw*ch*4)
for(let j=0;j<ch;j++)for(let i=0;i<cw;i++){
 const cx=Math.floor((bx[i]+bx[i+1])/2),cy=Math.floor((by[j]+by[j+1])/2),p=(cy*W+cx)*3
 const rgb=[data[p],data[p+1],data[p+2]],o=(j*cw+i)*4
 if(rgb[0]>200&&rgb[1]<80&&rgb[2]>200)continue // 배경 마젠타
 const [r,g,b]=hex2(near(rgb));img[o]=r;img[o+1]=g;img[o+2]=b;img[o+3]=255}
await sharp(img,{raw:{width:cw,height:ch,channels:4}}).png().toFile(out)
console.log(out,cw,'x',ch,'gaps x',Math.min(...bx.slice(1).map((v,i)=>v-bx[i])),Math.max(...bx.slice(1).map((v,i)=>v-bx[i])))
