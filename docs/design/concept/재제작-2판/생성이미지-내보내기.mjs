// AI 생성 원본의 셀 분리·정수 크기·팔레트·이진 알파만 정리한다. 그림을 코드로 그리지 않는다.
import fs from 'node:fs/promises'
import path from 'node:path'
import {createRequire} from 'node:module'
import {fileURLToPath} from 'node:url'
import {cleanSheet} from '../../board/source/sprite-components.mjs'
const base=fileURLToPath(new URL('./',import.meta.url)),root=fileURLToPath(new URL('../../../../',import.meta.url)),require=createRequire(path.join(root,'package.json')),sharp=require('sharp')
const jobs=JSON.parse(await fs.readFile(path.join(base,'생성기록.json'),'utf8')).map(j=>({...j,path:path.resolve(base,j.path)}))
const output=process.env.WORD_SPIRE_ART_OUTPUT||path.join(base,'내보내기');await fs.mkdir(output,{recursive:true})
const names={reader:'주인공',dokkaebi:'먹안개도깨비',tiger:'뒤섞는호랑이',fox:'헛소문여우',seal:'호리병봉인',gourd:'호리병',icons:'기능아이콘','card-kinds':'카드종류표식','card-frame':'카드틀'}
const config={
 reader:{size:64,master:128,cols:4,rows:4,labels:['idle','defend','point','down','stamp','blink1','blink2','grip1','grip2','grip3','hem1','hem2','hem3']},
 dokkaebi:{size:64,master:128,cols:4,rows:4,labels:['idle','idle2','attack','flinch','blink1','blink2','tilt1','tilt2','tilt3','settle1','settle2']},
 tiger:{size:64,master:128,cols:4,rows:4,labels:['idle','idle2','attack','flinch','blink1','blink2','ear1','ear2','tail1','tail2','tail3']},
 fox:{size:80,master:160,cols:4,rows:4,labels:['idle','idle2','attack','flinch','blink1','blink2','head1','head2','head3','ear1','ear2','tail1','tail2','tail3']},
 seal:{size:64,master:128,cols:3,rows:1,labels:['fold','pour','closed']},
 gourd:{size:32,master:64,cols:1,rows:1,labels:['closed']},
 icons:{size:16,master:32,cols:4,rows:3,labels:['think','damage','defense','fog','evidence','clue','sure','unsure','seal','hit','weak','fail']},
 'card-kinds':{size:24,master:48,cols:3,rows:2,labels:['literal','connect','author','fog','seal','word']},
 'card-frame':{size:48,master:96,cols:1,rows:1,labels:['frame']}
}
async function nativeCell(j,c,i){
 const m=await sharp(j.path).metadata(),col=i%c.cols,row=Math.floor(i/c.cols),left=Math.floor(col*m.width/c.cols),top=Math.floor(row*m.height/c.rows),right=Math.floor((col+1)*m.width/c.cols),bottom=Math.floor((row+1)*m.height/c.rows)
 const pad=Math.max(2,Math.round(c.master/16)),inner=c.master-pad*2
 const {data,info}=await sharp(j.path).extract({left,top,width:right-left,height:bottom-top}).ensureAlpha().resize(inner,inner,{kernel:'nearest',fit:'fill'}).raw().toBuffer({resolveWithObject:true})
 let maxY=0,pixels=0
 for(let p=0;p<data.length;p+=4){if(data[p+3]<192)data.fill(0,p,p+4);else{data[p+3]=255;maxY=Math.max(maxY,Math.floor(p/4/info.width));pixels++}}
 if(pixels===0)throw Error(j.name+' 빈 프레임 '+i)
 const canvas=Buffer.alloc(c.master*c.master*4),shift=inner-1-maxY
 for(let y=0;y<inner;y++)for(let x=0;x<inner;x++){const dy=y+pad+shift;if(dy>=c.master)continue;data.copy(canvas,(dy*c.master+x+pad)*4,(y*inner+x)*4,(y*inner+x+1)*4)}
 return sharp(canvas,{raw:{width:c.master,height:c.master,channels:4}}).png({compressionLevel:9}).toBuffer()
}
async function globalPalette(buffer){
 const metadata=await sharp(buffer).metadata()
 const quant=await sharp(buffer).png({palette:true,colours:16,dither:0,compressionLevel:9,effort:10}).toBuffer()
 const rgba=await sharp(quant).ensureAlpha().raw().toBuffer(),colors=new Map()
 for(let p=0;p<rgba.length;p+=4)if(rgba[p+3]){const key=rgba.subarray(p,p+3).toString('hex');if(!colors.has(key))colors.set(key,[rgba[p],rgba[p+1],rgba[p+2]])}
 const darkest=[...colors.entries()].sort((a,b)=>a[1].reduce((s,x)=>s+x,0)-b[1].reduce((s,x)=>s+x,0))[0]?.[0]
 for(let p=0;p<rgba.length;p+=4){if(!rgba[p+3])rgba.fill(0,p,p+4);else{rgba[p+3]=255;if(rgba.subarray(p,p+3).toString('hex')===darkest){rgba[p]=47;rgba[p+1]=42;rgba[p+2]=61}}}
 return sharp(rgba,{raw:{width:metadata.width,height:metadata.height,channels:4}}).png({compressionLevel:9}).toBuffer()
}
const audit=[]
for(const j of jobs){
 const c=config[j.name],cells=[]
 for(let i=0;i<c.labels.length;i++)cells.push(await nativeCell(j,c,i))
 const composed=await sharp({create:{width:c.master*cells.length,height:c.master,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(cells.map((input,i)=>({input,left:i*c.master,top:0}))).png({compressionLevel:9}).toBuffer()
 const sheet=await cleanSheet(await globalPalette(composed),c.master,c.labels,j.name,sharp)
 for(let i=0;i<c.labels.length;i++)await sharp(sheet).extract({left:i*c.master,top:0,width:c.master,height:c.master}).png().toFile(path.join(output,`${j.name}-${c.labels[i]}.png`))
 await fs.writeFile(path.join(output,`${j.name}-master.png`),sheet)
 const compatible=await sharp(sheet).resize(c.size*cells.length,c.size,{kernel:'nearest'}).png({compressionLevel:9}).toBuffer()
 await fs.writeFile(path.join(output,`${j.name}.png`),compatible)
 const {data}=await sharp(compatible).ensureAlpha().raw().toBuffer({resolveWithObject:true}),alpha=new Set(),colors=new Set();let opaque=0
 for(let p=0;p<data.length;p+=4){alpha.add(data[p+3]);if(data[p+3]){opaque++;colors.add(data.subarray(p,p+3).toString('hex'))}}
 audit.push({name:j.name,korean:names[j.name],source:j.path,master:c.master,size:c.size,labels:c.labels,frames:c.labels.length,alphaValues:[...alpha].sort((a,b)=>a-b),opaqueColors:colors.size,opaquePixels:opaque,method:'AI source; fixed grid crop, nearest integer-size export, alpha>=192 to255, shared palette16 per sheet, darkest palette entry ink, no procedural drawing'})
 console.log(j.name,c.labels.length,c.size,c.master,[...alpha],colors.size)
}
await fs.writeFile(path.join(output,'audit.json'),JSON.stringify(audit,null,2)+'\n')
