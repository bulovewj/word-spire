import {fileURLToPath} from "node:url"
import fs from 'node:fs/promises'
export const root=fileURLToPath(new URL('../../../../',import.meta.url)).replace(/\/$/,'')
const frames=JSON.parse(await fs.readFile(`${root}/src/ui/sprites/frames.json`,'utf8'))
const all=[]
const add=a=>all.push({version:'v2-ai',memo:'',motion:'S',...a})
const sources={reader:'CH',dokkaebi:'EN',tiger:'EN',fox:'EN',seal:'FX',gourd:'UI',icons:'UI','card-kinds':'UI','card-frame':'UI'}
for(const [name,d] of Object.entries(frames))for(const [i,label] of d.labels.entries()){
 const character=['reader','dokkaebi','tiger','fox'].includes(name)
 const id=name==='gourd'?'UI-gourd':name==='icons'?`UI-icon-${label}`:name==='card-kinds'?`UI-kind-${label}`:name==='card-frame'?'UI-card-frame':`${sources[name]}-${name}-${label}`
 const a={id,name,label,index:i,file:`../../src/ui/sprites/${name}.png`,w:d.width,h:d.height,count:d.frames.length,status:character?'초안':'완성',scenes:'03~11·13·15',slot:character?(name==='reader'?3:2):8,scale:2,motion:'S'}
 if(character){a.use=`BattleBars.tsx·usePoses.ts — ${name==='reader'?'나':name==='dokkaebi'?'1층 적':name==='tiger'?'2층 적':'3층 적'}`;a.memo='현행 게임용 v1. 다음 C에서 세부와 자연스러운 몸 동작을 보강할 후보.'
  if(label==='idle') {a.use+=' / 사건 없음';a.motion='R+A(제안)';if(name!=='reader')a.use+='; 현재 idle→idle2 1.2초 2칸 반복'}
  if(label==='idle2'){a.use+=' / idle 시작 2칸 루프의 두 번째';a.motion='현행 1.2초 루프→R+A(제안)'}
  if(label==='attack'){a.use+=' / 적 턴 종료 공격 뒤 700ms';a.motion='E'}
  if(label==='flinch'){a.use+=' / 질문·반박 정타·약타 뒤 700ms';a.motion='E'}
  if(label==='point'){a.use+=' / 질문·반박 정타·약타 뒤 700ms';a.motion='E'}
  if(label==='defend'){a.use+=' / 낱말 뜻 통과 후 계속 누르면 700ms';a.motion='E'}
  if(label==='down'){a.use+=' / outcome=lost 동안 고정';a.scenes='15'}
  if(label==='stamp'){a.use+=' / outcome=won 동안 고정';a.scenes='11'}
  if(name==='tiger')a.memo+=' 얼굴 줄무늬가 눈을 가림: 다시 그릴 후보.'
 }else if(name==='seal'){a.use='BattleScreen.tsx — outcome=won, fold→pour→closed 720ms 한 번. 줄이기에서는 closed';a.slot=15;a.scenes='11';a.motion=label==='closed'?'S':'E(720ms 현행)'}
 else if(name==='gourd'){a.use='TitleScreen.tsx — 탑 선택 버튼의 32px 그림';a.slot=2;a.scenes='01';a.scale=1}
 else if(name==='icons'){
  a.slot={think:7,damage:4,defense:6,fog:5,evidence:12,clue:11,sure:13,unsure:14,seal:10,hit:10,weak:10,fail:10}[label]
  a.scale=label==='think'?2:1
  const uses={think:'BattleBars: 남은 생각력 3칸. 쓴 칸도 불투명도 0.3으로 남음',damage:'BattleBars: 다음 공격·받을 피해; eventText: 적 공격 사건',defense:'BattleBars: 방어 배지; eventText: 낱말 성공 사건',fog:'BattleBars: 보호막이 있을 때; eventText: 안개 성공 사건',evidence:'QuestionPanel: 근거 안내',clue:'QuestionPanel: 단서 버튼; eventText: 단서 사건',sure:'QuestionPanel: 확실 버튼',unsure:'QuestionPanel: 애매 버튼',seal:'eventText: 요약 해금·성공 사건',hit:'eventText: 질문·반박 정타 사건',weak:'eventText: 질문·반박 약타 사건',fail:'eventText: 질문·반박·낱말·안개·요약 실패 사건'}
  a.use=uses[label];a.scenes=['sure','unsure','evidence','clue'].includes(label)?'04':label==='seal'?'09·11':'03~11·13·15'
 }else if(name==='card-kinds'){a.scale=1;a.slot=label==='word'?9:8;a.use=label==='word'?'WordPouch: 낱말로 방어 제목':'Hand·handCards: 해당 카드가 남고 패널이 닫혔을 때';if(label==='author')a.use+='; 3층 헛소문 반박도 같은 표식';a.scenes=label==='seal'?'09':label==='word'?'03·05·09·13':'03·05·09·13'}
 else {a.status='안 씀';a.scale=1;a.scenes='—';a.slot='—';a.use='sprites.ts URLS에도 없음. Hand는 CSS 종이 테두리';a.memo='모서리가 문자처럼 보임. 16px 9-slice; 재제작 여부는 C 승인 때 결정.'}
 add(a)
}
add({id:'KEY-title-poster',file:'../../src/ui/media/title-korean-v1.png',w:1232,h:693,scale:'cover',scenes:'01·18',slot:1,status:'완성',use:'TitleScreen: 항상 바탕. 정지 설정·영상 오류 때 유일한 배경',memo:'396022B. 영상2판 첫프레임. CSS cover는 배경 예외; 캐릭터 시트의 정수 배율 규칙과 구분.'})
add({id:'KEY-title-loop',file:'../../src/ui/media/title-idle-korean-v1.mp4',w:1280,h:720,scale:'cover',scenes:'01·18',slot:1,status:'완성',use:'useTitleMotion: active일 때 포스터 위. OS 줄이기·수동 끄기·실패면 없음, 숨은 탭 pause',motion:'V: 재제작2판 6초 무음',memo:'요청7: 1,763,206B·720p·6초. 포스터 우선·지연 다운로드 유지.'})
add({id:'UI-grading-badge',version:'v1',file:'../../src/ui/components/GradingBadge.tsx',w:0,h:0,scale:1,scenes:'01~18',slot:16,status:'완성',use:'GradingBadge: idle/loading=준비 n%, failed=간이 채점, ready=의미 채점',memo:'HTML/CSS 글자 배지, PNG 없음. 캡처는 실제 상태이며 세 상태를 그림으로 꾸미지 않음.'})
for(const [id,file,w,h] of [['KEY-v4-reference','key-art-v4-korean.png',1672,941],['CH-reader-reference','reader-korean-concept.png',1536,1024],['UI-talisman-reference','talisman-frames-korean.png',1536,1024],['FX-tools-reference','sealing-tools-korean.png',1536,1024]])add({id,file:`concept/${file}`,w,h,scale:1,scenes:'기준·비교만',slot:'—',status:'안 씀',version:id.includes('v4')?'v4':'v1',use:'런타임 import 없음. 복식·구도 참조 전용',memo:id.includes('v4')?'승인된 디테일 기준. 배경 포함 RGB':'기존 컨셉에 반투명 번짐이 구워짐. 게임 스프라이트로 재사용 금지.'})
function propose(id,w,h,scenes,slot,use,memo,motion='S',frames=1){add({id,file:null,w,h,scale:1,scenes,slot,status:'없음(제안)',version:'v2 제안',use,memo,motion,frames})}
for(let i=1;i<=3;i++)propose(`BG-floor${i}`,i===3?160:128,i===3?128:96,'03~11·13·15',1,`현재 없음. ${i}층 적 그림 뒤 작은 서고 띠`,'본문 영역 금지. 전투 열 전체가 아닌 적 그림 칸 안; 코드 연결은 Claude.')
for(const [id,scene,note] of [['intro','02','닫힌궁에 들어간다는 위치 단서'],['reward','12','회복·새 낱말을 얻었다는 비문자 보조'],['complete','14','왕명 한 화제 완료를 구별'],['defeat','15','상처 없이 쉬었다 다시 도전하는 분위기']])propose(`KEY-${id}`,160,96,scene,20,'현재 없음. '+note,'새 장면·버튼·문구는 추가하지 않고 빈 여백에만. 모바일도 1배.')
propose('FX-fog-clear',64,64,'08 직후',17,'현재 eventText만. 보호막 해제의 작은 종이 조각','적 그림 칸 안 3칸 제안. 본문·가린 낱말 위로 날리지 않음. 사건 E 700ms 안', 'E',3)
const accents={reader:[['blink',2,'눈 깜빡임'],['grip',3,'부적패 고쳐 쥐기'],['hem',3,'세이지 옷자락']],dokkaebi:[['blink',2,'눈 깜빡임'],['tilt',3,'고개 기울임'],['settle',2,'어깨 다듬기']],tiger:[['blink',2,'눈 깜빡임'],['ear',2,'한쪽 귀 쫑긋'],['tail',3,'꼬리 끝 흔들기']],fox:[['blink',2,'눈 깜빡임'],['head',3,'머리 천천히 좌우'],['ear',2,'귀 쫑긋'],['tail',3,'꼬리 끝 한 번'] ]}
// 동작 묶음 제안은 아래 실제 프레임으로 대체했다.

