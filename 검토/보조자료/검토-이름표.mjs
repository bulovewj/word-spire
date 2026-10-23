export const characterNames={reader:'주인공',dokkaebi:'먹안개도깨비',tiger:'뒤섞는호랑이',fox:'헛소문여우'}
const poses={idle:'대기',idle2:'대기보조',defend:'방어',point:'근거가리키기',down:'패배',stamp:'봉인도장',attack:'공격',flinch:'움찔',blink:'눈깜빡임',grip:'부적고쳐쥐기',hem:'옷자락',tilt:'고개기울이기',settle:'어깨다듬기',ear:'귀쫑긋',tail:'꼬리흔들기',head:'고개좌우'}
const symbols={think:'생각력',damage:'공격피해',defense:'방어',fog:'안개보호막',evidence:'근거문장',clue:'단서보기',sure:'확실',unsure:'애매',seal:'봉인',hit:'정타',weak:'약타',fail:'실패'}
const kinds={literal:'거기있음',connect:'연결',author:'글쓴이와나',fog:'안개걷기',seal:'요약봉인',word:'낱말방어'}
export const sheetNames={reader:'주인공-동작모음',dokkaebi:'먹안개도깨비-동작모음',tiger:'뒤섞는호랑이-동작모음',fox:'헛소문여우-동작모음',seal:'호리병봉인-세단계',gourd:'호리병',icons:'기능아이콘-열두종','card-kinds':'카드종류표식-여섯종','card-frame':'카드틀-미사용초안'}
const named={
 'UI-gourd':'호리병','UI-card-frame':'카드틀-미사용초안','KEY-title-poster':'시작화면-정지배경','KEY-title-loop':'시작화면-대기영상','UI-grading-badge':'채점상태배지',
 'KEY-v4-reference':'한국풍-키아트-4판','CH-reader-reference':'주인공-앞뒤-복식참고','UI-talisman-reference':'부적카드틀-참고','FX-tools-reference':'봉인도구-참고',
 'BG-floor1':'일층-서고배경-제안','BG-floor2':'이층-서고배경-제안','BG-floor3':'삼층-서고배경-제안',
 'KEY-intro':'탑소개-삽화-제안','KEY-reward':'층보상-삽화-제안','KEY-complete':'탑완료-삽화-제안','KEY-defeat':'패배-삽화-제안','FX-fog-clear':'안개걷힘-연출-제안',
 'FX-seal-fold':'봉인-종이접기','FX-seal-pour':'봉인-호리병담기','FX-seal-closed':'봉인-완료'
}
export function assetName(a){
 if(named[a.id])return named[a.id]
 if(a.id.startsWith('UI-icon-'))return '아이콘-'+symbols[a.id.slice(8)]
 if(a.id.startsWith('UI-kind-'))return '카드표식-'+kinds[a.id.slice(8)]
 const [,name,pose]=a.id.split('-')
 const base=pose?.replace(/\d+$/,'');const suffix=pose?.match(/\d+$/)?.[0];
 if(characterNames[name]&&(poses[pose]||poses[base]))return characterNames[name]+'-'+(poses[pose]||poses[base]+'-'+suffix)
 throw Error('새 에셋의 한글 이름을 검토-이름표.mjs에 먼저 등록해 주세요: '+a.id)
}
export function captureName(s){
 const base={1:'시작화면',2:'탑소개',3:'전투시작',4:'질문패널',5:'정타결과',6:'낱말입력',7:'낱말실패',8:'안개걷기',9:'요약카드등장',10:'요약입력',11:'층봉인승리',12:'층보상',13:'화면크기별전투',14:'탑완료',15:'패배',16:'내기록',17:'선생님화면',18:'채점상태배지'}
 const file=s.file.split('/').at(-1)
 let suffix=file.includes('mobile')?'-휴대폰':''
 if(file.includes('saved'))suffix+='-이어하기'
 if(file.includes('motion'))suffix+='-영상켜짐'
 if(file.includes('floor2'))suffix+='-이층'
 if(file.includes('floor3'))suffix+='-삼층'
 if(file.includes('rumor'))suffix+='-헛소문반박'
 if(file.includes('desktop'))suffix+='-노트북'
 if(file.includes('fox'))suffix+='-여우'
 if(s.num===13&&file==='13.png')suffix='-휴대폰-호랑이'
 return `${String(s.num).padStart(2,'0')}-${base[s.num]}${suffix}.png`
}
