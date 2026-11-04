import fs from 'node:fs'
const [rows,out]=process.argv.slice(2)
const g=[...Array(64)].map(()=>[...'.'.repeat(64)])
for(const line of fs.readFileSync(rows,'utf8').split('\n')){if(!line.trim()||line.startsWith("#"))continue
 const [y,x,s]=line.split(' ');[...s].forEach((c,i)=>{if(c!=='.')g[+y][+x+i]=c})}
fs.writeFileSync(out,g.map(r=>r.join('')).join('\n'))
