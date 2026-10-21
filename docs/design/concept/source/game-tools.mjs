import {P,C,cloud,paper} from './game-pixel.mjs';
export function gourd(closed=true,stamped=true){const p=new P(32);
 p.E(14,22,9,7,C.cream);p.E(14,12,6,5,C.cream);
 p.poly([[19,9],[21,13],[18,17],[20,19],[22,24],[19,28],[12,29],[11,27],[17,26],[18,23],[17,18],[16,17],[19,14]],C.sage);
 p.line(11,17,18,17,C.ochre);cloud(p,13,23,C.gold);
 p.R(11,6,6,2,C.ochre);p.rect(12,6,4,1,C.gold);
 if(closed){p.R(12,2,4,3,C.ochre);p.rect(13,2,2,1,C.sand);}else{p.rect(12,6,4,2,C.ink);}
 p.path([[18,8],[22,9],[22,13]],C.red);p.E(21,9,1,1,C.red);p.Q([[22,12],[27,13],[28,20],[23,21]],C.cream);
 if(stamped){p.rect(24,15,3,4,C.red);p.set(25,16,C.cream);p.set(26,18,C.cream);}
 p.line(26,22,27,26,C.red);p.rect(26,26,3,2,C.ochre);return p;
}
export function seal(stage){const p=new P(64),bottle=gourd(stage===2,stage===2);p.blit(bottle,stage===0?31:17,31);
 if(stage===0){
  p.Q([[8,18],[21,11],[32,17],[25,26],[31,34],[21,39],[8,32]],C.cream);
  p.poly([[21,11],[20,24],[8,32],[21,39],[25,26],[32,17]],C.purple);
  p.path([[8,18],[20,24],[32,17]],C.ink);p.path([[20,24],[25,26],[21,39]],C.plum);
  p.path([[25,37],[30,40],[33,38],[34,35]],C.purple,2);paper(p,[[7,40],[12,38],[16,42],[11,45]]);
 }else if(stage===1){
  p.path([[16,11],[13,14],[15,19],[22,20],[28,16],[31,17],[31,21],[26,26],[29,31],[31,35]],C.plum,4);
  p.path([[16,12],[15,15],[17,17],[23,17],[28,14],[31,16],[30,21],[26,25],[28,30],[30,35]],C.purple,2);
  paper(p,[[40,10],[46,12],[45,17],[39,15]]);paper(p,[[10,25],[14,23],[18,27],[13,30]]);
  p.R(43,36,5,4,C.ochre);p.line(44,36,47,36,C.sand);
 }else{
  p.R(45,24,5,6,C.ochre);p.R(42,30,11,5,C.gold);p.rect(43,34,9,2,C.red);
  p.line(39,40,43,39,C.gold);p.set(45,40,C.gold);
 }
 return p;
}
