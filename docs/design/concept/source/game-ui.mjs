import {P,C,cloud,paper,fan} from './game-pixel.mjs';
function tinyGourd(p,x,y){p.E(x,y+3,2,2,C.cream);p.E(x,y+8,3,3,C.cream);p.rect(x,y+8,3,2,C.sage);p.R(x-1,y,2,1,C.ochre);p.set(x+3,y+5,C.red);}
function mapae(p){p.E(8,8,6,6,C.ochre);p.ellipse(8,8,5,5,C.gold);p.E(8,3,1,1,C.ochre);
 p.poly([[4,7],[6,6],[7,3],[9,4],[10,6],[9,7],[7,7],[7,9],[11,9],[11,11],[9,10],[6,10],[5,12],[4,12]],C.ink);
 p.line(11,9,12,7,C.ink);}
function page(p,x,y,w=8,h=10){p.R(x,y,w,h,C.cream);p.poly([[x+w-3,y],[x+w,y+3],[x+w-3,y+3]],C.sand);}
export function icon(n){const p=new P(16);
 if(n===0)mapae(p);
 if(n===1){p.Q([[7,2],[9,5],[13,4],[11,8],[14,10],[10,11],[8,14],[6,11],[2,12],[4,8],[2,5],[6,5]],C.red);p.set(8,8,C.cream);}
 if(n===2){p.Q([[3,5],[5,3],[8,2],[11,3],[13,5],[10,10],[8,13],[6,10]],C.cream);p.path([[3,5],[8,13],[5,3]],C.ochre);p.path([[8,2],[8,13],[13,5]],C.ochre);}
 if(n===3){p.E(5,8,3,3,C.purple);p.E(9,6,3,3,C.purple);p.E(12,9,2,3,C.purple);p.rect(3,9,10,3,C.purple);p.line(4,9,11,9,C.cream);p.line(6,11,12,11,C.plum);}
 if(n===4){page(p,4,2,7,11);p.line(6,6,10,6,C.ink);p.line(6,9,10,9,C.ochre);p.line(6,11,9,11,C.ink);}
 if(n===5){p.E(6,6,4,4,C.gold);p.ellipse(6,6,2,2,C.cream);p.path([[9,9],[12,12],[13,12]],C.ink,2);}
 if(n===6){p.E(8,8,6,6,C.gold);p.path([[4,8],[7,11],[12,5]],C.ink,2);}
 if(n===7){p.Q([[4,3],[11,3],[13,5],[13,10],[9,11],[5,14],[5,11],[2,10],[2,5]],C.purple);p.rect(4,7,2,2,C.ink);p.rect(8,7,2,2,C.ink);}
 if(n===8)tinyGourd(p,7,2);
 if(n===9){p.Q([[8,1],[10,5],[14,7],[10,9],[8,14],[6,9],[1,7],[6,5]],C.gold);p.rect(7,6,2,3,C.cream);}
 if(n===10){p.Q([[4,3],[6,6],[8,7],[5,10],[3,12],[3,8],[1,6],[4,6]],C.ochre);p.path([[10,4],[12,6],[10,9]],C.ink);}
 if(n===11){page(p,3,3,9,9);p.path([[5,5],[10,10]],C.plum,2);p.path([[10,5],[5,10]],C.plum,2);}
 return p;
}
export function kind(n){const p=new P(24);
 if(n===0){page(p,7,4,11,16);p.line(9,10,15,10,C.ochre);p.line(9,14,14,14,C.ochre);}
 if(n===1){page(p,3,5,9,13);page(p,12,8,9,13);p.line(10,13,14,13,C.ochre);}
 if(n===2){p.Q([[3,5],[12,5],[14,7],[14,13],[9,14],[5,18],[5,14],[2,13]],C.cream);p.Q([[12,10],[19,10],[21,12],[21,18],[18,19],[18,21],[15,19],[12,18]],C.sage);p.rect(5,9,2,2,C.ink);p.rect(9,9,2,2,C.ink);}
 if(n===3){p.path([[4,13],[3,9],[6,6],[10,6],[12,9],[10,12],[7,12],[6,10]],C.ink,3);p.path([[4,13],[4,9],[6,7],[9,7],[11,9],[10,11],[7,11]],C.purple,2);
  p.path([[8,17],[15,17],[20,13],[20,8],[17,5],[14,6],[14,9],[17,10]],C.plum,2);p.line(6,20,17,20,C.purple);}
 if(n===4){tinyGourd(p,8,7);p.R(17,10,3,5,C.ochre);p.R(15,15,7,4,C.red);p.rect(17,16,3,1,C.cream);}
 if(n===5){fan(p,12,20,9);}
 return p;
}
export function cardFrame(){const p=new P(48);
 p.Q([[3,2],[44,2],[45,3],[45,44],[44,45],[3,45],[2,44],[2,3]],C.cream);
 p.rect(4,3,40,2,C.gold);p.rect(4,43,40,2,C.ochre);p.rect(3,4,2,40,C.gold);p.rect(43,4,2,40,C.ochre);
 p.rect(6,6,36,36,C.cream);p.line(6,6,41,6,C.sand);p.line(6,6,6,41,C.sand);p.line(41,6,41,41,C.sand);p.line(6,41,41,41,C.sand);
 for(const[x,y,sx,sy]of[[8,8,1,1],[39,8,-1,1],[8,39,1,-1],[39,39,-1,-1]]){
  const point=(a,b)=>[x+a*sx,y+b*sy];p.path([point(0,5),point(0,1),point(2,0),point(4,1),point(4,3),point(2,4),point(1,3)],C.gold);
  p.line(...point(6,0),...point(6,3),C.ochre);p.set(...point(7,4),C.gold);
 }
 p.poly([[38,44],[44,38],[44,44]],C.sage);p.line(38,44,44,38,C.ink);
 return p;
}
