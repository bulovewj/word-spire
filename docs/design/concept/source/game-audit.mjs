import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {sharp,fs,C} from './game-pixel.mjs';
import {previewRows} from './game-preview.mjs';
export const specs={reader:[64,64,['idle','defend','point','down','stamp']],dokkaebi:[64,64,['idle','idle2','attack','flinch']],tiger:[64,64,['idle','idle2','attack','flinch']],fox:[80,80,['idle','idle2','attack','flinch']],seal:[64,64,['fold','pour','closed']],gourd:[32,32,['closed']],icons:[16,16,['think','damage','defense','fog','evidence','clue','sure','unsure','seal','hit','weak','fail']],'card-frame':[48,48,['frame']],'card-kinds':[24,24,['literal','connect','author','fog','seal','word']]};
export async function audit(root){const report=[],dir=`${root}/src/ui/sprites`,manifest=JSON.parse(await fs.readFile(`${dir}/frames.json`,'utf8'));
 assert.deepEqual(Object.keys(manifest).sort(),Object.keys(specs).sort());
 const palette=new Set(Object.values(C));
 for(const[name,[w,h,labels]]of Object.entries(specs)){
  const path=`${dir}/${name}.png`,meta=await sharp(path).metadata();
  assert.equal(meta.width,w*labels.length);assert.equal(meta.height,h);assert.equal(meta.channels,4);
  const {data}=await sharp(path).raw().toBuffer({resolveWithObject:true});
  const alphas=new Set(),colors=new Set();let opaque=0,transparent=0;const cells=[];
  for(let n=0;n<labels.length;n++){
   let x0=w,y0=h,x1=-1,y1=-1;const colorSet=new Set();
   for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const i=(y*meta.width+n*w+x)*4,a=data[i+3];alphas.add(a);assert.ok(a===0||a===255,`${name}: alpha ${a}`);
    if(!a){transparent++;assert.equal(data[i]+data[i+1]+data[i+2],0,`${name}: hidden RGB`);continue;}
    opaque++;const c=`#${data.subarray(i,i+3).toString('hex')}`;assert.ok(palette.has(c),`${name}: ${c}`);colors.add(c);colorSet.add(c);
    x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);
   }
   assert.ok(x1>=x0&&y1>=y0,`${name}: empty frame`);
   cells.push({label:labels[n],bounds:[x0,y0,x1,y1],colors:colorSet.size});
  }
  assert.deepEqual([...alphas].sort((a,b)=>a-b),[0,255]);assert.ok(opaque>0&&transparent>0);assert.ok(colors.has(C.ink));
  const m=manifest[name];assert.equal(m.width,w);assert.equal(m.height,h);assert.deepEqual(m.labels,labels);
  assert.deepEqual(m.frames,labels.map((_,i)=>({x:i*w,y:0,width:w,height:h})));
  if(['reader','dokkaebi','tiger','fox','seal'].includes(name)){
   const base=name==='fox'?77:61;assert.ok(cells.every(c=>c.bounds[3]===base),`${name}: baseline ${cells.map(c=>c.bounds[3])}`);
   assert.ok(cells.every(c=>c.bounds[0]>0&&c.bounds[1]>0&&c.bounds[2]<w-1),`${name}: clipped cell edge`);
  }
  const uniqueFrames=new Set();for(let n=0;n<labels.length;n++){
   const pixels=[];for(let y=0;y<h;y++)pixels.push(data.subarray((y*meta.width+n*w)*4,(y*meta.width+(n+1)*w)*4));
   uniqueFrames.add(Buffer.concat(pixels).toString('hex'));
  }
  assert.equal(uniqueFrames.size,labels.length,`${name}: duplicate poses`);
  if(name==='card-frame'){
   const px=(x,y)=>[...data.subarray((y*48+x)*4,(y*48+x)*4+4)];
   for(let y=16;y<32;y++)for(let x=16;x<32;x++)assert.deepEqual(px(x,y),[255,250,240,255]);
   for(let y=0;y<16;y++)for(let x=17;x<32;x++){assert.deepEqual(px(x,y),px(16,y));assert.deepEqual(px(x,y+32),px(16,y+32));}
   for(let x=0;x<16;x++)for(let y=17;y<32;y++){assert.deepEqual(px(x,y),px(x,16));assert.deepEqual(px(x+32,y),px(x+32,16));}
  }
  await fs.access(`${dir}/${name}.prompt.txt`);
  report.push({name,file:`${name}.png`,width:meta.width,height:h,cell:[w,h],frames:labels.length,labels,opaqueColorCount:colors.size,colors:[...colors].sort(),alphaValues:[0,255],opaquePixels:opaque,transparentPixels:transparent,partialAlphaPixels:0,cells});
 }
 const {data:previewData,info}=await sharp(`${root}/docs/design/concept/sprites-preview.png`).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 assert.equal(info.width,1408);assert.equal(info.height,1904);
 for(let i=3;i<previewData.length;i+=4)assert.equal(previewData[i],255,'preview alpha');
 for(const[name,dx,dy]of previewRows){const{data,info:s}=await sharp(`${dir}/${name}.png`).raw().toBuffer({resolveWithObject:true});
  for(let y=0;y<s.height;y++)for(let x=0;x<s.width;x++){
   const i=(y*s.width+x)*4,rgba=data[i+3]?[...data.subarray(i,i+4)]:[245,238,219,255];
   for(let yy=0;yy<4;yy++)for(let xx=0;xx<4;xx++){const k=((dy+y*4+yy)*info.width+dx+x*4+xx)*4;for(let c=0;c<4;c++)assert.equal(previewData[k+c],rgba[c],`${name}: 4x preview`);}
  }
 }
 const result={formatVersion:2,method:'integer RGBA pixel maps; PNG 1px = logical 1px; no resampling or alpha repair',checks:['exact dimensions and labels','nonempty distinct frames','alpha 0/255 only','transparent RGB zero','palette whitelist','character baseline and safe margins','9-slice center and stretchable edges','prompt pairs','exact 4x preview on #f5eedb'],files:report};
 const rows=report.map(r=>'    {\n'+Object.entries(r).map(([k,v])=>`      ${JSON.stringify(k)}: ${JSON.stringify(v)}`).join(',\n')+'\n    }');
 await fs.writeFile(`${root}/docs/design/concept/sprite-audit.json`,'{\n'+Object.entries(result).filter(([k])=>k!=='files').map(([k,v])=>`  ${JSON.stringify(k)}: ${JSON.stringify(v)}`).join(',\n')+',\n  "files": [\n'+rows.join(',\n')+'\n  ]\n}\n');return result;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){const r=await audit(process.cwd());console.log(`${r.files.length} native PNGs: dimensions, alpha, palette, frames, 9-slice and 4x preview PASS`);}
