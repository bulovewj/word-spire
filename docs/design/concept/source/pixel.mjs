// 생성 콘셉트를 참고해 새로 그린 정수 격자. 원본 이미지를 편집/리샘플링하지 않는다.
import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
const require = createRequire(`${process.cwd()}/package.json`);
const sharp = require('sharp');
export const C = { ink:'#2f2a3d', cream:'#fffaf0', sage:'#6faa76', lavender:'#7a7393', gold:'#a8741a', blue:'#3c648f', red:'#c34e49' };
export class Pixel {
  constructor(w,h=w){this.w=w;this.h=h;this.data=Array(w*h).fill(null);}
  set(x,y,c){x=Math.round(x);y=Math.round(y);if(x>=0&&y>=0&&x<this.w&&y<this.h)this.data[y*this.w+x]=c;}
  get(x,y){return x>=0&&y>=0&&x<this.w&&y<this.h?this.data[y*this.w+x]:null;}
  rect(x,y,w,h,c){for(let a=x;a<x+w;a++)for(let b=y;b<y+h;b++)this.set(a,b,c);}
  ellipse(x,y,rx,ry,c){for(let a=Math.floor(x-rx);a<=x+rx;a++)for(let b=Math.floor(y-ry);b<=y+ry;b++)if(((a-x)/rx)**2+((b-y)/ry)**2<=1)this.set(a,b,c);}
  poly(points,c){for(let y=0;y<this.h;y++)for(let x=0;x<this.w;x++){
    let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){
      const [xi,yi]=points[i],[xj,yj]=points[j];
      if(((yi>y)!=(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi))inside=!inside;
    }if(inside)this.set(x,y,c);
  }}
  outlined(draw,color){const mask=new Pixel(this.w,this.h);draw(mask,color);for(let y=0;y<this.h;y++)for(let x=0;x<this.w;x++)if(mask.get(x,y)){
    for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]])if(!mask.get(x+dx,y+dy))this.set(x+dx,y+dy,C.ink);
  }for(let i=0;i<this.data.length;i++)if(mask.data[i])this.data[i]=mask.data[i];}
  R(x,y,w,h,c){this.outlined((m,f)=>m.rect(x,y,w,h,f),c);}
  E(x,y,rx,ry,c){this.outlined((m,f)=>m.ellipse(x,y,rx,ry,f),c);}
  P(points,c){this.outlined((m,f)=>m.poly(points,f),c);}
  svg(){let rects='';for(let y=0;y<this.h;y++)for(let x=0;x<this.w;){const color=this.get(x,y);let end=x+1;while(end<this.w&&this.get(end,y)===color)end++;if(color)rects+=`<rect x="${x}" y="${y}" width="${end-x}" height="1" fill="${color}"/>`;x=end;}
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${this.w}" height="${this.h}" shape-rendering="crispEdges">${rects}</svg>`;}
}
export function sheet(frames,columns=frames.length){const w=frames[0].w,h=frames[0].h;const out=new Pixel(w*columns,h*Math.ceil(frames.length/columns));frames.forEach((f,i)=>{for(let y=0;y<h;y++)for(let x=0;x<w;x++)out.set(i%columns*w+x,Math.floor(i/columns)*h+y,f.get(x,y));});return out;}
export async function save(image,path,scale=1){await sharp(Buffer.from(image.svg())).resize(image.w*scale,image.h*scale,{kernel:'nearest'}).png().toFile(path);}
export async function metadata(paths){const report=[];for(const path of paths){const img=sharp(path);const info=await img.metadata();const {data,info:raw}=await img.ensureAlpha().raw().toBuffer({resolveWithObject:true});const colors=new Set();let transparent=0,partial=0;for(let i=0;i<data.length;i+=4){if(!data[i+3])transparent++;else{if(data[i+3]!==255)partial++;colors.add(data.subarray(i,i+3).toString('hex'));}}report.push({path:path.split('/').at(-1),width:info.width,height:info.height,channels:raw.channels,transparentPixels:transparent,partialAlphaPixels:partial,opaqueColors:[...colors].sort()});}return report;}
export {fs};
