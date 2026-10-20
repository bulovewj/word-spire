import {createRequire} from 'node:module';
import {Pixel,C,save} from './pixel.mjs';
const sharp=createRequire(`${process.cwd()}/package.json`)('sharp');
const root=process.cwd(),p=new Pixel(384,216);
const paper='#dfd2b8',light='#f5eedb',lavenderLight='#e7e0ef';
p.rect(0,0,384,216,light);
// 종이 기둥과 큰 빈 창: 단색 면만 사용한다.
for(const x of [72,150,228,306]){
 p.R(x,5,11,170,paper);p.R(x+10,36,57,7,paper);p.R(x+10,94,57,7,paper);p.R(x+10,152,57,7,paper);
 p.E(x+39,33,19,23,C.cream);p.rect(x+20,33,39,49,C.cream);
 p.rect(x+12,84,53,2,C.gold);p.rect(x+12,142,53,2,C.gold);
}
function shelf(x,y,w,h){p.R(x,y,w,h,C.ink);for(let row=0;row<Math.floor(h/24);row++){
 const yy=y+row*24+3;p.rect(x+2,yy,w-4,18,light);
 for(let i=0;i<Math.floor((w-5)/7);i++){const height=9+(i+row)%3*3;p.R(x+4+i*7,yy+17-height,4,height,[C.sage,C.lavender,C.gold][(i+row)%3]);}
 p.rect(x+1,yy+19,w-2,2,C.gold);
}}
shelf(5,31,56,179);shelf(329,14,50,197);
// 위층 플랫폼에는 세 실루엣만 두고 글자는 그리지 않는다.
p.P([[52,100],[113,100],[119,108],[49,108]],C.gold);
p.P([[161,64],[222,64],[228,72],[158,72]],C.gold);
p.P([[256,61],[318,61],[323,69],[252,69]],C.gold);
async function stamp(file,logical,x,y,silhouette=false){const{data}=await sharp(`${root}/src/ui/sprites/${file}.png`).ensureAlpha().raw().toBuffer({resolveWithObject:true});const sheetWidth=file==='reader'?128:file==='erasure'?240:160;
 for(let yy=0;yy<logical;yy++)for(let xx=0;xx<logical;xx++){const n=(yy*sheetWidth+xx)*4;if(data[n+3])p.set(x+xx,y+yy,silhouette?C.lavender:`#${data.subarray(n,n+3).toString('hex')}`);}
}
await stamp('drought',32,73,69,true);await stamp('bloomgap',32,176,33,true);await stamp('erasure',48,264,14,true);
// 계단은 책등과 같은 규칙적인 사각 면으로 잇는다.
for(let i=10;i>=0;i--){const x=48+i*20,y=212-i*12;
 p.P([[x,y],[x+23,y-12],[x+47,y-12],[x+24,y]],C.cream);
 p.P([[x+24,y],[x+47,y-12],[x+47,y],[x+24,y+12]],paper);
 p.P([[x,y],[x+24,y],[x+24,y+12],[x,y+12]],C.gold);
 p.rect(x+3,y+3,17,2,C.ink);
}
// 각진 연보라 안개. 그림 속 종이는 모두 백지다.
for(const[x,y,rx,ry]of[[47,121,29,7],[138,94,27,6],[238,115,30,6],[315,80,22,5],[286,183,34,7]]){
 p.ellipse(x,y,rx,ry,lavenderLight);p.rect(x-rx,y,rx*2,3,lavenderLight);
}
for(const[x,y]of[[32,14],[135,20],[249,5],[354,10]]){p.R(x,y,5,12,C.gold);p.rect(x+1,y+2,3,7,C.cream);p.rect(x+2,0,1,y,C.ink);}
await stamp('reader',32,93,153,false);
// 주인공 오른쪽에 접힌 작은 무지 카드를 편다.
p.P([[120,166],[128,162],[134,165],[132,173],[125,174]],C.cream);
await save(p,`${root}/docs/design/concept/key-art-pixel.png`,6);
console.log('키 아트 정리본: 384×216 논리 격자, 2304×1296 출력, 단색 면·실루엣·글자 없음');
