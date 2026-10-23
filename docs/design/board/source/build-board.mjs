import fs from 'node:fs/promises'
import {createRequire} from 'node:module'
import {assets,root} from './assets.mjs'
const require=createRequire(`${root}/package.json`),sharp=require('sharp')
const dir=`${root}/docs/design/board`
await fs.mkdir(`${dir}/crops`,{recursive:true})
const raw=JSON.parse(await fs.readFile(`${dir}/scenes.json`,'utf8'))
for(const s of raw){if(s.num===12)for(const p of s.places)if(p.n===20)p.id='KEY-reward';if(s.num===18)s.label='채점 배지 · 실제 준비 상태(캐시·로딩 시점에 따라 달라짐)';for(const p of s.places.filter(p=>p.proposal)){const a=assets.find(a=>a.id===p.id);if(!a)continue;if(p.n===1){p.y+=p.h-a.h;p.x+=(p.w-a.w)/2}p.w=a.w;p.h=a.h}if(s.num===8&&!s.places.some(p=>p.id==='FX-fog-clear')){const e=s.places.find(p=>p.n===2);if(e)s.places.push({n:17,id:'FX-fog-clear',x:e.x+32,y:e.y+48,w:64,h:64,proposal:true})}}
const s13={...raw.find(s=>s.file.endsWith('03-floor2.png')),num:13,label:'1280px 같은 2층 상태',file:'board/captures/13-desktop.png'}
await fs.copyFile(`${dir}/captures/03-floor2.png`,`${dir}/captures/13-desktop.png`)
if(!raw.some(s=>s.file.endsWith('13-desktop.png')))raw.splice(raw.findIndex(s=>s.num===13),0,s13)
if(!raw.some(s=>s.file.endsWith('01-motion.png'))){const title={...raw.find(s=>s.file.endsWith('01-saved.png')),label:'기존 타이틀 영상 켠 상태 · 이어하기',file:'board/captures/01-motion.png'};title.places=title.places.flatMap(p=>p.id==='KEY-title-poster'?[p,{...p,id:'KEY-title-loop'}]:[p]);await fs.copyFile(`${dir}/title-1280-saved.png`,`${dir}/captures/01-motion.png`);raw.push(title)}
const script='// 요청6 검토 데이터. 캡처 위 DOM 경계, 새 그림 없음.\nwindow.BOARD_DATA={assets:[\n'+assets.map(a=>JSON.stringify(a)).join(',\n')+'\n],scenes:[\n'+raw.map(s=>JSON.stringify(s)).join(',\n')+'\n]};\n'
await fs.writeFile(`${dir}/data.js`,script)
const crops=[['key-tiger','key-art-v4-korean.png',756,220],['key-reader','key-art-v4-korean.png',556,582],['reader-front','reader-korean-concept.png',403,259],['reader-back','reader-korean-concept.png',1014,326]]
for(const [name,file,left,top]of crops)await sharp(`${root}/docs/design/concept/${file}`).extract({left,top,width:128,height:128}).png().toFile(`${dir}/crops/${name}.png`)
await sharp(`${dir}/captures/13-fox.png`).extract({left:0,top:400,width:390,height:500}).png().toFile(`${dir}/crops/mobile-window.png`)
await sharp(`${root}/src/ui/sprites/reader.png`).extract({left:0,top:0,width:64,height:64}).png().toFile(`${dir}/crops/reader-current.png`)
const options=[['A · 여유 우선',96,120,'96 / 여우120 · 1배. 현재 창보다 작아 디테일은 제한'],['B · 추천',128,160,'128 / 여우160 · 1배. 현재 칸에 맞고 점 수는 4배'],['C · 현재 창 초과',160,200,'160 / 여우200 · 1배. 오른쪽 정보 공간을 침범']]
const source=raw.find(s=>s.file.endsWith('13-fox.png'))
const compare=options.map(([name,normal,fox,why],i)=>`<article><h3>${name}</h3><div class="compare"><img src="crops/mobile-window.png" width="390" height="500" alt="실제 390px 여우·주인공 자리"><div class="candidate ${i===2?'too-large':''}">${source.places.filter(p=>[2,3].includes(p.n)).map(p=>{const n=p.n===2?fox:normal;return `<div style="left:${p.x+(p.w-n)/2}px;top:${p.y-400+p.h-n}px;width:${n}px;height:${n}px"><span>${n}×${n}</span></div>`}).join('')}</div></div><p>${why}</p></article>`).join('')
const detailLabels=['키 아트 v4 · 호랑이 눈·줄무늬','키 아트 v4 · 겹깃·등판','주인공 앞 · 흰 깃·금빛 끈','주인공 뒤 · 원형 용 문양']
const html=`<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>낱말탑 스타일 기준</title><link rel="stylesheet" href="../../../src/styles/tokens.css"><link rel="stylesheet" href="board.css"><link rel="stylesheet" href="style.css"></head><body>
<header><p class="eyebrow">재제작2판 · 새 게임 그림의 실제 캡처와 자리 크기 비교</p><h1>도트 느낌을 살린 일러스트</h1><p>아래 테두리는 크기 후보의 자리 비교야. 캡처에는 새 AI 생성 그림의 게임 호환본이 연결돼 있어. 검토 마스터는128·160px야.</p></header>
<section><h2>390px 실제 전투 창에 맞춰 보기</h2><p>일반(나·도깨비·호랑이) / 여우 · 모두 1배 제안. 같은 바닥선·중심. 원본 캡처 y400~900 부분, 가로390 그대로.</p><div class="compare-row">${compare}</div></section>
<section><h2>“이만큼”의 디테일 · 모두 원본 128×128 부분, 정확히 2배</h2><div class="details-row">${crops.map(([name],i)=>`<figure><img src="crops/${name}.png" width="256" height="256" alt="${detailLabels[i]}"><figcaption>${detailLabels[i]}</figcaption></figure>`).join('')}</div><p>눈과 줄무늬, 흰 깃, 금빛 원형 용이 따로 읽히는 정도. 컨셉의 반투명 번짐은 재사용하지 않아. 1~2px 잉크 실루엣·안쪽 단색 면으로 다시 제작할 기준이야.</p></section>
<section class="palette-row"><article><h2>추천 · 계열당 3단계 / 24색</h2><div class="chips"><i style="background:#fffaf0"></i><i style="background:#d8b99b"></i><i style="background:#a8741a"></i></div><p>밝음·본색·그늘. 주름은 면으로, 번짐·디더링 없이.</p></article><article><h2>후보 · 4단계 / 32색</h2><div class="chips"><i style="background:#fffaf0"></i><i style="background:#d8b99b"></i><i style="background:#a8741a"></i><i style="background:#825515"></i></div><p>작은 얼굴·문양이 꼭 필요할 때만. 칩은 규칙 설명용 UI.</p></article><article><h2>현재 게임용 · 64×64</h2><img src="crops/reader-current.png" width="128" height="128" alt="현재 주인공 정확히2배"><p>현재 게임은64px 호환본×2.128px 검토 마스터는 첫 화면의 동작모음에서 봐.</p></article></section>
<footer>캐릭터 PNG 1px=논리1px · 정수 배율 · 알파0/255 · 잉크 외곽선 · 안티에일리어싱·흐림·그라데이션 없음. AI 재제작2판. 새 A 일정은 보드에서만 재생.</footer></body></html>`
await fs.writeFile(`${dir}/style.html`,html)
await fs.writeFile(`${dir}/scenes.json`,JSON.stringify(raw)+'\n')
await fs.writeFile(`${dir}/assets.json`,JSON.stringify(assets)+'\n')
console.log('장면',raw.length,'데이터',script.split('\n').length,'줄')
