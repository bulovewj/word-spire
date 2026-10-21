import {P,C,paper} from './game-pixel.mjs';
function mist(p,x,y){p.path([[x+7,y+4],[x+3,y+4],[x,y+1],[x,y-2],[x+3,y-4],[x+6,y-3],[x+6,y],[x+3,y],[x+4,y-1]],C.plum,2);p.line(x+1,y+5,x+6,y+6,C.purple);}
export function dokkaebi(pose){const p=new P(64),b=pose===1?-1:0,s=pose===3?2:0;
 p.R(20,57,8,4,C.sand);p.R(38,57,8,4,C.sand);p.rect(21,57,6,2,C.cream);p.rect(39,57,6,2,C.cream);
 p.E(33,44+b,19-s,13,C.sage);p.poly([[22,42+b],[21,51],[30,56],[39,56],[45,52],[46,44+b]],C.green);
 p.Q([[19,38+b],[24,39+b],[24,52],[19,55],[16,49]],C.sage);p.Q([[41,38+b],[47,40+b],[50,48],[45,54],[42,50]],C.sage);
 p.E(31+s,25+b,19-s,16-s,C.cream);
 p.Q([[14+s,20+b],[8+s,16+b],[9+s,24+b],[15+s,28+b]],C.cream);p.poly([[10+s,20+b],[13+s,22+b],[11+s,23+b]],C.sand);
 p.Q([[45,21+b],[52,18+b],[52,24+b],[46,28+b]],C.cream);p.line(47,24+b,50,22+b,C.sand);
 p.poly([[18+s,34+b],[24,39+b],[35,40+b],[45-s,34+b],[43-s,39+b],[36,43+b],[24,42+b]],C.sand);
 p.Q([[18,12+b],[20,8+b],[34,7+b],[42,12+b],[37,14+b],[24,13+b]],C.sage);
 p.Q([[32,8+b],[35,3+b],[40,4+b],[42,7+b],[38,10+b]],C.green);p.set(37,6+b,C.sage);
 p.line(18+s,21+b,23+s,19+b,C.ink,2);p.line(31+s,19+b,36+s,20+b,C.ink,2);
 if(pose===3){p.line(20,25+b,24,26+b,C.ink);p.line(32,25+b,36,24+b,C.ink);}else{
  p.E(22+s,25+b,3,4,C.ink);p.rect(20+s,23+b,2,2,C.cream);p.E(34+s,25+b,3,4,C.ink);p.rect(32+s,23+b,2,2,C.cream);
 }
 p.E(16+s,31+b,6,4,C.sand);p.rect(13+s,30+b,2,1,C.ochre);p.set(18+s,32+b,C.ochre);p.set(12+s,29+b,C.cream);
 p.path([[24,34+b],[26,36+b],[31,36+b],[33,34+b]],C.ink);
 p.Q([[24,40+b],[29,43+b],[33,40+b],[35,44+b],[29,47+b]],C.cream);
 p.E(29,44+b,2,1,C.ochre);p.line(28,46+b,27,50+b,C.gold);p.line(31,46+b,32,49+b,C.gold);
 p.E(18,51,4,4,C.cream);p.E(45,51,4,4,C.cream);p.line(16,53,19,53,C.sand);p.line(43,53,46,53,C.sand);
 if(pose===2){mist(p,4,36);p.R(12,35,3,3,C.cream);p.line(9,45,13,45,C.purple);}
 if(pose===3){p.path([[39,35],[35,40],[39,43],[35,48]],C.ink);p.line(36,40,41,41,C.cream);}
 return p;
}
function tigerTail(p,attack,b){const a=attack?[[44,47],[49,42],[54,37],[57,28],[55,19],[50,16],[47,19],[48,23]]:[[45,47],[52,43],[57,36],[57,29],[54,25],[50,26],[49,29]];
 const points=a.map(([x,y])=>[x,y+b]);p.path(points,C.ink,6);p.path(points,C.orange,4);
 p.rect(54,32+b,4,3,C.ink);p.rect(48,41+b,4,3,C.ink);
 p.rect(49,attack?17+b:26+b,4,4,C.ink);
}
export function tiger(pose){const p=new P(64),b=pose===1?-1:0,s=pose===3?1:0;
 tigerTail(p,pose===2,b);p.E(34,46+b,17-s,12,C.orange);p.poly([[39,40],[48,43],[48,52],[41,57],[35,56]],C.rust);
 p.E(22,55,8,5,C.orange);p.E(37,55,8,5,C.orange);p.R(17,56,8,5,C.cream);p.R(33,56,8,5,C.cream);
 p.rect(19,59,1,2,C.sand);p.rect(22,59,1,2,C.sand);p.rect(35,59,1,2,C.sand);p.rect(38,59,1,2,C.sand);
 p.E(16+s,13+b,6,6,C.ink);p.E(16+s,13+b,4,4,C.orange);p.ellipse(16+s,14+b,2,2,C.cream);
 p.E(41+s,13+b,6,6,C.ink);p.E(41+s,13+b,4,4,C.orange);p.ellipse(41+s,14+b,2,2,C.cream);
 p.E(29+s,28+b,18-s,16-s,C.orange);p.poly([[34,15+b],[42,20+b],[45,28+b],[42,37+b],[34,42+b],[35,36+b]],C.rust);
 p.Q([[26,12+b],[29,15+b],[28,19+b],[25,18+b]],C.ink);p.rect(31,14+b,3,4,C.ink);p.line(29,21+b,32,21+b,C.ink);
 p.poly([[12+s,21+b],[17+s,23+b],[16+s,26+b],[11+s,25+b]],C.ink);
 p.poly([[12+s,29+b],[17+s,30+b],[18+s,33+b],[13+s,33+b]],C.ink);
 p.poly([[43,22+b],[38,24+b],[39,27+b],[45,25+b]],C.ink);p.poly([[43,31+b],[37,33+b],[38,36+b],[44,34+b]],C.ink);
 p.E(20+s,35+b,8,6,C.cream);p.E(31+s,36+b,7,5,C.cream);p.poly([[15,38+b],[22,41+b],[30,41+b],[32,39+b],[27,43+b],[19,42+b]],C.sand);
 p.ellipse(19+s,30+b,3,2,C.ink);p.line(19+s,32+b,19+s,35+b,C.ink);p.path([[16,35+b],[17,37+b],[20,37+b],[22,35+b]],C.ink);
 if(pose===3){p.line(20,25,24,26,C.ink);p.line(31,26,35,25,C.ink);}else{
  p.E(23+s,25+b,3,4,C.ink);p.rect(21+s,23+b,2,2,C.cream);p.E(33+s,26+b,3,4,C.ink);p.rect(31+s,24+b,2,2,C.cream);
 }
 p.line(12,35+b,16,35+b,C.ink);p.line(12,38+b,16,37+b,C.ink);
 p.poly([[21,43],[27,45],[25,48],[20,46]],C.ink);p.poly([[43,46],[38,48],[38,51],[46,49]],C.ink);
 p.line(27,52,29,54,C.ink);p.line(39,53,42,53,C.ink);
 if(pose===2){paper(p,[[5,22],[11,20],[13,24],[7,26]]);p.line(4,31,9,31,C.ochre);p.line(5,34,12,34,C.ochre);}
 if(pose===3){p.path([[38,40],[35,45],[39,48]],C.ink);p.line(36,45,40,46,C.cream);}
 return p;
}
function foxTails(p,pose,b){const ends=[[48,8],[63,5],[75,16],[77,35],[75,54],[65,69]];
 for(let i=ends.length-1;i>=0;i--){let[x,y]=ends[i];if(pose===3){x-=3;y+=2;}if(pose===2&&i%2===0)y-=2;y+=b;
  const dx=x-44,dy=y-61,len=Math.hypot(dx,dy),px=Math.round(-dy/len*6),py=Math.round(dx/len*6);
  const mx=44+Math.round(dx*.65),my=61+Math.round(dy*.65),tx=44+Math.round(dx*.82),ty=61+Math.round(dy*.82);
  p.Q([[43,63],[mx-px,my-py],[x,y],[mx+px,my+py],[47,65]],C.cream);
  p.poly([[x,y],[mx+px,my+py],[tx,ty+1],[mx-px,my-py]],C.purple);
  p.line(47,62,mx,my,C.fur);
 }
}
export function fox(pose){const p=new P(80),b=pose===1?-1:0;
 foxTails(p,pose,b);
 p.Q([[29,40+b],[42,40+b],[49,51+b],[47,67],[38,72],[22,68],[20,53+b]],C.navy);
 p.Q([[27,44+b],[32,48+b],[24,62],[17,62],[15,56+b]],C.navy);p.line(18,59,23,61,C.gold);
 p.Q([[40,44+b],[45,47+b],[48,59],[44,63],[37,56]],C.navy);p.line(41,59,45,60,C.gold);
 p.R(24,73,8,4,C.cream);p.R(37,73,9,4,C.cream);p.line(26,76,30,76,C.fur);p.line(39,76,44,76,C.fur);
 p.Q([[28,53],[36,54],[32,69],[25,70]],C.navy);p.path([[24,65],[31,67],[39,65]],C.gold);
 p.poly([[28,42+b],[33,45+b],[39,41+b],[40,45+b],[30,53+b],[26,48+b]],C.cream);p.line(30,50+b,38,44+b,C.gold);
 p.E(38,48+b,2,2,C.gold);p.line(38,50+b,39,57,C.gold);p.line(36,51+b,35,55,C.gold);
 p.E(18,63,5,3,C.cream);p.E(43,63,4,3,C.cream);p.line(15,64,18,64,C.fur);
 p.Q([[18,25+b],[15,7+b],[24,14+b],[29,25+b]],C.cream);p.poly([[17,12+b],[19,22+b],[23,24+b],[21,16+b]],C.purple);
 p.Q([[32,23+b],[39,5+b],[43,23+b],[40,30+b]],C.cream);p.poly([[38,11+b],[34,24+b],[40,24+b]],C.purple);
 p.Q([[21,21+b],[34,21+b],[41,30+b],[38,40+b],[30,45+b],[16,41+b],[9,37+b],[14,34+b],[12,28+b]],C.cream);
 p.poly([[34,26+b],[39,30+b],[36,38+b],[29,41+b],[23,40+b],[31,37+b]],C.fur);
 p.poly([[12,31+b],[17,33+b],[12,35+b],[8,36+b],[12,38+b],[18,39+b],[15,42+b],[21,42+b]],C.cream);
 p.rect(9,36+b,3,2,C.ink);p.path([[13,39+b],[17,40+b],[20,38+b]],C.ink);
 if(pose===3){p.path([[18,30],[23,32],[25,30]],C.ink);p.path([[30,29],[34,30],[36,28]],C.ink);}else{
  p.poly([[17,29+b],[24,30+b],[22,33+b],[20,33+b]],C.ink);p.poly([[30,28+b],[35,27+b],[33,31+b],[31,32+b]],C.ink);
  p.set(22,30+b,C.cream);p.set(33,28+b,C.cream);
 }
 if(pose===2){paper(p,[[5,14],[11,12],[13,18],[6,20]]);paper(p,[[60,18],[66,17],[68,22],[62,24]]);paper(p,[[68,43],[74,42],[75,48],[70,50]]);}
 if(pose===3){p.path([[41,52],[37,57],[42,61]],C.ink);p.line(38,57,42,58,C.cream);}
 return p;
}
