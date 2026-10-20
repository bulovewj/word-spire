import {Pixel,C,sheet,save,metadata,fs} from './pixel.mjs';
const root=process.cwd();
const spriteDir=`${root}/src/ui/sprites`;
const conceptDir=`${root}/docs/design/concept`;
function reader(pose){const p=new Pixel(32);const low=pose===3?7:0;
  p.P([[7,14+low],[15,12+low],[21,19+low],[14,27+low/3],[3,25+low/3]],C.sage);
  if(pose===3){p.R(14,25,6,4,C.cream);p.R(21,27,6,3,C.gold);}else{p.R(16,23,4,6,C.cream);p.R(23,23,4,6,C.cream);p.R(15,29,6,2,C.gold);p.R(23,29,6,2,C.gold);}
  p.R(15,15+low,10,10-low/2,C.cream);p.rect(15,18+low,10,2,C.gold);
  p.E(20,9+low,6,6,C.cream);p.P([[13,4+low],[23,3+low],[25,7+low],[21,7+low],[18,11+low],[14,11+low]],C.sage);p.rect(24,8+low,1,2,C.ink);
  p.R(11,21+low/2,5,5,C.gold);p.rect(12,22+low/2,3,2,C.cream);
  if(pose===0){p.R(23,16,5,6,C.cream);p.R(21,19,3,3,C.cream);}
  if(pose===1){p.P([[21,15],[24,13],[27,19],[24,21]],C.cream);p.P([[25,13],[28,13],[29,20],[26,20]],C.cream);p.P([[28,15],[30,16],[30,22],[28,21]],C.cream);p.R(23,21,4,2,C.cream);}
  if(pose===2){p.R(24,16,5,3,C.cream);p.R(29,15,1,2,C.cream);p.R(12,16,4,5,C.cream);}
  if(pose===3){p.R(24,24,3,3,C.cream);p.P([[24,30],[28,28],[31,30],[28,31]],C.cream);}
  return p;}
function bookmark(p,color,cream=C.cream){const n=p.w,s=n===48?1.5:1;const x=Math.round(n/2-4*s),y=Math.round(n-19*s);p.P([[x,y],[x+8*s,y],[x+8*s,n-2],[x+4*s,n-5],[x,n-2]],color);p.P([[x+1,y+2],[x+5*s,y],[x+7*s,y+4],[x+3*s,y+6]],cream);}
function drought(stage){const p=new Pixel(32);
  if(stage===4){bookmark(p,C.gold);return p;}
  if(stage===3){p.P([[14,20],[21,17],[25,22],[25,29],[16,29]],C.cream);p.rect(18,21,1,6,C.ink);return p;}
  const rx=stage===2?8:11,cx=19,cy=23;
  p.E(cx,cy,rx,6,C.cream);p.R(12,28,4,2,C.lavender);p.R(23,28,4,2,C.lavender);
  if(stage<2){p.E(12,16,3,3,C.cream);p.E(24,17,3,3,C.cream);p.rect(11,16,3,1,C.lavender);p.rect(23,17,3,1,C.lavender);}
  p.rect(10,26,18,2,C.lavender);p.rect(12,21,2,2,C.gold);p.rect(17,21,2,2,C.gold);
  p.rect(22,18,1,4,C.ink);p.rect(20,21,3,1,C.ink);p.rect(20,22,1,3,C.ink);p.rect(20,25,3,1,C.ink);p.rect(22,26,1,2,C.ink);
  if(stage===1){p.E(3,20,2,3,C.gold);p.ellipse(3,20,1,2,null);p.rect(1,14,1,1,C.gold);p.rect(4,26,1,1,C.gold);}
  if(stage===2){p.P([[21,18],[26,20],[23,25],[19,23]],C.cream);}
  return p;}
