import fs from 'node:fs/promises'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
const base=fileURLToPath(new URL('../../',import.meta.url)),assets=JSON.parse(await fs.readFile(base+'board/assets.json','utf8')),file=base+'에셋-대장.md'
let ledger=await fs.readFile(file,'utf8')
ledger=ledger.split('\n').map(line=>{const id=line.match(/^\| (\S+) \|/)?.[1],a=assets.find(a=>a.id===id);return a?`| ${a.id} | ${a.scenes} | ${a.slot} | ${a.file?'['+path.basename(a.file)+']('+a.file+')'+(a.index!==undefined?' #'+a.index+' '+a.label:''):'—'} | ${a.w}×${a.h} ×${a.scale}${a.reviewWidth?' / 검토'+a.reviewWidth+'px':''} | ${a.use} | ${a.motion} | ${a.version} | ${a.status} | ${a.memo} |`:line}).join('\n')
await fs.writeFile(file,ledger)