const names={reader:'주인공-동작모음',dokkaebi:'먹안개도깨비-동작모음',tiger:'뒤섞는호랑이-동작모음',fox:'헛소문여우-동작모음',seal:'호리병봉인-세단계',gourd:'호리병',icons:'기능아이콘-열두종','card-kinds':'카드종류표식-여섯종','card-frame':'카드틀-미사용초안'}
for(const a of all.filter(a=>a.index!==undefined)){
 a.version='v2.1-clean';a.reviewSource=`concept/재제작-2판/정리시트/${names[a.name]}.png`;a.generationSource=`concept/재제작-2판/생성원본/${names[a.name]}.png`;a.reviewWidth=a.w*2;a.reviewHeight=a.h*2;a.reviewScale=1;a.status=a.name==='card-frame'?'안 씀':'초안';a.memo='키아트4판 기준 imagegen 재제작. 시트 공통 불투명15색 이하·알파0/255. 검토 마스터는 게임 호환본의2배 해상도.'
 if(a.name==='card-frame')a.memo+=' 문자 같은 모서리 제거. 16px 9-slice는 유지하되 현재 게임 import 없음.'
 if(['reader','dokkaebi','tiger','fox'].includes(a.name)){
  if(/^(blink|grip|hem|tilt|settle|ear|tail|head)\d+$/.test(a.label)){a.use='검토 보드 실제 A 동작 프레임. 게임의 무작위 일정에는 아직 미연결';a.motion='A(보드 연결)'}
  else if(['idle','idle2'].includes(a.label))a.motion='현행 대기 / R+A는 보드만'
 }
}
export const assets=all
export {accents}
if(process.argv[1]?.endsWith('/assets.mjs')){
 const dir=`${root}/docs/design/board`;await fs.mkdir(dir,{recursive:true})
 await fs.writeFile(`${dir}/assets.json`,JSON.stringify(all)+'\n')
 console.log('에셋',all.length,all.reduce((s,a)=>(s[a.status]=(s[a.status]||0)+1,s),{}))
}