function bloomgap(stage){const p=new Pixel(32);
  if(stage===4){bookmark(p,C.sage);return p;}
  if(stage===3){p.P([[14,20],[21,18],[23,29],[15,28]],C.cream);p.rect(17,20,1,7,C.ink);return p;}
  if(stage===2){p.E(17,16,4,10,C.sage);p.P([[17,7],[20,11],[18,24],[16,27]],C.cream);return p;}
  p.outlined((m,c)=>{m.ellipse(16,14,9,9,c);for(const [x,y]of[[16,4],[23,7],[26,14],[23,21],[16,24],[9,21],[6,14],[9,7]])m.ellipse(x,y,3,3,c);},C.sage);
  p.ellipse(16,14,5,5,C.ink);p.ellipse(16,14,4,4,null);
  p.P([[13,26],[19,26],[17,31],[14,29]],C.cream);p.rect(11,22,2,2,C.lavender);p.rect(15,23,2,2,C.lavender);
  const y=stage===1?16:23;
  p.P([[7,y],[3,y-1],[2,y+3],[6,y+4],[8,y+1]],C.cream);p.rect(4,y+1,2,1,C.ink);
  p.P([[25,y],[29,y-1],[30,y+3],[27,y+4],[24,y+1]],C.cream);p.rect(27,y+1,2,1,C.ink);
  return p;}
function erasure(stage){const p=new Pixel(48);
  if(stage===4){bookmark(p,C.gold,C.lavender);return p;}
  if(stage===3){p.P([[19,27],[29,24],[31,43],[20,44]],C.lavender);p.P([[22,26],[28,25],[28,30]],C.gold);p.rect(24,31,1,10,C.ink);return p;}
  const left=stage===1?3:stage===2?12:7,right=stage===1?44:stage===2?36:40;
  p.P([[left,19],[15,15],[31,15],[right,19],[35,42],[28,44],[17,43],[12,41]],C.lavender);
  p.E(22,13,8,6,C.cream);p.P([[13,9],[12,3],[18,6],[22,1],[27,6],[34,4],[32,10]],C.gold);
  p.rect(17,12,2,2,C.ink);p.rect(23,12,2,2,C.ink);p.R(15,43,5,2,C.lavender);p.R(29,43,5,2,C.lavender);
  if(stage===2){p.P([[15,23],[24,26],[30,39],[19,38]],C.lavender);p.rect(24,26,1,12,C.ink);return p;}
  p.E(left+1,24,2,2,C.cream);p.E(right-1,24,2,2,C.cream);
  p.E(15,29,4,4,C.ink);p.ellipse(15,29,3,3,null);p.R(23,28,5,5,C.ink);p.rect(24,29,3,3,null);
  p.P([[33,26],[37,33],[29,33]],C.ink);p.poly([[33,28],[35,32],[31,32]],null);
  return p;}
await fs.mkdir(spriteDir,{recursive:true});
const frames={reader:[0,1,2,3].map(reader),drought:[0,1,2,3,4].map(drought),bloomgap:[0,1,2,3,4].map(bloomgap),erasure:[0,1,2,3,4].map(erasure)};
const paths=[];const manifest={};
for(const [name,poses] of Object.entries(frames)){
  const image=sheet(poses);const path=`${spriteDir}/${name}.png`;await save(image,path);paths.push(path);
  await save(image,`${conceptDir}/${name}-sheet.png`,name==='erasure'?6:8);
  manifest[name]={width:poses[0].w,height:poses[0].h,columns:poses.length,frames:poses.map((_,i)=>({x:i*poses[0].w,y:0,width:poses[0].w,height:poses[0].h})),states:name==='reader'?['idle','defend','point','defeat']:['idle','attack','seal-1','seal-2','seal-3']};
}
await fs.writeFile(`${spriteDir}/frames.json`,JSON.stringify(manifest,null,2));
await fs.writeFile(`${conceptDir}/sprite-audit.json`,JSON.stringify(await metadata(paths),null,2));
console.log('정수 격자 캐릭터 4시트·확대본·프레임·알파 검사 기록 생성 완료');
