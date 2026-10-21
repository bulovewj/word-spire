// Reproduce from repository root: node docs/design/concept/source/game-build.mjs
import path from 'node:path';
import {atlas,fs} from './game-pixel.mjs';
import {reader} from './game-reader.mjs';
import {dokkaebi,tiger,fox} from './game-enemies.mjs';
import {seal,gourd} from './game-tools.mjs';
import {icon,kind,cardFrame} from './game-ui.mjs';
import {preview} from './game-preview.mjs';
import {audit,specs} from './game-audit.mjs';
const root=path.resolve(process.env.WORD_SPIRE_ART_OUT??process.cwd()),dir=`${root}/src/ui/sprites`,concept=`${root}/docs/design/concept`;
await fs.mkdir(dir,{recursive:true});await fs.mkdir(concept,{recursive:true});
const maps={reader:Array.from({length:5},(_,i)=>reader(i)),dokkaebi:Array.from({length:4},(_,i)=>dokkaebi(i)),tiger:Array.from({length:4},(_,i)=>tiger(i)),fox:Array.from({length:4},(_,i)=>fox(i)),seal:[0,1,2].map(seal),gourd:[gourd()],icons:Array.from({length:12},(_,i)=>icon(i)),'card-frame':[cardFrame()],'card-kinds':Array.from({length:6},(_,i)=>kind(i))};
const descriptions={
 reader:'주인공 앞뒤 컨셉과 동일한 검은 낮은 묶음머리·먹빛 겹깃·크림 깃·세이지 안감·카고 주머니·발목 신발. 가리키기와 도장 포즈는 등판의 원형 용 문양을 표시. 오른쪽 방향, 대기/부채 방어/가리키기/무릎 굽힘/도장 찍기.',
 dokkaebi:'키 아트 v4의 둥근 코·굵은 눈썹·짧고 통통한 크림 몸·세이지 조끼·매듭 장식. 왼쪽 방향. 발은 고정하고 대기B 상체만 1픽셀 위로. 공격은 칸 안의 안개, 움찔은 종이 접힘.',
 tiger:'키 아트 v4의 둥근 민화풍 황토색 얼굴·크림 주둥이·먹빛 줄무늬·둥근 발·휘어진 꼬리. 왼쪽 방향. 대기B는 몸 1픽셀, 공격은 꼬리와 글줄 쪽지, 움찔은 종이 접힘.',
 fox:'키 아트 v4의 크림 털·뾰족한 귀·라벤더 꼬리 부채·먹빛 겹깃·금빛 매듭. 왼쪽 방향, 조금 큰 우두머리. 대기B 상체 1픽셀, 공격은 꼬리의 빈 소문 쪽지, 움찔은 종이 접힘.',
 seal:'공용 봉인: 글자 없는 종이/안개 접힘 → 같은 호리병의 입구로 안개가 들어감 → 마개와 구름 인영 꼬리표. 정면, 비폭력, 병의 바닥선은 세 칸 모두 동일.',
 gourd:'봉인 도구 컨셉과 동일한 두 둥근 크림/세이지 몸체·잘록한 허리·나무 마개·주홍 끈·작은 네모 꼬리표·구름 인영. 닫힌 정지 상태.',
 icons:'생각력 마패/공격 피해/부적 부채 방어/안개 보호막/근거 문장/단서/확실/애매/호리병 봉인/정타/약타/실패, 정확히 이 순서. 글자·숫자 없이 기능별 실루엣.',
 'card-frame':'한지 부적패 공통 9-slice. 48x48, 16픽셀 귀 네 곳만 구름·접힌 모서리 장식. 가운데 [16,16]부터 16x16은 정확히 #fffaf0. 중간 테두리는 늘릴 수 있는 단색 선.',
 'card-kinds':'한 장/이어진 두 장/두 말풍선/안개 곡선/호리병과 도장/종이 부채, 정확히 이 순서. 부적패 컨셉의 종류 표식을 24픽셀로 정리.'
};
const manifest={},assets={};
for(const[name,frames]of Object.entries(maps)){
 const[w,h,labels]=specs[name],a=atlas(frames);assets[name]=a;await a.save(`${dir}/${name}.png`);
 manifest[name]={width:w,height:h,frames:labels.map((_,i)=>({x:i*w,y:0,width:w,height:h})),labels};
 const prompt=`[요청4] 실제 제작 지시문\n${descriptions[name]}\n칸 ${w}×${h}, ${frames.length}프레임 가로 1줄: ${labels.join(', ')}.\n참조: docs/design/concept/key-art-v4-korean.png, reader-korean-concept.png, sealing-tools-korean.png.\n외곽선 #2f2a3d, 제한된 단색 팔레트, 계열별 2단계 이하. 논리 1픽셀=PNG 1픽셀, 알파 0/255만. 글자·숫자·무기·피해 표현·그림자·글로우·번짐·AA 없음.\n\n제작: 승인된 컨셉을 참조해 코드의 정수 좌표로 새로 찍은 픽셀맵. image_gen 호출 없음.\n후처리: 없음. 원본 컨셉 PNG를 축소/추출/알파 임계값 보정하지 않음. 각 픽셀 RGBA를 직접 기록하며 투명 RGB는 0.\n재생성: 저장소 루트에서 node docs/design/concept/source/game-build.mjs\n소스: docs/design/concept/source/game-*.mjs (기존 설치 sharp 사용, 새 의존성 없음).\n`;
 await fs.writeFile(`${dir}/${name}.prompt.txt`,prompt);
}
await fs.writeFile(`${dir}/frames.json`,'{\n'+Object.entries(manifest).map(([name,m])=>`  ${JSON.stringify(name)}: ${JSON.stringify(m)}`).join(',\n')+'\n}\n');
await preview(assets,`${concept}/sprites-preview.png`);
await fs.writeFile(`${concept}/sprites-preview.prompt.txt`,'요청4 확인용 미리보기. 게임용 원본 9개를 #f5eedb 바탕에 각 픽셀 4×4 정사각형으로 복사한다. 행 순서는 reader/dokkaebi/tiger/fox/seal(옆 gourd·card-frame)/icons/card-kinds. 자산 이름은 그림 밖 검수용 라벨이며 런타임 PNG에는 없다. 재생성: node docs/design/concept/source/game-build.mjs. image_gen·리샘플링·AA·필터 없음.\n');
const result=await audit(root);
console.log(JSON.stringify(result.files.map(f=>({name:f.name,size:[f.width,f.height],colors:f.opaqueColorCount,alpha:f.alphaValues})),null,2));
