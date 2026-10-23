import fs from 'node:fs/promises'
const policy=JSON.parse(await fs.readFile(new URL('./sprite-cleanup-policy.json',import.meta.url),'utf8'))
export function components(data,w,h){
 const seen=new Uint8Array(w*h),out=[]
 for(let p=0;p<w*h;p++){if(!data[p*4+3]||seen[p])continue;const todo=[p],pixels=[];seen[p]=1;let x0=w,y0=h,x1=0,y1=0
  while(todo.length){const v=todo.pop(),x=v%w,y=Math.floor(v/w);pixels.push(v);x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y)
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=x+dx,ny=y+dy,np=ny*w+nx;if(nx<0||nx>=w||ny<0||ny>=h||seen[np]||!data[np*4+3])continue;seen[np]=1;todo.push(np)}
  }out.push({pixels,area:pixels.length,x:x0,y:y0,w:x1-x0+1,h:y1-y0+1})
 }return out.sort((a,b)=>b.area-a.area)
}
export function summary(data,w,h){const c=components(data,w,h);return{bodyPixels:c[0]?.area||0,detachedCount:Math.max(0,c.length-1),smallDetachedCount:c.slice(1).filter(c=>c.area<=12).length,detached:c.slice(1).map(({pixels,...c})=>c)}}
const signature=c=>['area','x','y','w','h'].map(k=>c[k]).join(',')
export async function cleanSheet(buffer,size,labels,name,sharp){
 const {data,info}=await sharp(buffer).ensureAlpha().raw().toBuffer({resolveWithObject:true})
 for(const [i,label]of labels.entries()){
  const cell=Buffer.alloc(size*size*4)
  for(let y=0;y<size;y++)data.copy(cell,y*size*4,(y*info.width+i*size)*4,(y*info.width+(i+1)*size)*4)
  const key=name+':'+label,remove=new Set((policy.removeExactComponents[key]||[]).map(signature))
  for(const c of components(cell,size,size).slice(1)){if(remove.has(signature(c))){for(const p of c.pixels){const x=p%size,y=Math.floor(p/size),offset=(y*info.width+i*size+x)*4;data.fill(0,offset,offset+4)}}else if(!policy.keepReasons[key])throw Error('미분류 조각: '+key+' '+signature(c))}
 }
 return sharp(data,{raw:info}).png({compressionLevel:9}).toBuffer()
}
export const keepReason=(name,label)=>policy.keepReasons[name+':'+label]||null
