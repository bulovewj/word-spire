import {createRequire} from 'node:module';
import {Pixel,C,sheet,save,metadata,fs} from './pixel.mjs';
const require=createRequire(`${process.cwd()}/package.json`);const sharp=require('sharp');
const out=`${process.cwd()}/docs/design/concept`;
const kinds=['literal','connect','author','fog','seal','word'];
const frames=kinds.map((kind,i)=>{const p=new Pixel(104,56),accent=i===3?C.lavender:i===5?C.blue:C.gold;
  p.P([[3,2],[99,2],[102,5],[102,52],[99,54],[3,54],[1,52],[1,5]],C.cream);
  p.rect(3,51,97,2,accent);p.rect(4,5,13,10,C.ink);p.rect(5,6,11,8,C.cream);
  p.rect(66,5,32,10,C.ink);p.rect(67,6,30,8,C.cream);
  p.poly([[96,2],[101,7],[96,7]],accent);
  if(i===1){p.rect(47,51,3,2,C.cream);p.rect(53,51,3,2,C.cream);}
  if(i===2){p.rect(89,49,8,2,accent);}
  if(i===4){p.rect(4,49,20,1,accent);p.rect(78,49,20,1,accent);}
  return p;
});
await fs.mkdir(`${out}/cards`,{recursive:true});
for(let i=0;i<frames.length;i++)await save(frames[i],`${out}/cards/${kinds[i]}.png`);
await save(sheet(frames),`${out}/card-frames.png`);
await save(sheet(frames,2),`${out}/card-frames-preview.png`,6);
const artwork=[
 ['think',C.gold,'<path d="M5 2h6l3 5-6 7-6-7z"/><path d="M2 7h12M5 2l3 5 3-5M8 7v7" fill="none"/>'],
 ['damage',C.red,'<path d="M6 1v4H1l4 4-2 5 5-3 5 3-2-5 4-4h-5V1L8 4z"/>'],
 ['defense',C.blue,'<path d="M3 3l5-1 5 1v6l-5 5-5-5z"/><path d="M5 7l2 2 4-4" fill="none"/>'],
 ['fog',C.lavender,'<path d="M2 6h2V4h3V2h4v3h2v2h2v5H1V8h1z"/><path d="M3 8h9M4 10h7" fill="none"/>'],
 ['evidence',C.cream,'<path d="M3 1h7l3 3v11H3z"/><path d="M10 1v3h3M5 6h6M5 9h6M5 12h3" fill="none"/>'],
 ['clue',C.gold,'<path d="M3 2h6l3 3v5l-3 3H3l-2-3V5z"/><path d="M4 5h4v4H4z" fill="none"/><path d="M10 11l4 4" fill="none" stroke-width="2"/>'],
 ['sure',C.gold,'<path d="M5 1h6l4 4v6l-4 4H5l-4-4V5z"/><path d="M4 8l3 3 5-6" fill="none"/>'],
 ['unsure',C.lavender,'<path d="M8 1l7 7-7 7-7-7z"/><path d="M7 7h2v2H7z" fill="#2f2a3d"/>'],
 ['seal',C.gold,'<path d="M4 1h8v14l-4-3-4 3z"/>'],
 ['hit',C.gold,'<path d="M2 8l4-4 3 3 4-4 2 2-5 5-3-2-3 3z"/>'],
 ['weak',C.gold,'<path d="M1 8l4-4 3 3-4 4z"/><path d="M9 6l3-3 3 3-4 4z" fill="none"/>'],
 ['fail',C.lavender,'<path d="M2 2h10v3h2v9H2z"/><path d="M12 2v3h2M5 6l4 4M9 6l-4 4" fill="none"/>'],
];
const icons=[];await fs.mkdir(`${out}/icons`,{recursive:true});
for(const[name,color,paths]of artwork){const source=`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" shape-rendering="crispEdges"><g fill="${color}" stroke="${C.ink}" stroke-width="1" stroke-linecap="square" stroke-linejoin="miter">${paths}</g></svg>`;
 const {data}=await sharp(Buffer.from(source)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const pixel=new Pixel(16);for(let i=0;i<256;i++)if(data[i*4+3]>=128)pixel.data[i]=`#${data.subarray(i*4,i*4+3).toString('hex')}`;
 icons.push(pixel);await save(pixel,`${out}/icons/${name}.png`);
}
await save(sheet(icons),`${out}/icons.png`);
await save(sheet(icons,4),`${out}/icons-preview.png`,12);
const paths=[...kinds.map(name=>`${out}/cards/${name}.png`),...artwork.map(([name])=>`${out}/icons/${name}.png`)];
await fs.writeFile(`${out}/ui-asset-audit.json`,JSON.stringify(await metadata(paths)));
console.log('카드 6종·16px 아이콘 12종의 투명 PNG와 확대 시트 생성 완료');
