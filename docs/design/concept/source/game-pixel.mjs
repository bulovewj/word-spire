// Integer pixel authoring; no raster reference is sampled, resized or thresholded.
import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
const require=createRequire(`${process.cwd()}/package.json`);
export const sharp=require('sharp');
export {fs};
export const C={ink:'#2f2a3d',navy:'#484657',cream:'#fffaf0',sand:'#d8b99b',gold:'#d6a33a',ochre:'#a8741a',sage:'#8a9877',green:'#687c5f',purple:'#a28cbe',plum:'#7a6396',orange:'#e3a84b',rust:'#b87837',fur:'#ded3e4',red:'#c34e49',blue:'#4a7fbf'};
export class P{
 constructor(w,h=w){this.w=w;this.h=h;this.data=Array(w*h).fill(null);}
 set(x,y,c){if(!Number.isInteger(x)||!Number.isInteger(y))throw Error('Non-integer pixel');if(x>=0&&y>=0&&x<this.w&&y<this.h)this.data[y*this.w+x]=c;}
 get(x,y){return x>=0&&y>=0&&x<this.w&&y<this.h?this.data[y*this.w+x]:null;}
 rect(x,y,w,h,c){for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)this.set(i,j,c);}
 ellipse(cx,cy,rx,ry,c){for(let y=cy-ry;y<=cy+ry;y++)for(let x=cx-rx;x<=cx+rx;x++)if((x-cx)**2*ry**2+(y-cy)**2*rx**2<=rx**2*ry**2)this.set(x,y,c);}
 poly(points,c){for(let y=0;y<this.h;y++)for(let x=0;x<this.w;x++){let hit=false;for(let i=0,j=points.length-1;i<points.length;j=i++){
  const[a,b]=points[i],[d,e]=points[j];if((b>y)!=(e>y)&&x<(d-a)*(y-b)/(e-b)+a)hit=!hit;
 }if(hit)this.set(x,y,c);}}
 line(x0,y0,x1,y1,c,width=1){let dx=Math.abs(x1-x0),sx=x0<x1?1:-1,dy=-Math.abs(y1-y0),sy=y0<y1?1:-1,err=dx+dy;
  for(;;){this.rect(x0,y0,width,width,c);if(x0===x1&&y0===y1)break;const e=err*2;if(e>=dy){err+=dy;x0+=sx;}if(e<=dx){err+=dx;y0+=sy;}}}
 path(points,c,width=1){for(let i=1;i<points.length;i++)this.line(...points[i-1],...points[i],c,width);}
 outline(draw,c){const m=new P(this.w,this.h);draw(m,c);for(let y=0;y<this.h;y++)for(let x=0;x<this.w;x++)if(m.get(x,y))for(const[dx,dy]of[[-1,0],[1,0],[0,-1],[0,1]])if(!m.get(x+dx,y+dy))this.set(x+dx,y+dy,C.ink);this.blit(m);}
 R(x,y,w,h,c){this.outline((p,f)=>p.rect(x,y,w,h,f),c);}
 E(x,y,rx,ry,c){this.outline((p,f)=>p.ellipse(x,y,rx,ry,f),c);}
 Q(points,c){this.outline((p,f)=>p.poly(points,f),c);}
 blit(p,dx=0,dy=0){for(let y=0;y<p.h;y++)for(let x=0;x<p.w;x++)if(p.get(x,y))this.set(x+dx,y+dy,p.get(x,y));}
 raw(){const b=Buffer.alloc(this.w*this.h*4);for(let i=0;i<this.data.length;i++)if(this.data[i]){const hex=this.data[i].slice(1);b[i*4]=parseInt(hex.slice(0,2),16);b[i*4+1]=parseInt(hex.slice(2,4),16);b[i*4+2]=parseInt(hex.slice(4,6),16);b[i*4+3]=255;}return b;}
 async save(path){await sharp(this.raw(),{raw:{width:this.w,height:this.h,channels:4}}).png().toFile(path);}
}
export function atlas(frames){const p=new P(frames[0].w*frames.length,frames[0].h);frames.forEach((f,i)=>p.blit(f,i*f.w,0));return p;}
export function cloud(p,x,y,c=C.gold){p.path([[x-4,y+2],[x-5,y],[x-4,y-2],[x-1,y-2],[x,y],[x-1,y+1],[x-2,y],[x,y-1],[x+3,y-1],[x+4,y+1],[x+3,y+3],[x-1,y+3]],c);}
export function dragon(p,x,y){p.ellipse(x,y,7,7,C.gold);p.ellipse(x,y,6,6,C.navy);
 p.path([[x-2,y-2],[x-4,y],[x-3,y+3],[x,y+4],[x+3,y+2],[x+2,y],[x,y],[x-1,y+1]],C.gold,1);
 p.poly([[x-3,y-4],[x+1,y-4],[x+2,y-2],[x,y-1],[x-4,y-1]],C.gold);p.set(x-1,y-3,C.navy);
 p.set(x,y-5,C.gold);p.set(x-3,y-5,C.gold);p.line(x-4,y-1,x-5,y,C.gold);
 p.line(x-3,y+2,x-5,y+3,C.gold);p.line(x+2,y+2,x+4,y+4,C.gold);p.line(x,y+4,x-1,y+5,C.gold);}
export function paper(p,points){p.Q(points,C.cream);const[x,y]=points[0];p.set(x+1,y+1,C.gold);}
export function fan(p,x,y,r=12){for(const points of[[[x,y],[x-r,y-r+1],[x-r+5,y-r-3]],[[x,y],[x-5,y-r-3],[x+1,y-r-4]],[[x,y],[x+2,y-r-4],[x+8,y-r-1]],[[x,y],[x+8,y-r],[x+r,y-6]]])paper(p,points);p.E(x,y,2,1,C.ochre);}
